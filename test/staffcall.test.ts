// CR-H001(직원 호출 재알림·실패 기록)과 CR-H002(pause_reason)의 키오스크 쪽 시험. 가짜 fetch + 가짜 시계, 모의 서버 계약 시험.
import { contractJson } from "../scripts/contract-source.mjs";
import { PIPELINE_SCHEMA_VERSION } from "../mock-server/app.ts";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { Ajv2020 } from "ajv/dist/2020.js";
import { createPublicApiClient } from "../src/wiring/public_api.ts";
import { ApiError } from "../src/components/link_public_api_send.ts";
import { createKioskFlow } from "../src/wiring/kiosk.ts";
import { deliveryLines, pauseLabel } from "../src/components/alert_info.ts";
import { hang, json, ok, settle, startMock, started, timesOut } from "./helpers.ts";

const say = (t: string) => ({ text: t, confidence: 0.9 });
const DF = { session_id: "s", write_committed: "COMMITTED", staff_alert: "DELIVERY_FAILED" };
const err = (status: number, code: string, details?: object, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify({ pipeline_schema_version: PIPELINE_SCHEMA_VERSION, code, message: "x", retryable: status === 429, ...(details ? { details } : {}) }), { status, headers: { "content-type": "application/json", ...headers } });

/** 가짜 시계: tick()이 1초씩 흘린다. */
function clock() {
  const q: Array<{ fn: () => void; h: number }> = []; let n = 0;
  return { set: (fn: () => void) => { const h = ++n; q.push({ fn, h }); return h; }, clear: (h: unknown) => { const i = q.findIndex((x) => x.h === h); if (i >= 0) q.splice(i, 1); },
    tick: async () => { const t = q.splice(0); t.forEach((x) => x.fn()); await settle(); }, pending: () => q.length };
}
type Route = (path: string, body: any) => Response | Promise<Response>;
function make(route: Route, state: () => any = () => ({ state: "PAUSED_RISK", resume_text: null })) {
  const calls: Array<{ path: string; body: any }> = [];
  const clk = clock();
  const api = createPublicApiClient({ retry: { maxAttempts: 2 }, sleep: async () => {}, fetch: (async (u: string, init: RequestInit) => {
    const path = new URL(u, "http://x").pathname.replace(/^\/v1/, "");
    if (init.method === "GET") return json({ session_id: "s", ...state() });
    const body = JSON.parse(init.body as string); calls.push({ path, body });
    if (path.includes("/staff-call/")) return route(path, body);
    if (body.kind === "SESSION_START") return started("시작");
    return ok("대기", DF);
  }) as any });
  const flow = createKioskFlow(api, { pollMs: 1000, sleep: () => new Promise<void>(() => {}), timers: clk });
  return { flow, calls, clk, sc: () => calls.filter((c) => c.path.includes("/staff-call/")) };
}
const toFailed = async (m: ReturnType<typeof make>) => { await m.flow.start(); await m.flow.hear(say("위험")); assert.equal(m.flow.current.callStaffReason, "DELIVERY_FAILED"); };
const retryOk = (staff = "DELIVERY_FAILED", after = 3, n = 2) => json({ alert_id: "a1", staff_alert: staff, delivery_attempts: n, retry_after_s: after });

test("DELIVERY_FAILED에서 다시 부르기: 실패면 retry_after_s 동안 비활성(카운트다운) 뒤 다시 누를 수 있고, 매번 새 turn_id", async () => {
  const m = make((p) => retryOk());
  await toFailed(m);
  assert.deepEqual(m.flow.current.staffCall, { canRetry: true, sending: false, waitS: 0, attempts: 0 });
  await m.flow.retryStaffCall();
  assert.equal(m.flow.current.state, "CALL_STAFF");
  assert.equal(m.flow.current.staffCall!.waitS, 3); assert.equal(m.flow.current.staffCall!.attempts, 2);
  await m.flow.retryStaffCall(); // 비활성 중: 서버로 보내지 않는다
  assert.equal(m.sc().length, 1);
  for (let i = 3; i > 0; i--) { assert.equal(m.flow.current.staffCall!.waitS, i); await m.clk.tick(); }
  assert.equal(m.flow.current.staffCall!.waitS, 0);
  assert.equal(m.clk.pending(), 0, "0이 되면 타이머가 멈춘다");
  await m.flow.retryStaffCall();
  assert.equal(m.sc().length, 2);
  assert.notEqual(m.sc()[0].body.turn_id, m.sc()[1].body.turn_id, "응답을 받은 뒤의 재호출은 새 turn_id");
  assert.deepEqual(Object.keys(m.sc()[0].body), ["turn_id"], "발화·자유 문장 없음");
  assert.match(m.sc()[0].path, /^\/sessions\/[^/]+\/staff-call\/retry$/);
});

