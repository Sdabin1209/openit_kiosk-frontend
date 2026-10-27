// 전수 점검(head/docs/audit/kiosk-frontend.md) 지적 수정 시험: P1 참조 재사용, P3 유휴 초기화, P4 마이크/반복 상한,
// P5 위험 정지 대기 안내, H-2 정지 상태 확인, P16 종료 실패, 임상 값 위치.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import { PublicApiClient } from "../api/client.ts";
import { createStartHolder } from "../api/device.ts";
import { KioskFlow } from "../apps/kiosk/flow.ts";
import * as clinical from "../apps/kiosk/clinical.ts";
import { json, ok, settle } from "./helpers.ts";

const say = (t: string) => ({ text: t, confidence: 0.9 });
const RISK = "확인이 필요합니다. 직원이 도와드릴 때까지 기다려 주세요.";
const sig = (staff_alert: string, write_committed = "COMMITTED") => ({ session_id: "s", write_committed, staff_alert });

/** 가짜 서버. state는 GET /state 응답, turn은 발화 응답. 호출 본문을 기록한다. */
function server(o: { turn?: () => Response; state?: () => Response; end?: () => Response } = {}) {
  const bodies: any[] = []; let gets = 0;
  const api = new PublicApiClient({ now: () => 0, sleep: async () => {}, retry: { maxAttempts: 1 }, fetch: (async (_u: string, init: RequestInit) => {
    if (init.method === "GET") { gets++; return (o.state ?? (() => json({ session_id: "s", state: "ACTIVE", resume_text: null })))(); }
    const b = JSON.parse(init.body as string); bodies.push(b);
    if (b.kind === "SESSION_START") return ok("첫 질문");
    if (b.kind === "SESSION_END") return (o.end ?? (() => ok(null)))();
    return (o.turn ?? (() => ok("다음 질문")))();
  }) as any });
  return { api, bodies, gets: () => gets };
}
function fakeTimers() {
  const q: Array<{ fn: () => void; ms: number }> = [];
  return { q, timers: { set: (fn: () => void, ms: number) => { const t = { fn, ms }; q.push(t); return t; }, clear: (h: unknown) => { const i = q.indexOf(h as any); if (i >= 0) q.splice(i, 1); } } };
}
const manualSleep = () => { const s: Array<() => void> = []; return { sleep: () => new Promise<void>((r) => s.push(r)), step: async (n = 1) => { for (let i = 0; i < n; i++) { await settle(); s.splice(0).forEach((r) => r()); } await settle(); } }; };

// ---- P1 ----
test("P1: 한 번 쓴 환자 참조는 다음 시작에 다시 쓰이지 않는다(기기 토큰은 유지)", async () => {
  const h = createStartHolder(async () => ({ deviceToken: "tok", subjectRef: "visit:1", subjectInvalid: false }));
  const a = await h.take(), b = await h.take();
  assert.equal(a.subjectRef, "visit:1");
  assert.equal(b.subjectRef, null);
  assert.equal(b.deviceToken, "tok");
  assert.equal(h.deviceToken(), "tok");
});

test("P1: 두 번째 환자 세션은 참조 없이 시작하고 화면 표시(startNotice)가 켜진다", async () => {
  const { api, bodies } = server();
  const h = createStartHolder(async () => ({ deviceToken: "tok", subjectRef: "visit:1", subjectInvalid: false }));
  const flow = new KioskFlow(api, { startValues: () => h.take(), idleMs: 0 });
  await flow.start();
  assert.equal(bodies[0].subject_ref, "visit:1");
  assert.equal(flow.current.startNotice, undefined);
  await flow.end(); flow.reset();
  await flow.start();
  assert.equal(flow.current.state, "LISTENING");
  assert.equal("subject_ref" in bodies.filter((b) => b.kind === "SESSION_START")[1], false, "이전 환자 참조를 보내지 않는다");
  assert.equal(flow.current.startNotice, "NO_SUBJECT_REF");
  flow.reset();
});

// ---- P3 ----
test("P3: 말하기 대기에서 입력이 없으면 세션을 끝내고 처음 화면으로 돌아간다, 조작하면 다시 센다", async () => {
  const { api, bodies } = server(); const t = fakeTimers();
  const flow = new KioskFlow(api, { idleMs: 60_000, timers: t.timers });
  await flow.start();
  assert.equal(t.q.length, 1); assert.equal(t.q[0]!.ms, 60_000);
  const first = t.q[0]; flow.touch();
  assert.equal(t.q.length, 1); assert.notEqual(t.q[0], first, "조작하면 타이머를 새로 건다");
  t.q[0]!.fn(); await settle();
  assert.equal(flow.current.state, "IDLE");
  assert.equal(flow.current.text, null, "응답 문장을 지운다");
  assert.deepEqual(bodies.map((b) => b.kind), ["SESSION_START", "SESSION_END"]);
});

