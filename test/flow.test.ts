import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { PublicApiClient } from "../api/client.ts";
import { KioskFlow } from "../apps/kiosk/flow.ts";
import { hang, json, ok, settle } from "./helpers.ts";

afterEach(() => { stateFn = () => ({ state: "ACTIVE", resume_text: null }); }); // 시험 간 공유 상태 초기화
const say = (t: string) => ({ text: t, confidence: 0.9 });
let stateFn: () => any = () => ({ state: "ACTIVE", resume_text: null }); // 턴마다 상태를 확인하므로 기본은 정지 아님(정지 시험은 각자 설정)
// 상태 폴링 대기는 가짜 시계: sleep은 step()이 풀어 줄 때만 끝난다(실제 타이머에 의존하지 않는다).
const sleepers: Array<() => void> = [];
const step = async (n = 1) => { for (let i = 0; i < n; i++) { await settle(); sleepers.splice(0).forEach((r) => r()); } await settle(); };
function make(handler: (body: any, init: RequestInit) => Promise<Response> | Response) {
  const calls: any[] = [];
  const polls: string[] = [];
  const api = new PublicApiClient({ timeoutMs: 250, retry: { maxAttempts: 3 }, sleep: async () => {}, fetch: (async (u: string, init: RequestInit) => {
    if (init.method === "GET") { polls.push(u); return json({ session_id: "s", ...stateFn() }); }
    const body = JSON.parse(init.body as string); calls.push(body); return handler(body, init);
  }) as any });
  return { flow: new KioskFlow(api, { pollMs: 2, sleep: () => new Promise<void>((r) => sleepers.push(r)) }), calls, polls };
}

test("정상 흐름: 시작 -> 듣기 -> 응답 -> 종료", async () => {
  const { flow, calls } = make((b) => ok(b.kind === "SESSION_END" ? null : "질문"));
  await flow.start();
  assert.equal(flow.current.state, "LISTENING");
  await flow.hear(say("배가 아파요"));
  assert.equal(flow.current.state, "LISTENING");
  assert.equal(flow.current.text, "질문");
  await flow.end();
  assert.equal(flow.current.state, "ENDED");
  assert.deepEqual(calls.map((c) => c.kind), ["SESSION_START", "UTTERANCE", "SESSION_END"]);
  assert.ok(calls[1].turn_id);
});

test("빈 STT와 낮은 신뢰도는 서버로 보내지 않고 다시 말해 달라고 한다", async () => {
  // 연달아 다시 말하기 상한(MAX_REPEAT, 잠정 3회)이 있으므로 입력마다 새 흐름으로 확인한다.
  for (const r of [null, { text: "", confidence: null }, { text: " . ", confidence: 0.9 }, { text: "네", confidence: 0.1 }]) {
    const { flow, calls } = make(() => ok("질문"));
    await flow.start();
    await flow.hear(r);
    assert.equal(flow.current.state, "REPEAT_PROMPT");
    assert.equal(flow.current.repeatReason, "EMPTY_STT");
    assert.equal(calls.filter((c) => c.kind === "UTTERANCE").length, 0);
  }
});

test("DELIVERY_FAILED이면 직원 호출 화면", async () => {
  const { flow } = make((b) => b.kind === "UTTERANCE" ? ok("대기", { session_id: "s", write_committed: "COMMITTED", staff_alert: "DELIVERY_FAILED" }) : ok("시작"));
  await flow.start(); await flow.hear(say("위험"));
  assert.equal(flow.current.state, "CALL_STAFF");
  assert.equal(flow.current.callStaffReason, "DELIVERY_FAILED");
});