test("재알림이 DELIVERED이면 안내(대기) 화면으로 바뀌고 상태 폴링에 정지 사유를 싣는다", async () => {
  const m = make(() => retryOk("DELIVERED"), () => ({ state: "PAUSED_RISK", resume_text: null, pause_reason: "RISK" }));
  await toFailed(m); await m.flow.retryStaffCall();
  assert.equal(m.flow.current.state, "WAITING_STAFF");
  assert.equal(m.flow.current.staffCall, undefined);
});

test("응답을 못 받은 재전송(시간 초과·네트워크)은 같은 turn_id, 화면은 유지, 버튼은 다시 켜진다", async () => {
  let n = 0;
  const m = make((p, b) => (++n === 1 ? hang() as any : retryOk("DELIVERED")));
  (m.flow as any).api = createPublicApiClient({ retry: { maxAttempts: 1 }, sleep: async () => {}, fetch: (async (u: string, init: RequestInit) => {
    const path = new URL(u, "http://x").pathname.replace(/^\/v1/, ""); if (init.method === "GET") return json({ session_id: "s", state: "PAUSED_RISK", resume_text: null });
    const body = JSON.parse(init.body as string); m.calls.push({ path, body });
    if (path.includes("/staff-call/")) return ++n === 1 ? timesOut() : retryOk("DELIVERED");
    return body.kind === "SESSION_START" ? started("시작") : ok("대기", DF);
  }) as any });
  await toFailed(m);
  await m.flow.retryStaffCall();
  assert.equal(m.flow.current.state, "CALL_STAFF"); assert.equal(m.flow.current.staffCall!.notice, "NETWORK"); assert.equal(m.flow.current.staffCall!.sending, false);
  await m.flow.retryStaffCall();
  assert.equal(m.sc().length, 2);
  assert.equal(m.sc()[0].body.turn_id, m.sc()[1].body.turn_id, "응답이 없었으므로 같은 turn_id(서버 멱등)");
});

test("429 RETRY_LIMIT: 버튼이 사라지고 직원 호출 화면은 끝나지 않는다(직접 안내만 남음)", async () => {
  const m = make(() => err(429, "UNAVAILABLE", { reason: "RETRY_LIMIT" }));
  await toFailed(m); await m.flow.retryStaffCall();
  assert.equal(m.flow.current.state, "CALL_STAFF"); assert.equal(m.flow.current.callStaffReason, "DELIVERY_FAILED");
  assert.equal(m.flow.current.staffCall!.canRetry, false); assert.equal(m.flow.current.staffCall!.notice, "LIMIT");
  await m.flow.retryStaffCall(); assert.equal(m.sc().length, 1, "상한 뒤에는 더 보내지 않는다");
});

test("429 간격(Retry-After): 그 초만큼 카운트다운, 자동 재시도하지 않는다", async () => {
  const m = make(() => err(429, "UNAVAILABLE", undefined, { "retry-after": "7" }));
  await toFailed(m); await m.flow.retryStaffCall();
  assert.equal(m.sc().length, 1, "429를 일시 장애로 보고 되풀이하지 않는다");
  assert.equal(m.flow.current.staffCall!.waitS, 7); assert.equal(m.flow.current.staffCall!.canRetry, true);
});

test("409 NO_OPEN_ALERT: 화면을 끝내지 않고 직접 안내를 남기고 버튼만 거둔다", async () => {
  const m = make(() => err(409, "CONFLICT", { reason: "NO_OPEN_ALERT" }));
  await toFailed(m); await m.flow.retryStaffCall();
  assert.equal(m.flow.current.state, "CALL_STAFF"); assert.equal(m.flow.current.staffCall!.canRetry, false); assert.equal(m.flow.current.staffCall!.notice, "NO_ALERT");
});