test("P3: 직원 호출 화면도 유휴 시간이 지나면 처음 화면으로, 위험 정지 대기에는 유휴 타이머가 없다", async () => {
  const { api } = server({ turn: () => ok(RISK, sig("DELIVERED")) }); const t = fakeTimers();
  const flow = new KioskFlow(api, { idleMs: 1000, timers: t.timers, sleep: () => new Promise(() => {}) });
  await flow.start(); await flow.hear(say("위험"));
  assert.equal(flow.current.state, "WAITING_STAFF");
  assert.equal(t.q.length, 0, "위험 정지 대기는 세션을 끝내지 않는다");
  flow.reset(); await flow.start();
  flow.callStaff(); assert.equal(flow.current.state, "CALL_STAFF");
  t.q[0]!.fn(); assert.equal(flow.current.state, "IDLE");
});

// ---- P4 ----
test("P4: 마이크 거부는 화면 입력으로 대체되고(textFallback) 직원 호출 상한까지만 다시 묻는다", async () => {
  const { api } = server();
  const flow = new KioskFlow(api, { idleMs: 0 });
  await flow.start();
  flow.sttError("not-allowed");
  assert.equal(flow.current.state, "REPEAT_PROMPT");
  assert.equal(flow.current.textFallback, true);
  for (let i = 1; i < clinical.MAX_REPEAT; i++) flow.sttError("not-allowed");
  assert.equal(flow.current.state, "REPEAT_PROMPT", "상한까지는 계속 묻는다");
  flow.sttError("not-allowed");
  assert.equal(flow.current.state, "CALL_STAFF");
  assert.equal(flow.current.callStaffReason, "REPEAT_LIMIT");
});

test("P4: 성공한 턴이 있으면 반복 횟수가 초기화되고, 저장 실패(NOT_COMMITTED) 반복도 상한을 센다", async () => {
  let committed = false;
  const { api } = server({ turn: () => committed ? ok("다음") : ok("저장 못 함", sig("NONE", "NOT_COMMITTED")) });
  const flow = new KioskFlow(api, { idleMs: 0 });
  await flow.start();
  for (let i = 0; i < clinical.MAX_REPEAT; i++) await flow.hear(say("배가 아파요"));
  assert.equal(flow.current.state, "REPEAT_PROMPT");
  committed = true; await flow.hear(say("배가 아파요"));
  assert.equal(flow.current.state, "LISTENING");
  committed = false;
  for (let i = 0; i <= clinical.MAX_REPEAT; i++) await flow.hear(say("또 말함"));
  assert.equal(flow.current.callStaffReason, "REPEAT_LIMIT");
});

test("P4: 수동 입력은 최대 글자 수로 자르고 널 문자를 제거한다", async () => {
  const { api, bodies } = server(); const flow = new KioskFlow(api, { idleMs: 0 });
  await flow.start();
  await flow.hear(say("가".repeat(clinical.MAX_INPUT_CHARS + 50) + "\u0000"));
  const sent = bodies.find((b) => b.kind === "UTTERANCE").utterance as string;
  assert.equal(sent.length, clinical.MAX_INPUT_CHARS);
  assert.ok(!sent.includes("\u0000"));
});

// ---- P5 ----
test("P5: 위험 정지 대기 중 상태 조회가 실패하면 환자에게 안내하고 회복하면 지운다, 오래 기다리면 안내를 덧붙인다", async () => {
  let down = true;
  const { api } = server({ turn: () => ok(RISK, sig("DELIVERED")), state: () => down ? json({ code: "UNAVAILABLE" }, 503) : json({ session_id: "s", state: "PAUSED_RISK", resume_text: null }) });
  const ms = manualSleep();
  const flow = new KioskFlow(api, { idleMs: 0, pollMs: 1000, sleep: ms.sleep });
  await flow.start(); await flow.hear(say("위험"));
  await ms.step();
  assert.equal(flow.current.waitNotice, "SERVER_UNREACHABLE");
  assert.equal(flow.current.state, "WAITING_STAFF");
  down = false; await ms.step();
  assert.equal(flow.current.waitNotice, undefined);
  await ms.step(Math.ceil(clinical.LONG_WAIT_NOTICE_MS / 1000));
  assert.equal(flow.current.waitNotice, "LONG_WAIT");
  assert.equal(flow.current.state, "WAITING_STAFF", "세션은 끝내지 않는다");
  flow.reset();
});

