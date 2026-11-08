// readConfig 의 시간 상한(ADR 0043): 시험이 쥔 가짜 타이머로 시간을 흘린다. 실제 시간은 기다리지 않는다(U422, test/TIMING.md).
// 매달림 감시: race 를 빼는 변이에서 시험이 '멈춤'이 아니라 '실패'로 끝나게 node:test 의 timeout 을 둔다(통과 조건이 아니라 실패 마감).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readConfig } from "../src/components/link_device_config_receive.ts";
import { fakeTimers, flowTimers, json, settle, qsFetch, started, HANG_GUARD_SECONDS } from "./helpers.ts";
import { CONFIG_READ_TIMEOUT_MS } from "../src/config.ts";
import { createKioskFlow } from "../src/wiring/kiosk.ts";
import { createPublicApiClient } from "../src/wiring/public_api.ts";

const guard = { timeout: HANG_GUARD_SECONDS * 1000 };

test("설정 응답이 멈추면 상한에서 null 이 되고 요청을 취소한다", guard, async () => {
  const t = fakeTimers();
  let aborted = false;
  const never = ((_u: string, init: RequestInit) => { init.signal?.addEventListener("abort", () => { aborted = true; }); return new Promise<Response>(() => {}); }) as typeof fetch;
  const p = readConfig(never, t, CONFIG_READ_TIMEOUT_MS);
  await settle();
  assert.equal(t.pending(), 1, "상한 타이머가 걸렸다");
  t.advance(CONFIG_READ_TIMEOUT_MS - 1);
  assert.equal(aborted, false, "상한 전에는 끊지 않는다");
  t.advance(1);
  assert.equal(await p, null);
  assert.equal(aborted, true);
  assert.equal(t.pending(), 0);
});

test("응답이 먼저 오면 설정을 돌려주고 타이머를 거둔다", guard, async () => {
  const t = fakeTimers();
  const body = { question_set_id: "cfg" };
  assert.deepEqual(await readConfig((async () => json(body)) as typeof fetch, t, CONFIG_READ_TIMEOUT_MS), body);
  assert.equal(t.pending(), 0, "남은 타이머 없음");
});

test("404 나 오류도 null 이고 타이머를 거둔다", guard, async () => {
  const t = fakeTimers();
  assert.equal(await readConfig((async () => json({}, 404)) as typeof fetch, t, CONFIG_READ_TIMEOUT_MS), null);
  assert.equal(await readConfig((async () => { throw new TypeError("fetch failed"); }) as typeof fetch, t, CONFIG_READ_TIMEOUT_MS), null);
  assert.equal(t.pending(), 0);
});

// 기기 설정을 읽는 동안(STARTING)에도 10초 안내가 보인다: 설정 읽기는 최악 CONFIG_READ_TIMEOUT_MS(12초)라 환자가 멈춘 화면으로 느끼지 않게 한다.
// 1초·10초는 Nielsen 응답 시간 지침의 표준 값이다(wait-hint.test.ts 와 같다).
test("STARTING 에서도 1초 뒤 진행 표시, 10초 뒤 안내 문구가 되고, 시작이 끝나면 타이머를 거둔다", guard, async () => {
  const ft = fakeTimers();
  const api = createPublicApiClient({ timers: fakeTimers(), now: () => 0, sleep: async () => {}, retry: { maxAttempts: 1 }, fetch: qsFetch((async () => started()) as any) });
  let release!: () => void;
  const startValues = () => new Promise<any>((res) => { release = () => res({ subjectRef: null, subjectInvalid: false, questionSetId: null, allowRemoteStt: false, confirm: () => {} }); });
  const flow = createKioskFlow(api, { idleMs: 0, timers: flowTimers(ft), startValues } as any);
  void flow.start(); await settle();
  assert.equal(flow.current.state, "STARTING");
  assert.equal(flow.current.waitHint, undefined);
  ft.advance(1_000);
  assert.equal(flow.current.waitHint, "THINKING");
  ft.advance(9_000);
  assert.equal(flow.current.waitHint, "PLEASE_WAIT");
  release(); await settle();
  assert.notEqual(flow.current.state, "STARTING");
  assert.equal(flow.current.waitHint, undefined);
  assert.equal(ft.pending(), 0, "남은 타이머 없음");
});