test("기능 감지: 서버가 404/405면 다시 부르기를 끄고 기존 동작(직접 알리셨나요?)을 유지한다", async () => {
  for (const status of [404, 405]) {
    const m = make(() => err(status, "NOT_FOUND"));
    await toFailed(m); await m.flow.retryStaffCall();
    assert.equal(m.flow.current.staffCall!.canRetry, false); assert.equal(m.flow.current.staffCall!.notice, "UNSUPPORTED");
    await m.flow.leaveCallStaff(); assert.equal(m.flow.current.confirmLeave, true);
    await m.flow.leaveCallStaff(); // 보고는 404를 받아도 막히지 않는다
    assert.equal(m.flow.current.state, "IDLE");
    assert.equal(m.calls.filter((c) => c.body.kind === "SESSION_END").length, 0);
  }
});

test("직접 알렸어요: report(STAFF_NOTIFIED_MANUALLY) 후 처음으로. 취소: report(NOT_NOTIFIED) 후 화면 유지, 서버 세션은 끝내지 않는다", async () => {
  const m = make((p, b) => json({ alert_id: "a1", session_id: "s", kind: "RISK", created_at: "2026-01-01T00:00:00Z", status: "OPEN", manual_notice_outcome: b.outcome }));
  await toFailed(m);
  await m.flow.leaveCallStaff(); m.flow.cancelLeave(); await settle();
  assert.equal(m.flow.current.state, "CALL_STAFF");
  assert.deepEqual(m.sc().map((c) => [c.path.split("/").pop(), c.body.outcome]), [["report", "NOT_NOTIFIED"]]);
  assert.equal(m.flow.current.callStaffReason, "DELIVERY_FAILED", "NOT_NOTIFIED여도 직원 호출 화면은 끝나지 않는다");
  await m.flow.leaveCallStaff(); await m.flow.leaveCallStaff();
  assert.equal(m.sc()[1].body.outcome, "STAFF_NOTIFIED_MANUALLY");
  assert.notEqual(m.sc()[0].body.turn_id, m.sc()[1].body.turn_id, "report마다 새 turn_id");
  assert.equal(m.calls.filter((c) => c.body.kind === "SESSION_END").length, 0, "세션을 환자가 끝내지 못한다");
});

test("report가 네트워크로 실패해도 환자를 화면에 가두지 않는다", async () => {
  const m = make(() => err(503, "UNAVAILABLE"));
  await toFailed(m); await m.flow.leaveCallStaff(); await m.flow.leaveCallStaff();
  assert.equal(m.flow.current.state, "IDLE");
});

test("pause_reason: 상태 폴링 값을 정규화한다(모르는 값=OTHER, 없음=미상) - WAITING_STAFF에 실린다", async () => {
  for (const [reason, want] of [["REASK_LIMIT", "REASK_LIMIT"], ["RISK", "RISK"], ["NEW_THING", "OTHER"], [undefined, undefined]] as const) {
    const calls: any[] = [];
    const api = createPublicApiClient({ sleep: async () => {}, fetch: (async (u: string, init: RequestInit) => {
      if (init.method === "GET") return json({ session_id: "s", state: "PAUSED_RISK", resume_text: null, ...(reason ? { pause_reason: reason } : {}) });
      const b = JSON.parse(init.body as string); calls.push(b);
      return b.kind === "SESSION_START" ? started("시작") : ok("서버 고정 문장", null);
    }) as any });
    const flow = createKioskFlow(api, { pollMs: 1000, sleep: () => new Promise<void>(() => {}) });
    await flow.start(); await flow.hear(say("아무말"));
    assert.equal(flow.current.state, "WAITING_STAFF");
    assert.equal(flow.current.pauseReason, want);
    assert.equal(flow.current.text, "서버 고정 문장", "서버 고정 문장은 그대로 우선");
    flow.reset();
  }
});

