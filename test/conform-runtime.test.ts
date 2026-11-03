// RUNTIME.md R3.13(기기 인증 실패 401), R3.15·R10.6(게이트웨이 정지·입구 인증서 검증 실패 = 네트워크 오류)을 키오스크 화면 흐름에서 확인한다.
// 각 시험은 상태 코드나 오류와 함께 화면 상태(KioskView)와 보낸 요청 수를 단언한다. 가짜 시계라 실제 시간을 기다리지 않는다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createPublicApiClient } from "../src/wiring/public_api.ts";
import { createKioskFlow } from "../src/wiring/kiosk.ts";
import { json, ok, started, noTimers } from "./helpers.ts";

function clock() { let t = 0; return { now: () => t, sleep: async (ms: number) => { t += ms; } }; }
const say = (text: string) => ({ text, confidence: 0.9 });
const SETS = () => json({ items: [{ question_set_id: "general", title: "일반 문진", version: "1" }] });
const deny = () => json({ pipeline_schema_version: "3.4", code: "PERMISSION_DENIED", message: "x", retryable: false }, 401);
// 입구 인증서 검증 실패·게이트웨이 정지에서 브라우저 fetch는 응답 없이 TypeError("Failed to fetch")를 낸다(서버는 이를 볼 수 없다, R10.6).
const netFail = (): never => { throw new TypeError("Failed to fetch"); };

function rig(handler: (u: string, body: any) => Response | Promise<Response>) {
  const c = clock(); const log: Array<{ u: string; kind?: string; turn_id?: string }> = [];
  const api = createPublicApiClient({ now: c.now, sleep: c.sleep, timers: noTimers, fetch: (async (u: string, init: RequestInit) => {
    const body = init.body ? JSON.parse(init.body as string) : null;
    log.push({ u: String(u), kind: body?.kind, turn_id: body?.turn_id });
    return handler(String(u), body);
  }) as any });
  return { flow: createKioskFlow(api, { idleMs: 0 }), log, c };
}

test("R3.13: 문진표 목록 요청이 401이면 재시도 없이 직원 호출 화면(AUTH)이고 세션을 시작하지 않는다", async () => {
  const { flow, log } = rig(() => deny());
  await flow.start();
  assert.deepEqual([flow.current.state, flow.current.callStaffReason], ["CALL_STAFF", "AUTH"]);
  assert.equal(log.length, 1, "한 번만 보낸다");
  assert.equal(log.filter((l) => l.kind === "SESSION_START").length, 0);
});

test("R3.13: 세션 시작이 401이면 재시도 없이 직원 호출 화면(AUTH)", async () => {
  const { flow, log } = rig((u, b) => u.endsWith("/question-sets") ? SETS() : deny());
  await flow.start();
  assert.deepEqual([flow.current.state, flow.current.callStaffReason], ["CALL_STAFF", "AUTH"]);
  assert.equal(log.filter((l) => l.kind === "SESSION_START").length, 1);
});

test("R3.13: 발화 전송이 401이면 재시도 없이 직원 호출 화면(AUTH)", async () => {
  const { flow, log } = rig((u, b) => u.endsWith("/question-sets") ? SETS() : b?.kind === "SESSION_START" ? started("질문") : deny());
  await flow.start(); await flow.hear(say("네"));
  assert.deepEqual([flow.current.state, flow.current.callStaffReason], ["CALL_STAFF", "AUTH"]);
  assert.equal(log.filter((l) => l.kind === "UTTERANCE").length, 1);
});

test("R3.15·R10.6: 게이트웨이 정지·인증서 검증 실패(네트워크 오류)는 같은 turn_id로 예산까지 재시도한 뒤 직원 호출 화면", async () => {
  const { flow, log } = rig((u, b) => u.endsWith("/question-sets") ? SETS() : b?.kind === "SESSION_START" ? started("질문") : netFail());
  await flow.start(); await flow.hear(say("네"));
  assert.deepEqual([flow.current.state, flow.current.callStaffReason], ["CALL_STAFF", "RETRY_EXHAUSTED"]);
  const ids = log.filter((l) => l.kind === "UTTERANCE").map((l) => l.turn_id);
  assert.ok(ids.length > 1, "한 번 이상 다시 보냈다");
  assert.equal(new Set(ids).size, 1, "모든 시도가 같은 turn_id");
});

test("R3.15·R10.6: 시작 때 목록을 못 받으면(네트워크 오류) 재시도 뒤 직원 호출 화면(START_FAILED)이고 세션은 만들지 않는다", async () => {
  const { flow, log } = rig(() => netFail());
  await flow.start();
  assert.deepEqual([flow.current.state, flow.current.callStaffReason], ["CALL_STAFF", "START_FAILED"]);
  assert.ok(log.length > 1, "재시도했다");
  assert.equal(log.filter((l) => l.kind === "SESSION_START").length, 0);
});

test("R3.15: 게이트웨이가 되살아나면(두 번 실패 뒤 성공) 화면은 그대로 이어진다", async () => {
  let n = 0;
  const { flow } = rig((u, b) => u.endsWith("/question-sets") ? SETS() : b?.kind === "SESSION_START" ? started("질문") : ++n <= 2 ? netFail() : ok("다음"));
  await flow.start(); await flow.hear(say("네"));
  assert.deepEqual([flow.current.state, flow.current.text], ["LISTENING", "다음"]);
});
