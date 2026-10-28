// KF-09 재현: 재시도·"처리 여부 불명" 분류가 api/retry.ts 한 곳에 있고, 상태 기계는 오류 본문 모양(details.reason)을 직접 읽지 않는다.
// 기대값의 출처(고치는 쪽 시험이 아님): boundary-contracts/PUBLIC_API.md 125행 "5xx와 시간 초과는 처리 여부를 모르는 경우이므로 같은 turn_id를 유지한다",
// 17행 409 details.reason, 124행 "클라이언트는 details.reason을 먼저 본다".
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PublicApiClient } from "../api/client.ts";
import { ApiError } from "../api/errors.ts";
import * as retry from "../api/retry.ts";
import { KioskFlow } from "../apps/kiosk/flow.ts";
import { json, ok, settle, started } from "./helpers.ts";

const DF = { session_id: "s", write_committed: "COMMITTED", staff_alert: "DELIVERY_FAILED" };
const err = (status: number, code = "UNAVAILABLE", details?: object) =>
  new Response(JSON.stringify({ pipeline_schema_version: "2.1", code, message: "x", retryable: false, ...(details ? { details } : {}) }), { status, headers: { "content-type": "application/json" } });
function make(route: (path: string, body: any) => Response) {
  const calls: Array<{ path: string; body: any }> = [];
  const api = new PublicApiClient({ timeoutMs: 250, retry: { maxAttempts: 2 }, sleep: async () => {}, fetch: (async (u: string, init: RequestInit) => {
    const path = new URL(u, "http://x").pathname.replace(/^\/v1/, "");
    if (init.method === "GET") return json({ session_id: "s", state: "PAUSED_RISK", resume_text: null });
    const body = JSON.parse(init.body as string); calls.push({ path, body });
    if (path.includes("/staff-call/")) return route(path, body);
    return body.kind === "SESSION_START" ? started("시작") : ok("대기", DF);
  }) as any });
  const flow = new KioskFlow(api, { pollMs: 1000, sleep: () => new Promise<void>(() => {}) });
  return { flow, sc: () => calls.filter((c) => c.path.includes("/staff-call/")) };
}
const toFailed = async (m: ReturnType<typeof make>) => { await m.flow.start(); await m.flow.hear({ text: "위험", confidence: 0.9 }); assert.equal(m.flow.current.callStaffReason, "DELIVERY_FAILED"); };

test("KF-09: 5xx는 어느 코드든 처리 여부 불명 - 재알림은 같은 turn_id로 다시 보낸다(501·507 포함)", async () => {
  for (const status of [500, 501, 502, 504, 505, 507]) {
    const m = make(() => err(status));
    await toFailed(m); await m.flow.retryStaffCall(); await m.flow.retryStaffCall();
    assert.equal(m.sc().length, 2, `${status}`);
    assert.equal(m.sc()[0].body.turn_id, m.sc()[1].body.turn_id, `${status}: 같은 turn_id`);
  }
});

test("KF-09: report도 5xx면 같은 turn_id로 2번까지 보낸다(501·507 포함), 4xx는 되풀이하지 않는다", async () => {
  for (const status of [501, 507]) {
    const m = make(() => err(status));
    await toFailed(m); await m.flow.leaveCallStaff(); await m.flow.leaveCallStaff();
    assert.equal(m.sc().length, 2, `${status}: 2회`);
    assert.equal(m.sc()[0].body.turn_id, m.sc()[1].body.turn_id);
  }
  const m = make(() => err(400, "INVALID_RECORD"));
  await toFailed(m); await m.flow.leaveCallStaff(); await m.flow.leaveCallStaff();
  assert.equal(m.sc().length, 1);
});

test("KF-09: ApiError가 해석된 reason을 내보낸다(본문 details.reason), 없거나 문자열이 아니면 null", () => {
  const b = (details: unknown) => ({ pipeline_schema_version: "2.1", code: "CONFLICT", message: "x", retryable: false, details }) as any;
  assert.equal(new ApiError(409, b({ reason: "NO_OPEN_ALERT" })).reason, "NO_OPEN_ALERT");
  assert.equal(new ApiError(409, b({ reason: 3 })).reason, null);
  assert.equal(new ApiError(409, b(undefined)).reason, null);
  assert.equal(new ApiError(502, null).reason, null);
});

test("KF-09: 재시도 분류 함수는 api/retry.ts가 내보내고, 클라이언트 재시도(429·502·503·504, TURN_IN_PROGRESS)와 일치한다", () => {
  const r = retry as any;
  assert.equal(typeof r.isRetryable, "function");
  assert.equal(typeof r.isOutcomeUnknown, "function");
  for (const s of [429, 502, 503, 504]) assert.equal(r.isRetryable(s, null), true, `${s}`);
  for (const s of [400, 401, 403, 404, 500]) assert.equal(r.isRetryable(s, null), false, `${s}: 재시도 안 함`);
  assert.equal(r.isRetryable(409, "TURN_IN_PROGRESS"), true);
  assert.equal(r.isRetryable(409, "NO_OPEN_ALERT"), false);
  assert.equal(r.isRetryable(409, null), false);
  for (const s of [500, 501, 502, 503, 504, 507, 599]) assert.equal(r.isOutcomeUnknown(s), true, `${s}`);
  for (const s of [200, 400, 404, 409, 429]) assert.equal(r.isOutcomeUnknown(s), false, `${s}`);
});

test("KF-09: 상태 기계(flow.ts)는 오류 본문 모양(.body/.details)을 직접 읽지 않고 상태 집합을 따로 갖지 않는다", () => {
  const src = readFileSync("apps/kiosk/flow.ts", "utf8");
  assert.doesNotMatch(src, /\.details|\.body\b|NO_RESPONSE_STATUS|new Set\(\[\s*5/);
});
