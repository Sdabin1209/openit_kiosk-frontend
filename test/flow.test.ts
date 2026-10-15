import { test } from "node:test";
import assert from "node:assert/strict";
import { PublicApiClient } from "../api/client.ts";
import { KioskFlow } from "../apps/kiosk/flow.ts";
import { hang, json, ok } from "./helpers.ts";

const say = (t: string) => ({ text: t, confidence: 0.9 });
function make(handler: (body: any, init: RequestInit) => Promise<Response> | Response) {
  const calls: any[] = [];
  const api = new PublicApiClient({ timeoutMs: 20, retryDelayMs: 0, sleep: async () => {}, fetch: (async (_u: string, init: RequestInit) => {
    const body = JSON.parse(init.body as string); calls.push(body); return handler(body, init);
  }) as any });
  return { flow: new KioskFlow(api), calls };
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
  const { flow, calls } = make(() => ok("질문"));
  await flow.start();
  for (const r of [null, { text: "", confidence: null }, { text: " . ", confidence: 0.9 }, { text: "네", confidence: 0.1 }]) {
    await flow.hear(r);
    assert.equal(flow.current.state, "REPEAT_PROMPT");
    assert.equal(flow.current.repeatReason, "EMPTY_STT");
  }
  assert.equal(calls.filter((c) => c.kind === "UTTERANCE").length, 0);
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
  }
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