test("직원 콘솔 보조 표시: 정지 사유는 글자로 구분, 필드 없으면 비어 기존 화면 유지", () => {
  assert.equal(pauseLabel({}), null); assert.equal(pauseLabel({ pause_reason: null }), null);
  assert.match(pauseLabel({ pause_reason: "RISK" })!.text, /^\[위험 정지\]/);
  assert.match(pauseLabel({ pause_reason: "REASK_LIMIT" })!.text, /^\[되묻기 한도 정지\]/);
  assert.equal(pauseLabel({ pause_reason: "ZZZ" })!.reason, "OTHER");
  assert.deepEqual(deliveryLines({}), []);
  const l = deliveryLines({ delivery_attempts: 3, last_delivery_status: "DELIVERY_FAILED", manual_notice_outcome: "NOT_NOTIFIED", manual_notice_reported_at: "2026-01-01T00:00:00Z" });
  assert.match(l[0], /3회.*전달 실패.*직원이 직접 확인/); assert.match(l[1], /아직 직원에게 알리지 못했다/);
});

// ---- 모의 서버 계약 시험: 응답이 설치된 계약 스키마를 지킨다 ----
const ajv = new Ajv2020({ strict: false });
const bs = (n: string) => ajv.compile(contractJson(`schemas/${n}`)); // 고정 태그의 계약(ADR 0027)
const vRetryReq = bs("StaffCallRetryRequest.schema.json"), vRetry = bs("StaffCallRetryResult.schema.json"), vReport = bs("StaffCallReport.schema.json"), vAlert = bs("StaffAlert.schema.json"), vState = bs("SessionState.schema.json");
const open: Array<() => Promise<void>> = [];
after(async () => { for (const c of open) await c(); });
async function mk(sc = {}) { const m = await startMock(sc); open.push(m.close); return { m, api: createPublicApiClient({ baseUrl: m.base + "/v1", sleep: async () => {} }) }; }

test("모의 서버: retry/report/state 응답이 계약 스키마를 지키고 멱등·간격·상한이 동작한다", async () => {
  const { m, api } = await mk({ alertDelivery: "DELIVERY_FAILED", retryDelivery: "DELIVERY_FAILED", retryAfterS: 60, enforceInterval: true, retryLimit: 2 });
  const SID_s1 = (await api.startSession()).session_id; await api.sendUtterance(SID_s1, "위험");
  assert.ok(vRetryReq({ turn_id: "r1" }));
  const r1 = await api.staffCallRetry(SID_s1, "r1");
  assert.ok(vRetry(r1), JSON.stringify(vRetry.errors)); assert.equal(r1.delivery_attempts, 2);
  assert.deepEqual(await api.staffCallRetry(SID_s1, "r1"), r1, "같은 turn_id는 같은 응답");
  await assert.rejects(api.staffCallRetry(SID_s1, "r2"), (e) => e instanceof ApiError && e.status === 429 && e.retryAfterMs !== null);
  const rep = await api.staffCallReport(SID_s1, "NOT_NOTIFIED", "p1");
  assert.ok(vAlert(rep), JSON.stringify(vAlert.errors)); assert.equal(rep.manual_notice_outcome, "NOT_NOTIFIED");
  assert.ok(vReport({ outcome: "NOT_NOTIFIED", turn_id: "p1" }));
  await assert.rejects(api.staffCallReport(SID_s1, "STAFF_NOTIFIED_MANUALLY", "p1"), (e) => e instanceof ApiError && e.status === 409);
  const st = await api.getSessionState(SID_s1); assert.ok(vState(st), JSON.stringify(vState.errors)); assert.equal(st.pause_reason, "RISK");
  m.state.sc.retryLimit = 1;
  await assert.rejects(api.staffCallRetry(SID_s1, "r3"), (e) => e instanceof ApiError && e.status === 429 && (e.body?.details as any)?.reason === "RETRY_LIMIT");
});

test("모의 서버: 되묻기 한도 정지는 REASK_LIMIT, 옛 서버 모의는 필드 없음, staffCallApi=false면 404", async () => {
  const a = await mk({ alertDelivery: "DELIVERED" });
  const SID_s1 = (await a.api.startSession()).session_id; await a.api.sendUtterance(SID_s1, "알수없음");
  const st = await a.api.getSessionState(SID_s1); assert.ok(vState(st)); assert.equal(st.pause_reason, "REASK_LIMIT");
  const b = await mk({ pauseReasonField: false, staffCallApi: false, alertDelivery: "DELIVERY_FAILED" });
  const SID_b = (await b.api.startSession()).session_id; await b.api.sendUtterance(SID_b, "위험");
  assert.equal("pause_reason" in (await b.api.getSessionState(SID_b)), false);
  await assert.rejects(b.api.staffCallRetry(SID_b, "x"), (e) => e instanceof ApiError && e.status === 404);
});

