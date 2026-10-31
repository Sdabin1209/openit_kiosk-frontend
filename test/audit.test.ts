// 전수 점검(head/docs/audit/kiosk-frontend.md) 지적 수정 시험: P1 참조 재사용, P3 유휴 초기화, P4 마이크/반복 상한,
// P5 위험 정지 대기 안내, H-2 정지 상태 확인, P16 종료 실패, 임상 값 위치.
import { contractJson } from "../scripts/contract-source.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import { createPublicApiClient } from "../src/wiring/public_api.ts";
import { createStartHolder } from "../src/components/start_values.ts";
import { createKioskFlow } from "../src/wiring/kiosk.ts";
import * as clinical from "../src/config.ts";
import { json, ok, settle, started } from "./helpers.ts";

const say = (t: string) => ({ text: t, confidence: 0.9 });
const RISK = "확인이 필요합니다. 직원이 도와드릴 때까지 기다려 주세요.";
const sig = (staff_alert: string, write_committed = "COMMITTED") => ({ session_id: "s", write_committed, staff_alert });

/** 가짜 서버. state는 GET /state 응답, turn은 발화 응답. 호출 본문을 기록한다. */
function server(o: { turn?: () => Response; state?: () => Response; end?: () => Response } = {}) {
  const bodies: any[] = []; let gets = 0;
  const api = createPublicApiClient({ now: () => 0, sleep: async () => {}, retry: { maxAttempts: 1 }, fetch: (async (_u: string, init: RequestInit) => {
    if (init.method === "GET") { gets++; return (o.state ?? (() => json({ session_id: "s", state: "ACTIVE", resume_text: null })))(); }
    const b = JSON.parse(init.body as string); bodies.push(b);
    if (b.kind === "SESSION_START") return started("첫 질문");
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
  const a = await h.take();
  assert.equal((await h.take()).subjectRef, "visit:1", "시작이 접수되기 전에는 비우지 않는다(실패한 시작을 같은 참조로 다시 할 수 있다)");
  a.confirm!(); // 시작이 서버에 접수됨
  const b = await h.take();
  assert.equal(a.subjectRef, "visit:1");
  assert.equal(b.subjectRef, null);
  assert.equal(b.deviceToken, "tok");
  assert.equal(h.deviceToken(), "tok");
});

test("P1: 두 번째 환자 세션은 참조 없이 시작하고 화면 표시(startNotice)가 켜진다", async () => {
  const { api, bodies } = server();
  const h = createStartHolder(async () => ({ deviceToken: "tok", subjectRef: "visit:1", subjectInvalid: false }));
  const flow = createKioskFlow(api, { startValues: () => h.take(), idleMs: 0 });
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
  const flow = createKioskFlow(api, { idleMs: 60_000, timers: t.timers });
  await flow.start();
  assert.equal(t.q.length, 1); assert.equal(t.q[0]!.ms + clinical.IDLE_WARNING_MS, 60_000, "첫 타이머는 경고 시점(총 60초 중 마지막 경고 구간 앞)");
  const first = t.q[0]; flow.touch();
  assert.equal(t.q.length, 1); assert.notEqual(t.q[0], first, "조작하면 타이머를 새로 건다");
  t.q.shift()!.fn(); t.q.shift()!.fn(); await settle(); // 경고 시점 -> 만료 (#29: 만료 전 경고 단계가 생겼다)
  assert.equal(flow.current.state, "IDLE");
  assert.equal(flow.current.text, null, "응답 문장을 지운다");
  assert.deepEqual(bodies.map((b) => b.kind), ["SESSION_START", "SESSION_END"]);
});

// ---- P4 ----
test("P4: 마이크 거부는 화면 입력으로 대체되고(textFallback) 직원 호출 상한까지만 다시 묻는다", async () => {
  const { api } = server();
  const flow = createKioskFlow(api, { idleMs: 0 });
  await flow.start();
  flow.sttError("BLOCKED");
  assert.equal(flow.current.state, "REPEAT_PROMPT");
  assert.equal(flow.current.textFallback, true);
  for (let i = 1; i < clinical.MAX_REPEAT; i++) flow.sttError("BLOCKED");
  assert.equal(flow.current.state, "REPEAT_PROMPT", "상한까지는 계속 묻는다");
  flow.sttError("BLOCKED");
  assert.equal(flow.current.state, "CALL_STAFF");
  assert.equal(flow.current.callStaffReason, "REPEAT_LIMIT");
});

test("P4: 성공한 턴이 있으면 반복 횟수가 초기화되고, 저장 실패(NOT_COMMITTED) 반복도 상한을 센다", async () => {
  let committed = false;
  const { api } = server({ turn: () => committed ? ok("다음") : ok("저장 못 함", sig("NONE", "NOT_COMMITTED")) });
  const flow = createKioskFlow(api, { idleMs: 0 });
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
  const { api, bodies } = server(); const flow = createKioskFlow(api, { idleMs: 0 });
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
  const flow = createKioskFlow(api, { idleMs: 0, pollMs: 1000, sleep: ms.sleep });
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
const sessionState = new Ajv2020({ strict: false }).compile(contractJson("schemas/SessionState.schema.json"));

test("H-2: 실서버 응답 모양(신호 null + 상태 PAUSED_RISK)이면 대기 화면으로 간다", async () => {
  // 계약 예시를 고정한다: 위험 정지 성공 때 survey는 turn_failure_signal=null을 주고 정지는 SessionState로만 보인다.
  const turn = { response_text: RISK, turn_failure_signal: null };
  const state = { session_id: "s", state: "PAUSED_RISK", resume_text: null };
  assert.ok(sessionState(state), JSON.stringify(sessionState.errors));
  const { api } = server({ turn: () => json(turn), state: () => json(state) });
  const flow = createKioskFlow(api, { idleMs: 0, sleep: () => new Promise(() => {}) });
  await flow.start(); await flow.hear(say("가슴이 너무 아파요"));
  assert.equal(flow.current.state, "WAITING_STAFF");
  assert.equal(flow.current.text, RISK);
  const before = flow.current; await flow.hear(say("또 말함")); assert.equal(flow.current, before, "정지 중에는 말을 받지 않는다");
});

test("H-2: 신호 null이고 상태가 ACTIVE면 평소처럼 LISTENING, 상태 조회가 실패해도 환자 턴은 막지 않는다", async () => {
  const a = server({ turn: () => json({ response_text: "다음 질문", turn_failure_signal: null }) });
  const f1 = createKioskFlow(a.api, { idleMs: 0 }); await f1.start(); await f1.hear(say("네"));
  assert.equal(f1.current.state, "LISTENING"); assert.equal(a.gets(), 1);
  const b = server({ turn: () => json({ response_text: "다음 질문", turn_failure_signal: null }), state: () => json({ code: "X" }, 500) });
  const f2 = createKioskFlow(b.api, { idleMs: 0 }); await f2.start(); await f2.hear(say("네"));
  assert.equal(f2.current.state, "LISTENING");
});

test("H-2: DELIVERED 신호가 오면 상태 조회 없이 대기 화면(기존 동작 유지)", async () => {
  const a = server({ turn: () => ok(RISK, sig("DELIVERED")) });
  const f = createKioskFlow(a.api, { idleMs: 0, sleep: () => new Promise(() => {}) }); await f.start(); await f.hear(say("위험"));
  assert.equal(f.current.state, "WAITING_STAFF"); assert.equal(a.gets(), 0);
});

// ---- P16 ----
test("P16: 종료 요청이 서버에 닿지 않으면 종료 화면에 endFailed를 표시하고, 이미 끝난 세션(404·409)은 실패로 보지 않는다", async () => {
  const a = server({ end: () => json({ code: "UNAVAILABLE" }, 503) });
  const f = createKioskFlow(a.api, { idleMs: 0 }); await f.start(); await f.end();
  assert.equal(f.current.state, "ENDED"); assert.equal(f.current.endFailed, true);
  for (const st of [404, 409]) {
    const b = server({ end: () => json({ code: "X" }, st) });
    const g = createKioskFlow(b.api, { idleMs: 0 }); await g.start(); await g.end();
    assert.equal(g.current.endFailed, undefined, `status ${st}`);
  }
  const c = server(); const h = createKioskFlow(c.api, { idleMs: 0 }); await h.start(); await h.end();
  assert.equal(h.current.endFailed, undefined);
});

// ---- 임상 값 한 곳 ----
test("임상 판단 값은 config.ts 한 곳에 있고 사용자 결정 U10 표시가 붙어 있다", () => {
  const src = readFileSync(new URL("../src/config.ts", import.meta.url), "utf8");
  for (const name of ["ENDED_RESET_MS", "IDLE_RESET_MS", "MAX_REPEAT", "LONG_WAIT_NOTICE_MS"]) {
    const lines = src.split("\n"), line = lines.findIndex((l) => l.startsWith(`export const ${name}`));
    assert.ok(line > 0, name);
    let top = line; while (top > 0 && lines[top - 1]!.startsWith(" *") || lines[top - 1]?.startsWith("/**")) top--;
    assert.match(lines.slice(top, line).join("\n"), /사용자 결정 U10/, `${name} 위 주석`);
  }
  const stt = readFileSync(new URL("../src/components/stt_adapter.ts", import.meta.url), "utf8");
  assert.doesNotMatch(stt, /MIN_CONFIDENCE\s*=\s*0/);
  const main = readFileSync(new URL("../src/ui/kiosk_screen.ts", import.meta.url), "utf8");
  assert.doesNotMatch(main, /\b8000\b/);
});

// ---- K-1: 상태 x 유휴 타이머 ----
/** 가짜 서버(요청마다 제어 가능). hold가 켜지면 해당 종류 요청은 끝나지 않는다. */
function rig(o: { hold?: "SESSION_START" | "UTTERANCE"; turn?: () => Response; endFail?: boolean } = {}) {
  const kinds: string[] = []; const t = fakeTimers();
  const api = createPublicApiClient({ now: () => 0, sleep: async () => {}, retry: { maxAttempts: 1 }, fetch: ((_u: string, init: RequestInit) => {
    if (init.method === "GET") return Promise.resolve(json({ session_id: "s", state: "PAUSED_RISK", resume_text: null }));
    const b = JSON.parse(init.body as string); kinds.push(b.kind);
    if (o.hold === b.kind) return new Promise<Response>(() => {});
    if (b.kind === "SESSION_START") return Promise.resolve(started("첫 질문"));
    if (b.kind === "SESSION_END") return Promise.resolve(o.endFail ? json({ code: "UNAVAILABLE" }, 503) : ok(null));
    return Promise.resolve((o.turn ?? (() => ok("다음 질문")))());
  }) as any });
  const flow = createKioskFlow(api, { idleMs: 60_000, timers: t.timers, sleep: () => new Promise(() => {}) });
  return { flow, kinds, t, ends: () => kinds.filter((k) => k === "SESSION_END").length };
}
const DF = () => ok(RISK, sig("DELIVERY_FAILED")), DEL = () => ok(RISK, sig("DELIVERED")), NC = () => ok("저장 못 함", sig("NONE", "NOT_COMMITTED"));

const TABLE: Array<{ name: string; setup: (r: ReturnType<typeof rig>) => Promise<void>; state: string; timer: boolean; after: string; ends: number }> = [
  { name: "IDLE", setup: async () => {}, state: "IDLE", timer: false, after: "IDLE", ends: 0 },
  { name: "LISTENING", setup: async (r) => { await r.flow.start(); }, state: "LISTENING", timer: true, after: "IDLE", ends: 1 },
  { name: "REPEAT_PROMPT", setup: async (r) => { await r.flow.start(); await r.flow.hear(null); }, state: "REPEAT_PROMPT", timer: true, after: "IDLE", ends: 1 },
  { name: "CALL_STAFF(DELIVERY_FAILED)", setup: async (r) => { await r.flow.start(); await r.flow.hear(say("위험")); }, state: "CALL_STAFF", timer: false, after: "CALL_STAFF", ends: 0 },
  { name: "CALL_STAFF(환자가 직원 부르기)", setup: async (r) => { await r.flow.start(); r.flow.callStaff(); }, state: "CALL_STAFF", timer: false, after: "CALL_STAFF", ends: 0 },
  { name: "CALL_STAFF(다시 말하기 상한)", setup: async (r) => { await r.flow.start(); for (let i = 0; i <= clinical.MAX_REPEAT; i++) await r.flow.hear(null); }, state: "CALL_STAFF", timer: false, after: "CALL_STAFF", ends: 0 },
  { name: "WAITING_STAFF", setup: async (r) => { await r.flow.start(); await r.flow.hear(say("위험")); }, state: "WAITING_STAFF", timer: false, after: "WAITING_STAFF", ends: 0 },
  { name: "ENDED(종료 성공)", setup: async (r) => { await r.flow.start(); await r.flow.end(); }, state: "ENDED", timer: false, after: "ENDED", ends: 1 },
  { name: "ENDED(종료 요청 실패 안내)", setup: async (r) => { await r.flow.start(); await r.flow.end(); }, state: "ENDED", timer: false, after: "ENDED", ends: 1 },
];
for (const row of TABLE) {
  test(`K-1 표: ${row.name} -> 유휴 타이머 ${row.timer ? "있음" : "없음"}, 60초 뒤 ${row.after}, 종료 요청 ${row.ends}회`, async () => {
    const turn = row.name.includes("DELIVERY_FAILED") ? DF : row.name === "WAITING_STAFF" ? DEL : row.name.includes("다시 말하기") ? NC : undefined;
    const r = rig({ turn, endFail: row.name.includes("실패") });
    await row.setup(r);
    assert.equal(r.flow.current.state, row.state);
    if (row.name.includes("실패")) assert.equal(r.flow.current.endFailed, true);
    assert.equal(r.t.q.length, row.timer ? 1 : 0, "타이머 개수");
    while (r.t.q.length) r.t.q.shift()!.fn(); // 60초 경과: 경고 시점 -> 만료 순서로 울린다(#29)
    await settle();
    assert.equal(r.flow.current.state, row.after);
    assert.equal(r.ends(), row.ends, "SESSION_END 요청 횟수");
    assert.equal(r.t.q.length, 0, "이후에도 타이머가 새로 걸리지 않는다");
  });
}

test("K-1 표: STARTING·SENDING(요청 진행 중)에는 유휴 타이머가 없다", async () => {
  const a = rig({ hold: "SESSION_START" }); void a.flow.start(); await settle();
  assert.equal(a.flow.current.state, "STARTING"); assert.equal(a.t.q.length, 0);
  const b = rig({ hold: "UTTERANCE" }); await b.flow.start(); void b.flow.hear(say("네")); await settle();
  assert.equal(b.flow.current.state, "SENDING"); assert.equal(b.t.q.length, 0);
});

test("K-1: 유휴 종료 요청이 실패하면 처음 화면으로 돌리지 않고 종료 실패 안내를 유지한다", async () => {
  const r = rig({ endFail: true });
  await r.flow.start();
  while (r.t.q.length) r.t.q.shift()!.fn(); await settle(); // 경고 시점 -> 만료
  assert.equal(r.flow.current.state, "ENDED"); assert.equal(r.flow.current.endFailed, true);
  assert.equal(r.ends(), 1);
  assert.equal(r.t.q.length, 0, "안내에 자동 초기화 타이머가 없다");
  r.flow.reset(); assert.equal(r.flow.current.state, "IDLE"); // 명시적 동작(직원/환자가 처음으로)
});

test("K-1: DELIVERY_FAILED 화면은 오래 두어도 IDLE로 가지 않고 서버 세션을 건드리지 않는다(재현 시험)", async () => {
  const r = rig({ turn: DF });
  await r.flow.start(); await r.flow.hear(say("위험"));
  assert.equal(r.flow.current.callStaffReason, "DELIVERY_FAILED");
  assert.equal(r.t.q.length, 0);
  await settle(100);
  assert.equal(r.flow.current.state, "CALL_STAFF"); assert.equal(r.ends(), 0);
});

// ---- K-2 ----
test("K-2: 시작이 실패하면 환자 참조가 남아 같은 참조로 다시 시작하고, 성공한 뒤에는 다음 시작에 쓰이지 않는다", async () => {
  const bodies: any[] = []; let fail = true;
  const api = createPublicApiClient({ now: () => 0, sleep: async () => {}, retry: { maxAttempts: 1 }, fetch: (async (_u: string, init: RequestInit) => {
    const b = JSON.parse(init.body as string); bodies.push(b);
    if (b.kind === "SESSION_START" && fail) return json({ code: "UNAVAILABLE" }, 503);
    return b.kind === "SESSION_START" ? started("질문") : ok("질문");
  }) as any });
  const h = createStartHolder(async () => ({ deviceToken: "tok", subjectRef: "visit:9", subjectInvalid: false }));
  const flow = createKioskFlow(api, { startValues: () => h.take(), idleMs: 0 });
  await flow.start();
  assert.equal(flow.current.state, "CALL_STAFF");
  assert.equal(bodies[0].subject_ref, "visit:9");
  fail = false; flow.reset(); await flow.start();
  assert.equal(bodies[1].subject_ref, "visit:9", "실패한 시작은 참조를 쓰지 않은 것으로 본다");
  assert.equal(flow.current.state, "LISTENING");
  await flow.end(); flow.reset(); await flow.start();
  assert.equal("subject_ref" in bodies.filter((b) => b.kind === "SESSION_START").at(-1), false, "성공한 시작에 쓴 값은 재사용되지 않는다");
});

// ---- L ----
test("L: 입력 자르기는 코드 포인트 단위라 이모지 서로게이트 쌍을 가르지 않는다", async () => {
  const { api, bodies } = server(); const flow = createKioskFlow(api, { idleMs: 0 });
  await flow.start();
  await flow.hear(say("가".repeat(clinical.MAX_INPUT_CHARS - 1) + "😀😀😀"));
  const sent = bodies.find((b) => b.kind === "UTTERANCE").utterance as string;
  assert.equal(Array.from(sent).length, clinical.MAX_INPUT_CHARS);
  assert.ok(sent.endsWith("😀"));
  assert.doesNotMatch(sent, /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/, "외톨이 서로게이트 없음");
});