test("DELIVERED이면 직원 대기 화면, NOT_COMMITTED이면 다시 말해 달라고 안내", async () => {
  let sig: any;
  const { flow } = make((b) => b.kind === "UTTERANCE" ? ok("문장", sig) : ok("시작"));
  await flow.start();
  sig = { session_id: "s", write_committed: "COMMITTED", staff_alert: "DELIVERED" };
  await flow.hear(say("위험"));
  assert.equal(flow.current.state, "WAITING_STAFF");
  flow.reset();
  await flow.start();
  sig = { session_id: "s", write_committed: "NOT_COMMITTED", staff_alert: "NONE" };
  await flow.hear(say("다시"));
  assert.equal(flow.current.state, "REPEAT_PROMPT");
  assert.equal(flow.current.repeatReason, "NOT_COMMITTED");
});

test("DELIVERY_FAILED는 NOT_COMMITTED보다 우선한다", async () => {
  const { flow } = make((b) => b.kind === "UTTERANCE" ? ok(null, { session_id: "s", write_committed: "NOT_COMMITTED", staff_alert: "DELIVERY_FAILED" }) : ok("시작"));
  await flow.start(); await flow.hear(say("x"));
  assert.equal(flow.current.state, "CALL_STAFF");
});

test("재시도 3회 실패하면 직원 호출 화면, 요청은 모두 같은 turn_id", async () => {
  const { flow, calls } = make((b, init) => (b.kind === "UTTERANCE" ? hang(init) : ok("시작")));
  await flow.start(); await flow.hear(say("아파요"));
  assert.equal(flow.current.state, "CALL_STAFF");
  assert.equal(flow.current.callStaffReason, "RETRY_EXHAUSTED");
  const ids = calls.filter((c) => c.kind === "UTTERANCE").map((c) => c.turn_id);
  assert.equal(ids.length, 3);
  assert.equal(new Set(ids).size, 1);
});

test("턴마다 turn_id가 다르다", async () => {
  const { flow, calls } = make(() => ok("q"));
  await flow.start(); await flow.hear(say("하나")); await flow.hear(say("하나"));
  const ids = calls.filter((c) => c.kind === "UTTERANCE").map((c) => c.turn_id);
  assert.notEqual(ids[0], ids[1]);
});

test("409는 직원 대기, 404는 처음 화면, 401은 직원 호출", async () => {
  for (const [st, want] of [[409, "WAITING_STAFF"], [404, "IDLE"], [401, "CALL_STAFF"]] as const) {
    const { flow } = make((b) => (b.kind === "UTTERANCE" ? json({ code: "X" }, st) : ok("시작")));
    await flow.start(); await flow.hear(say("x"));
    assert.equal(flow.current.state, want);
    flow.reset();
  }
});

test("위험 정지 화면은 상태를 폴링하고 ACTIVE가 되면 resume_text를 보여 주며 이어간다", async () => {
  stateFn = () => ({ state: "PAUSED_RISK", resume_text: null });
  const { flow, polls, calls } = make((b) => b.kind === "UTTERANCE" ? ok("대기", { session_id: "s", write_committed: "COMMITTED", staff_alert: "DELIVERED" }) : ok("시작"));
  await flow.start(); await flow.hear(say("위험"));
  assert.equal(flow.current.state, "WAITING_STAFF");
  await step(3);
  assert.ok(polls.length >= 3, "여러 번 폴링");
  assert.match(polls[0], /\/sessions\/[^/]+\/state$/);
  assert.equal(flow.current.state, "WAITING_STAFF");
  // 대기 중 말은 서버로 가지 않는다
  const n = calls.length; await flow.hear(say("또 말함")); assert.equal(calls.length, n);
  stateFn = () => ({ state: "ACTIVE", resume_text: "이어서 진행합니다" });
  await step(2);
  assert.equal(flow.current.state, "LISTENING");
  assert.equal(flow.current.text, "이어서 진행합니다");
  const after = polls.length; await step(3); assert.equal(polls.length, after, "재개 뒤 폴링 중단");
});