// ---- 독립 검토(4426b7b)에서 재현된 결함의 고정 시험 ----
test("M-3: 502/504/500 뒤 다시 누르면 같은 turn_id(서버가 처리했는지 모른다). 200/409/429 뒤에는 새 turn_id", async () => {
  for (const status of [502, 504, 500, 503]) {
    const m = make(() => err(status, "UNAVAILABLE"));
    await toFailed(m); await m.flow.retryStaffCall(); await m.flow.retryStaffCall();
    assert.equal(m.sc()[0].body.turn_id, m.sc()[1].body.turn_id, `${status}: 같은 turn_id`);
    assert.equal(m.flow.current.staffCall!.notice, "NETWORK"); assert.equal(m.flow.current.staffCall!.canRetry, true);
  }
  for (const [status, d] of [[409, { reason: "TURN_IN_PROGRESS" }], [429, undefined]] as const) {
    const m = make(() => err(status, "X", d, { "retry-after": "1" }));
    await toFailed(m); await m.flow.retryStaffCall();
    await m.clk.tick(); await m.flow.retryStaffCall();
    assert.equal(m.sc().length, 2); assert.notEqual(m.sc()[0].body.turn_id, m.sc()[1].body.turn_id, `${status}: 새 turn_id`);
  }
});

test("M-4: 409는 details.reason을 본다 - TURN_IN_PROGRESS는 일시 충돌이라 잠시 뒤 다시 누를 수 있고, NO_OPEN_ALERT만 버튼을 끈다. 404/405는 직접 안내를 남긴다", async () => {
  const m = make(() => err(409, "CONFLICT", { reason: "TURN_IN_PROGRESS" }, { "retry-after": "2" }));
  await toFailed(m); await m.flow.retryStaffCall();
  assert.equal(m.flow.current.staffCall!.canRetry, true); assert.equal(m.flow.current.staffCall!.notice, "BUSY"); assert.equal(m.flow.current.staffCall!.waitS, 2);
  const n = make(() => err(409, "CONFLICT")); // reason 없는 409도 끄지 않는다
  await toFailed(n); await n.flow.retryStaffCall(); assert.equal(n.flow.current.staffCall!.canRetry, true);
  const o = make(() => err(409, "CONFLICT", { reason: "NO_OPEN_ALERT" }));
  await toFailed(o); await o.flow.retryStaffCall(); assert.equal(o.flow.current.staffCall!.canRetry, false);
  const p = make(() => err(404, "NOT_FOUND"));
  await toFailed(p); await p.flow.retryStaffCall();
  assert.equal(p.flow.current.state, "CALL_STAFF"); assert.equal(p.flow.current.callStaffReason, "DELIVERY_FAILED"); assert.equal(p.flow.current.staffCall!.canRetry, false);
});

test("M-2: 재알림 401/403은 AUTH 화면으로 바꾸지 않는다 - 직접 안내와 '직접 알리셨나요?' 확인 단계가 남는다", async () => {
  for (const status of [401, 403]) {
    const m = make((p) => err(status, "PERMISSION_DENIED"));
    await toFailed(m); await m.flow.retryStaffCall();
    assert.equal(m.flow.current.callStaffReason, "DELIVERY_FAILED"); assert.equal(m.flow.current.staffCall!.notice, "AUTH"); assert.equal(m.flow.current.staffCall!.canRetry, false);
    await m.flow.leaveCallStaff();
    assert.equal(m.flow.current.state, "CALL_STAFF"); assert.equal(m.flow.current.confirmLeave, true, "한 번 눌러서는 떠나지 않는다");
    assert.equal(m.calls.filter((c) => c.body.kind === "SESSION_END").length, 0);
  }
});

test("L-1: report 진행 중 '직접 알렸어요' 더블 클릭은 report를 한 번만 보낸다", async () => {
  let release!: () => void;
  const gate = new Promise<void>((r) => { release = r; }); // report 응답을 붙잡아 '진행 중'을 만든다(시간이 아니라 사건)
  const m = make(async () => { await gate; return json({ alert_id: "a", session_id: "s" }); });
  await toFailed(m); await m.flow.leaveCallStaff();
  const both = Promise.all([m.flow.leaveCallStaff(), m.flow.leaveCallStaff()]);
  await settle(); release();
  await both;
  assert.equal(m.sc().length, 1); assert.equal(m.flow.current.state, "IDLE");
});

