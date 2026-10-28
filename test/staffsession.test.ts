import { test, after } from "node:test";
import assert from "node:assert/strict";
import { PublicApiClient } from "../api/client.ts";
import { StaffApi } from "../api/staff.ts";
import { ApiError } from "../api/errors.ts";
import { errorMessage, formatValue } from "../apps/staff/record.ts";
import { startMock } from "./helpers.ts";

const open: Array<() => Promise<void>> = [];
after(async () => { for (const c of open) await c(); });
async function mk(sc = {}) {
  const m = await startMock(sc); open.push(m.close);
  const c = new PublicApiClient({ baseUrl: m.base + "/v1", retry: { maxAttempts: 3 }, sleep: async () => {} });
  return { m, c, staff: new StaffApi(c) };
}

test("GET /v1/staff/sessions/{id}: 모양이 StaffSessionView와 같고 위험 알림에 rule_id가 있다", async () => {
  const { c, staff } = await mk({ autoResumeMs: 0 });
  await c.startSession("s1");
  await c.sendUtterance("s1", "가짜 문장");
  await c.sendUtterance("s1", "위험해요");
  const v = await staff.getSession("s1");
  assert.deepEqual(Object.keys(v).sort(), ["alerts", "created_at", "release_id", "session_id", "status", "subject_ref", "turns", "values"]);
  assert.equal(v.status, "PAUSED_RISK");
  assert.deepEqual(v.turns.map((t) => t.turn_index), [0, 1, 2]);
  assert.equal(v.turns[0].utterance, null);
  assert.equal(v.turns[1].utterance, "가짜 문장");
  assert.deepEqual(Object.keys(v.turns[1]).sort(), ["action", "at", "response_text", "turn_id", "turn_index", "utterance"]);
  assert.deepEqual(Object.keys(v.values[0]).sort(), ["key", "precision", "status", "value"]);
  assert.equal(v.alerts.length, 1);
  // 2.1.0: 필수 키는 그대로이고 optional(delivery_attempts, last_delivery_status, pause_reason)이 더해진다.
  assert.deepEqual(Object.keys(v.alerts[0]).sort().filter((k) => !["delivery_attempts", "last_delivery_status", "pause_reason"].includes(k)), ["alert_id", "created_at", "kind", "resolved_by", "rule_id", "status"]);
  assert.equal(v.alerts[0].kind, "RISK");
  assert.equal(typeof v.alerts[0].rule_id, "string");
});

test("재개하면 같은 세션 기록에 직원 결정 턴이 붙고 알림이 RESOLVED", async () => {
  const { c, staff } = await mk();
  await c.startSession("s2"); await c.sendUtterance("s2", "위험해요");
  await c.intervene("s2", "RESUME", "t-1");
  const v = await staff.getSession("s2");
  assert.equal(v.status, "IN_PROGRESS");
  assert.equal(v.alerts[0].status, "RESOLVED");
  assert.equal(v.turns.at(-1)!.action, "STAFF_RESUME");
});

test("없는 세션은 404 ApiError, 인증 실패 시나리오는 401, 문구가 구분된다", async () => {
  const { staff, m } = await mk();
  const e = await staff.getSession("nope").then(() => null, (x) => x);
  assert.ok(e instanceof ApiError && e.status === 404);
  assert.match(errorMessage(e), /찾을 수 없습니다/);
  await fetch(`${m.base}/__mock/scenario`, { method: "POST", body: JSON.stringify({ name: "normal", errorStatus: 401, errorTimes: 1 }) });
  const e2 = await staff.getSession("s1").then(() => null, (x) => x);
  assert.ok(e2 instanceof ApiError && e2.status === 401);
  assert.match(errorMessage(e2), /권한|로그인/);
  assert.match(errorMessage(new TypeError("fetch failed")), /연결하지 못했습니다/);
});

test("모의 서버 요청 로그에 발화 본문이 남지 않는다", async () => {
  const { c, m } = await mk();
  await c.startSession("s3"); await c.sendUtterance("s3", "비밀스러운가짜문장");
  assert.equal(JSON.stringify(m.state.log).includes("비밀스러운"), false);
});

test("formatValue: 문자열·객체·null", () => {
  assert.equal(formatValue("a"), "a");
  assert.equal(formatValue({ a: 1 }), '{"a":1}');
  assert.equal(formatValue(null), "(없음)");
});
