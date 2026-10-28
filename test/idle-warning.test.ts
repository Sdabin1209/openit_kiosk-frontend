// #29 (표준성 점검 2026-10-29): 유휴 초기화에 만료 전 경고와 연장 수단이 있어야 한다.
// 기대값의 출처: WCAG 2.2 SC 2.2.1 Timing Adjustable(레벨 A)의 "Extend" 조건 - 시간이 끝나기 전에 사용자에게 알리고,
// 간단한 동작으로 시간을 늘릴 수 있는 시간을 **최소 20초** 주며, **최소 10번** 늘릴 수 있어야 한다(원문 대조는 헤드 몫, 결정표 2절).
// 이 시험의 20과 10은 그 표준 값이고, 구현이 쓰는 상수에서 가져오지 않는다. 총 제한 60초는 D88 U10(바꾸지 않는다).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PublicApiClient } from "../api/client.ts";
import { KioskFlow } from "../apps/kiosk/flow.ts";
import { json, ok, settle, started } from "./helpers.ts";

const WCAG_MIN_WARNING_MS = 20_000, WCAG_MIN_EXTENSIONS = 10, TOTAL_MS = 60_000;

function rig() {
  const q: Array<{ fn: () => void; ms: number }> = [], kinds: string[] = [];
  const timers = { set: (fn: () => void, ms: number) => { const t = { fn, ms }; q.push(t); return t; }, clear: (h: unknown) => { const i = q.indexOf(h as any); if (i >= 0) q.splice(i, 1); } };
  const api = new PublicApiClient({ now: () => 0, sleep: async () => {}, retry: { maxAttempts: 1 }, fetch: (async (_u: string, init: RequestInit) => {
    if (init.method === "GET") return json({ session_id: "s", state: "ACTIVE", resume_text: null });
    const b = JSON.parse(init.body as string); kinds.push(b.kind);
    return b.kind === "SESSION_START" ? started() : b.kind === "SESSION_END" ? ok(null) : ok("질문");
  }) as any });
  const flow = new KioskFlow(api, { idleMs: TOTAL_MS, timers });
  return { flow, q, kinds, ends: () => kinds.filter((k) => k === "SESSION_END").length };
}
/** 지금 걸린 타이머를 시간 순서대로 하나 발화한다(실제 시계로 다음 타이머가 울린 것). */
const fire = async (r: ReturnType<typeof rig>) => { r.q.shift()!.fn(); await settle(); };

test("만료 전에 경고가 뜨고, 그 시점에는 세션이 아직 살아 있으며 남은 시간이 20초 이상이다", async () => {
  const r = rig(); await r.flow.start();
  const first = r.q[0]!.ms;
  await fire(r); // 첫 타이머 = 경고 시점
  assert.equal(r.flow.current.state, "LISTENING", "경고 때 세션을 끝내지 않는다");
  assert.equal(r.ends(), 0);
  assert.ok(r.flow.current.idleWarnS !== undefined, "경고가 화면 상태로 노출된다");
  assert.equal(r.q.length, 1, "만료 타이머가 걸려 있다");
  assert.ok(r.q[0]!.ms >= WCAG_MIN_WARNING_MS, `경고 후 남은 시간 ${r.q[0]!.ms}ms >= 20000ms`);
  assert.equal(first + r.q[0]!.ms, TOTAL_MS, "총 제한 시간은 60초 그대로");
});

test("경고 뒤 아무것도 안 하면 만료되어 세션을 끝내고 처음 화면으로 간다", async () => {
  const r = rig(); await r.flow.start();
  await fire(r); await fire(r);
  assert.equal(r.flow.current.state, "IDLE");
  assert.deepEqual(r.kinds, ["SESSION_START", "SESSION_END"]);
});

test("경고 중 연장하면(touch) 경고가 사라지고 처음부터 다시 센다", async () => {
  const r = rig(); await r.flow.start();
  await fire(r);
  r.flow.touch();
  assert.equal(r.flow.current.idleWarnS, undefined, "경고 해제");
  assert.equal(r.flow.current.state, "LISTENING");
  assert.equal(r.q.length, 1);
  assert.equal(r.q[0]!.ms + WCAG_MIN_WARNING_MS, TOTAL_MS, "다시 경고 시점까지 센다");
  assert.equal(r.ends(), 0);
});

test("연장은 10번 넘게 되풀이할 수 있다(WCAG 2.2.1 최소 10회)", async () => {
  const r = rig(); await r.flow.start();
  for (let i = 0; i < WCAG_MIN_EXTENSIONS + 1; i++) { await fire(r); assert.ok(r.flow.current.idleWarnS !== undefined, `${i + 1}번째 경고`); r.flow.touch(); }
  assert.equal(r.flow.current.state, "LISTENING"); assert.equal(r.ends(), 0);
});

test("경고는 말하기 대기·다시 말하기에만 뜨고, 위험 정지·직원 호출 화면에는 타이머 자체가 없다(K-1 유지)", async () => {
  const r = rig(); await r.flow.start(); r.flow.callStaff();
  assert.equal(r.flow.current.state, "CALL_STAFF"); assert.equal(r.q.length, 0);
});

test("화면 쪽: 키오스크 HTML에 연장 버튼이 있고 main.ts가 경고 문구·연장 동작을 연결한다", () => {
  const html = readFileSync(new URL("../apps/kiosk/index.html", import.meta.url), "utf8");
  const main = readFileSync(new URL("../apps/kiosk/main.ts", import.meta.url), "utf8");
  assert.match(html, /id="extend"/);
  assert.match(main, /idleWarnS/);
  assert.match(main, /extend/);
});