test("L-2: report는 응답을 못 받으면 같은 turn_id로 2번까지 보낸다. 서버가 답하면 되풀이하지 않는다", async () => {
  let n = 0;
  const a = make(() => (++n === 1 ? err(503, "UNAVAILABLE") : json({ alert_id: "a", session_id: "s" })));
  await toFailed(a); await a.flow.leaveCallStaff(); await a.flow.leaveCallStaff();
  assert.equal(a.sc().length, 2); assert.equal(a.sc()[0].body.turn_id, a.sc()[1].body.turn_id); assert.equal(a.flow.current.state, "IDLE");
  const b = make(() => err(503, "UNAVAILABLE"));
  await toFailed(b); await b.flow.leaveCallStaff(); await b.flow.leaveCallStaff();
  assert.equal(b.sc().length, 2, "상한 2회"); assert.equal(b.flow.current.state, "IDLE", "실패해도 가두지 않는다");
  const c = make(() => err(409, "CONFLICT"));
  await toFailed(c); await c.flow.leaveCallStaff(); await c.flow.leaveCallStaff();
  assert.equal(c.sc().length, 1, "서버가 답한 오류는 되풀이하지 않는다");
});

test("L-3: 재알림 응답을 기다리는 중 확인 단계를 열었다가 늦은 DELIVERED가 오면 대기 화면으로 간다(현재 동작을 고정)", async () => {
  let rel!: () => void;
  const m = make(() => new Promise<Response>((r) => { rel = () => r(retryOk("DELIVERED")); }));
  await toFailed(m); const p = m.flow.retryStaffCall(); await settle();
  await m.flow.leaveCallStaff(); assert.equal(m.flow.current.confirmLeave, true);
  rel(); await p; await settle();
  assert.equal(m.flow.current.state, "WAITING_STAFF");
});

test("L-4: 카운트다운이 끝나면 READY 안내가 실리고 그때만 버튼이 켜진다", async () => {
  const m = make(() => retryOk("DELIVERY_FAILED", 2));
  await toFailed(m); await m.flow.retryStaffCall();
  assert.equal(m.flow.current.staffCall!.notice, "STILL_FAILED");
  await m.clk.tick(); assert.equal(m.flow.current.staffCall!.waitS, 1);
  await m.clk.tick(); assert.equal(m.flow.current.staffCall!.waitS, 0); assert.equal(m.flow.current.staffCall!.notice, "READY");
});

// R7(U424): 실제로 보낸 요청 본문(손으로 쓴 리터럴이 아니라 fetch가 받은 것)을 잡아 계약 스키마 전체로 검증한다.
test("staff-call report·retry 요청 본문은 계약 StaffCallReport·StaffCallRetryRequest 전체를 통과한다(보낸 본문을 잡아 검증)", async () => {
  const { StaffCallReport: vReport, StaffCallRetryRequest: vRetry } = await import("../src/types/validators.gen.cjs");
  const sent: Array<{ path: string; body: unknown }> = [];
  const api = createPublicApiClient({ retry: { maxAttempts: 1 }, sleep: async () => {}, fetch: (async (u: string, init: RequestInit) => {
    sent.push({ path: new URL(u, "http://x").pathname, body: JSON.parse(init.body as string) });
    return json(u.endsWith("/retry") ? { alert_id: "a", staff_alert: "DELIVERED", delivery_attempts: 1, retry_after_s: 0 } : { alert_id: "a", session_id: "s" });
  }) as any });
  await api.staffCallRetry("s1", "t-retry");
  await api.staffCallReport("s1", "NOT_NOTIFIED", "t-report");
  assert.equal(sent.length, 2);
  const retry = sent.find((x) => x.path.endsWith("/retry"))!, report = sent.find((x) => x.path.endsWith("/report"))!;
  assert.equal(vRetry(retry.body), true, JSON.stringify(vRetry.errors));
  assert.equal(vReport(report.body), true, JSON.stringify(vReport.errors));
});