test("위험 정지 중 직원이 종료하면 ENDED 화면", async () => {
  stateFn = () => ({ state: "PAUSED_RISK", resume_text: null });
  const { flow } = make((b) => b.kind === "UTTERANCE" ? ok("대기", { session_id: "s", write_committed: "COMMITTED", staff_alert: "DELIVERED" }) : ok("시작"));
  await flow.start(); await flow.hear(say("위험"));
  stateFn = () => ({ state: "ENDED", resume_text: null });
  await step(2);
  assert.equal(flow.current.state, "ENDED");
});

test("발화를 저장소·쿠키·콘솔에 남기지 않는다", async () => {
  const touched: string[] = [];
  const trap = (n: string) => new Proxy({}, { get: (_t, p) => { touched.push(`${n}.${String(p)}`); return () => {}; } });
  const g = globalThis as any;
  const saved = { localStorage: g.localStorage, sessionStorage: g.sessionStorage, document: g.document };
  g.localStorage = trap("localStorage"); g.sessionStorage = trap("sessionStorage"); g.document = trap("document");
  const logs: unknown[][] = [];
  const orig = { log: console.log, error: console.error, warn: console.warn, info: console.info, debug: console.debug };
  for (const k of Object.keys(orig)) (console as any)[k] = (...a: unknown[]) => logs.push(a);
  try {
    const { flow } = make((b) => (b.kind === "UTTERANCE" ? hang({ signal: undefined } as any) : ok("시작")));
    const { flow: f2 } = make(() => ok("응답"));
    await f2.start(); await f2.hear(say("비밀 발화")); await f2.end();
    void flow;
  } finally {
    Object.assign(console, orig);
    for (const [k, v] of Object.entries(saved)) g[k] = v;
  }
  assert.deepEqual(touched, []);
  assert.deepEqual(logs, []);
});

test("3차 점검 K-a: CALL_STAFF의 처음으로는 서버 세션 종료를 먼저 보내고(실패하면 한 번 더) 실패해도 화면은 처음으로 간다", async () => {
  let endFails = 0;
  const { flow, calls } = make((b) => {
    if (b.kind === "SESSION_END") { endFails++; return new Response("{}", { status: 400 }); }
    return ok("시작");
  });
  await flow.start();
  flow.callStaff();
  assert.equal(flow.current.callStaffReason, "STAFF_REQUESTED");
  await flow.leaveCallStaff();
  assert.equal(flow.current.state, "IDLE");
  assert.equal(calls.filter((c) => c.kind === "SESSION_END").length, 2, "종료 요청 2회(재시도 한 번)");
  assert.ok(endFails === 2);
});

test("3차 점검 K-a: 종료가 성공하면 한 번만 보내고 IDLE", async () => {
  const { flow, calls } = make((b) => ok(b.kind === "SESSION_END" ? null : "시작"));
  await flow.start(); flow.callStaff(); await flow.leaveCallStaff();
  assert.equal(flow.current.state, "IDLE");
  assert.equal(calls.filter((c) => c.kind === "SESSION_END").length, 1);
});

test("3차 점검 K-b: DELIVERY_FAILED의 처음으로는 한 번 더 확인하고, 서버 세션은 끝내지 않는다(흔적 보존)", async () => {
  const { flow, calls } = make((b) => b.kind === "UTTERANCE" ? ok("대기", { session_id: "s", write_committed: "COMMITTED", staff_alert: "DELIVERY_FAILED" }) : ok("시작"));
  await flow.start(); await flow.hear(say("위험"));
  assert.equal(flow.current.callStaffReason, "DELIVERY_FAILED");
  await flow.leaveCallStaff();
  assert.equal(flow.current.state, "CALL_STAFF"); assert.equal(flow.current.confirmLeave, true);
  flow.cancelLeave(); assert.equal(flow.current.confirmLeave, false); await settle(); // NOT_NOTIFIED 보고가 끝나야 버튼이 다시 풀린다
  await flow.leaveCallStaff(); await flow.leaveCallStaff();
  assert.equal(flow.current.state, "IDLE");
  assert.equal(calls.filter((c) => c.kind === "SESSION_END").length, 0, "세션 종료 요청을 보내지 않는다");
});
