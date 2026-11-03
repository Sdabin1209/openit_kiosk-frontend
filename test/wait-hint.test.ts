// D125 (2026-11-02): 응답 대기 화면 피드백. 기대값의 출처: Nielsen 응답 시간 지침 - 1초를 넘으면 진행 표시, 10초를 넘으면 안내 문구.
// 이 시험의 1000과 10000은 그 표준 값이고 구현 상수(config.ts)에서 가져오지 않는다. 실제 시간은 기다리지 않는다(가짜 시계 주입, U422).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createPublicApiClient } from "../src/wiring/public_api.ts";
import { createKioskFlow } from "../src/wiring/kiosk.ts";
import { REQUEST_TIMEOUT_MS, DEFAULT_RETRY } from "../src/config.ts";
import { MSG } from "../src/components/patient_copy.ts";
import { fakeTimers, hang, json, settle, started, qsFetch } from "./helpers.ts";

const NIELSEN_PROGRESS_MS = 1_000, NIELSEN_NOTICE_MS = 10_000;

/** 흐름 타이머는 시험이 쥔 큐(흐름이 건 것만 담긴다). 요청 대기 타이머는 별도 가짜 타이머라 섞이지 않는다. */
async function rig(utterance: (init: RequestInit) => Promise<Response>) {
  const q: Array<{ fn: () => void; ms: number }> = [];
  const timers = { set: (fn: () => void, ms: number) => { const t = { fn, ms }; q.push(t); return t; }, clear: (h: unknown) => { const i = q.indexOf(h as any); if (i >= 0) q.splice(i, 1); } };
  const api = createPublicApiClient({ timers: fakeTimers(), now: () => 0, sleep: async () => {}, retry: { maxAttempts: 1 }, fetch: qsFetch((async (_u: string, init: RequestInit) => {
    if (init.method === "GET") return json({ session_id: "s", state: "ACTIVE", resume_text: null });
    const b = JSON.parse(init.body as string);
    return b.kind === "SESSION_START" ? started() : utterance(init);
  }) as any) });
  const flow = createKioskFlow(api, { idleMs: 0, timers });
  await flow.start();
  return { flow, q };
}
const waitTimers = (q: Array<{ ms: number }>) => q.map((t) => t.ms).sort((a, b) => a - b);

test("발화를 보내면 1초 뒤 진행 표시, 10초 뒤 안내 문구 단계가 된다", async () => {
  const r = await rig(hang);
  void r.flow.hear({ text: "머리가 아파요", confidence: null }); await settle();
  assert.equal(r.flow.current.state, "SENDING");
  assert.equal(r.flow.current.waitHint, undefined, "1초 전에는 아무것도 없다");
  assert.deepEqual(waitTimers(r.q), [NIELSEN_PROGRESS_MS, NIELSEN_NOTICE_MS]);
  r.q.find((t) => t.ms === NIELSEN_PROGRESS_MS)!.fn();
  assert.equal(r.flow.current.waitHint, "THINKING");
  r.q.find((t) => t.ms === NIELSEN_NOTICE_MS)!.fn();
  assert.equal(r.flow.current.waitHint, "PLEASE_WAIT");
});

test("응답이 오면 대기 피드백 타이머를 거두고 단계도 사라진다", async () => {
  let release!: (r: Response) => void;
  const r = await rig(() => new Promise<Response>((res) => { release = res; }));
  void r.flow.hear({ text: "머리가 아파요", confidence: null }); await settle();
  r.q.find((t) => t.ms === NIELSEN_PROGRESS_MS)!.fn();
  release(json({ response_text: "다음 질문", turn_failure_signal: null })); await settle();
  assert.equal(r.flow.current.state, "LISTENING");
  assert.equal(r.flow.current.waitHint, undefined);
  assert.equal(r.q.length, 0, "남은 타이머 없음");
});

test("문구는 patient_copy.ts에 있다", () => {
  assert.ok(MSG.BODY_THINKING.text.length > 0 && MSG.BODY_WAIT_LONGER.text.includes("기다려"));
});

// 시간 상한 사슬(계약 CONVENTIONS, D125): 키오스크 60 > gateway 1+55 > survey 50. 값은 계약 표에서 옮긴 것이다.
test("요청 대기 60초는 gateway 56초보다 길고, 재시도 총 예산은 대기의 2배(120초)다", () => {
  assert.equal(REQUEST_TIMEOUT_MS, 60_000);
  assert.ok(REQUEST_TIMEOUT_MS > 56_000);
  assert.equal(DEFAULT_RETRY.budgetMs, 2 * REQUEST_TIMEOUT_MS);
  assert.equal(DEFAULT_RETRY.budgetMs, 120_000);
  assert.ok(DEFAULT_RETRY.maxMs < REQUEST_TIMEOUT_MS, "백오프 한 번의 쉬는 시간은 대기보다 짧다");
});