// ---- H-2 ----
const sessionState = new Ajv2020({ strict: false }).compile(JSON.parse(readFileSync(new URL("../../boundary-contracts/schemas/SessionState.schema.json", import.meta.url), "utf8")));

test("H-2: 실서버 응답 모양(신호 null + 상태 PAUSED_RISK)이면 대기 화면으로 간다", async () => {
  // 계약 예시를 고정한다: 위험 정지 성공 때 survey는 turn_failure_signal=null을 주고 정지는 SessionState로만 보인다.
  const turn = { response_text: RISK, turn_failure_signal: null };
  const state = { session_id: "s", state: "PAUSED_RISK", resume_text: null };
  assert.ok(sessionState(state), JSON.stringify(sessionState.errors));
  const { api } = server({ turn: () => json(turn), state: () => json(state) });
  const flow = new KioskFlow(api, { idleMs: 0, sleep: () => new Promise(() => {}) });
  await flow.start(); await flow.hear(say("가슴이 너무 아파요"));
  assert.equal(flow.current.state, "WAITING_STAFF");
  assert.equal(flow.current.text, RISK);
  const before = flow.current; await flow.hear(say("또 말함")); assert.equal(flow.current, before, "정지 중에는 말을 받지 않는다");
});

test("H-2: 신호 null이고 상태가 ACTIVE면 평소처럼 LISTENING, 상태 조회가 실패해도 환자 턴은 막지 않는다", async () => {
  const a = server({ turn: () => json({ response_text: "다음 질문", turn_failure_signal: null }) });
  const f1 = new KioskFlow(a.api, { idleMs: 0 }); await f1.start(); await f1.hear(say("네"));
  assert.equal(f1.current.state, "LISTENING"); assert.equal(a.gets(), 1);
  const b = server({ turn: () => json({ response_text: "다음 질문", turn_failure_signal: null }), state: () => json({ code: "X" }, 500) });
  const f2 = new KioskFlow(b.api, { idleMs: 0 }); await f2.start(); await f2.hear(say("네"));
  assert.equal(f2.current.state, "LISTENING");
});

test("H-2: DELIVERED 신호가 오면 상태 조회 없이 대기 화면(기존 동작 유지)", async () => {
  const a = server({ turn: () => ok(RISK, sig("DELIVERED")) });
  const f = new KioskFlow(a.api, { idleMs: 0, sleep: () => new Promise(() => {}) }); await f.start(); await f.hear(say("위험"));
  assert.equal(f.current.state, "WAITING_STAFF"); assert.equal(a.gets(), 0);
});

// ---- P16 ----
test("P16: 종료 요청이 서버에 닿지 않으면 종료 화면에 endFailed를 표시하고, 이미 끝난 세션(404·409)은 실패로 보지 않는다", async () => {
  const a = server({ end: () => json({ code: "UNAVAILABLE" }, 503) });
  const f = new KioskFlow(a.api, { idleMs: 0 }); await f.start(); await f.end();
  assert.equal(f.current.state, "ENDED"); assert.equal(f.current.endFailed, true);
  for (const st of [404, 409]) {
    const b = server({ end: () => json({ code: "X" }, st) });
    const g = new KioskFlow(b.api, { idleMs: 0 }); await g.start(); await g.end();
    assert.equal(g.current.endFailed, undefined, `status ${st}`);
  }
  const c = server(); const h = new KioskFlow(c.api, { idleMs: 0 }); await h.start(); await h.end();
  assert.equal(h.current.endFailed, undefined);
});

// ---- 임상 값 한 곳 ----
test("임상 판단 값은 clinical.ts 한 곳에 있고 사용자 결정 U10 표시가 붙어 있다", () => {
  const src = readFileSync(new URL("../apps/kiosk/clinical.ts", import.meta.url), "utf8");
  for (const name of ["MIN_CONFIDENCE", "ENDED_RESET_MS", "IDLE_RESET_MS", "MAX_REPEAT", "LONG_WAIT_NOTICE_MS"]) {
    const lines = src.split("\n"), line = lines.findIndex((l) => l.startsWith(`export const ${name}`));
    assert.ok(line > 0, name);
    let top = line; while (top > 0 && lines[top - 1]!.startsWith(" *") || lines[top - 1]?.startsWith("/**")) top--;
    assert.match(lines.slice(top, line).join("\n"), /사용자 결정 U10/, `${name} 위 주석`);
  }
  const stt = readFileSync(new URL("../apps/kiosk/stt.ts", import.meta.url), "utf8");
  assert.doesNotMatch(stt, /MIN_CONFIDENCE\s*=\s*0/);
  const main = readFileSync(new URL("../apps/kiosk/main.ts", import.meta.url), "utf8");
  assert.doesNotMatch(main, /\b8000\b/);
});
