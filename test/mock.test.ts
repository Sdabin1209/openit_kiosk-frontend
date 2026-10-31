import { contractJson } from "../scripts/contract-source.mjs";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import { createPublicApiClient } from "../src/wiring/public_api.ts";
import { createStaffApi } from "../src/wiring/public_api.ts";
import { ApiError, CallStaffError } from "../src/components/link_public_api_send.ts";
import { createKioskFlow } from "../src/wiring/kiosk.ts";
import { startMock, waitFor } from "./helpers.ts";

const SCHEMA_DIR = new URL("../../survey-service/schema/schemas/", import.meta.url);
const ajv = new Ajv2020({ strict: false });
const validate = ajv.compile(JSON.parse(readFileSync(new URL("FrontendInput.json", SCHEMA_DIR), "utf8")));
const validateMsg = ajv.compile(JSON.parse(readFileSync(new URL("FrontendMessage.json", SCHEMA_DIR), "utf8")));
const fast = { retry: { maxAttempts: 3 }, sleep: async () => {} };
const open: Array<() => Promise<void>> = [];
after(async () => { for (const c of open) await c(); });
async function mk(sc = {}, opt = {}, mopt = {}) {
  const m = await startMock(sc, mopt); open.push(m.close);
  return { m, api: createPublicApiClient({ baseUrl: m.base + "/v1", ...fast, ...opt }) };
}

test("모의 서버 응답이 FrontendInput 스키마를 지키고 전체 문진이 돈다", async () => {
  const { m, api } = await mk();
  const st = await api.startSession(), sid = st.session_id;
  const outs = [st, await api.sendUtterance(sid, "머리가 아파요"), await api.sendUtterance(sid, "어제부터요"), await api.endSession(sid)];
  for (const o of outs) assert.ok(validate(o), JSON.stringify(validate.errors)); // 시작 응답의 session_id도 survey-service FrontendInput 스키마 그대로 검사한다
  assert.equal(outs[3].response_text, null);
  assert.equal(m.state.log.some((l) => l.path.includes("secret")), false);
});

const validateDecision = ajv.compile(JSON.parse(readFileSync(new URL("InterventionDecision.json", SCHEMA_DIR), "utf8")));
const bs = (n: string) => ajv.compile(contractJson(`schemas/${n}`)); // 고정 태그의 계약(ADR 0027)
ajv.addSchema(contractJson("schemas/StaffAlert.schema.json"), "StaffAlert.schema.json"); // StaffAlertPage가 $ref로 참조(계약 2ec2849)
const vAlert = ajv.getSchema("StaffAlert.schema.json")!, vPage = bs("StaffAlertPage.schema.json"), vState = bs("SessionState.schema.json"), vPush = bs("PushConfig.schema.json");

test("turn_id는 API 봉투 필드: 떼어 내면 FrontendMessage/InterventionDecision을 지킨다(D66)", async () => {
  const bodies: Record<string, any>[] = [];
  const c = createPublicApiClient({ ...fast, fetch: (async (_u: string, init: RequestInit) => { bodies.push(JSON.parse(init.body as string)); return new Response(JSON.stringify({ response_text: null, turn_failure_signal: null, session_id: "srv-1" })); }) as any });
  const SID_s1 = (await c.startSession()).session_id; await c.sendUtterance(SID_s1, "x", "t1"); await c.intervene(SID_s1, "RESUME", "t2"); await c.endSession(SID_s1);
  assert.equal(bodies.length, 4);
  for (const b of bodies) {
    const { turn_id, ...rest } = b as Record<string, any>;
    if (rest.kind === "SESSION_START") assert.deepEqual(Object.keys(rest), ["kind"]); // 계약 2.2.0: 시작 본문에 session_id가 없다. 아래 스키마 검사(FrontendMessage, session_id 선택)도 그대로 받는다
    const v = rest.decision ? validateDecision : validateMsg;
    assert.ok(v(rest), JSON.stringify(v.errors));
    if (rest.kind === "UTTERANCE" || rest.decision) assert.ok(turn_id);
  }
});

test("모의 서버는 봉투 밖의 필드를 400으로 거부한다", async () => {
  const { m } = await mk();
  await fetch(m.base + "/v1/sessions", { method: "POST", body: JSON.stringify({ session_id: "s1", kind: "SESSION_START" }) });
  const bad = await fetch(m.base + "/v1/sessions/s1/turns", { method: "POST", body: JSON.stringify({ session_id: "s1", kind: "UTTERANCE", utterance: "x", turn_id: "t", extra: 1 }) });
  assert.equal(bad.status, 400);
  const body: any = await bad.json();
  assert.equal(body.code, "INVALID_RECORD");
  // 오류 본문은 계약의 BoundaryError 스키마(pipeline_schema_version 포함)를 지킨다.
  ajv.addSchema(contractJson("schemas/_common.schema.json"), "_common.schema.json");
  const vErr = bs("BoundaryError.schema.json");
  const okErr: boolean = vErr(body);
  assert.ok(okErr, JSON.stringify(vErr.errors));
  assert.match(String(body.pipeline_schema_version), /^3\./);
});

test("알림·목록·상태·푸시 설정 응답이 계약 스키마를 지킨다", async () => {
  const { m, api } = await mk({ vapidPublicKey: "PUBKEY" });
  const SID_s1 = (await api.startSession()).session_id; await api.sendUtterance(SID_s1, "위험");
  const page = await createStaffApi(api).listAlerts("OPEN");
  assert.ok(vPage(page), JSON.stringify(vPage.errors)); // 새 optional 필드 포함 목록 전체(계약 2ec2849에서 StaffAlertPage가 StaffAlert를 $ref)
  assert.ok(vAlert(page.items[0]), JSON.stringify(vAlert.errors));
  const st = await api.getSessionState(SID_s1);
  assert.ok(vState(st), JSON.stringify(vState.errors));
  assert.equal(st.state, "PAUSED_RISK");
  const pc = await createStaffApi(api).pushConfig();
  assert.ok(vPush(pc)); assert.equal(pc.vapid_public_key, "PUBKEY");
  m.state.sc.vapidPublicKey = null;
  assert.equal((await api.getPushConfig()).vapid_public_key, null);
});

test("위험 정지 -> 직원 재개: state는 ACTIVE+resume_text, 다음 턴 뒤 null, 종료는 ENDED", async () => {
  const { api } = await mk();
  const staff = createStaffApi(api);
  const SID_s1 = (await api.startSession()).session_id; await api.sendUtterance(SID_s1, "위험");
  await staff.intervene(SID_s1, "RESUME", "i1");
  const a = await api.getSessionState(SID_s1);
  assert.equal(a.state, "ACTIVE"); assert.ok(a.resume_text);
  await api.sendUtterance(SID_s1, "계속", "t9");
  assert.equal((await api.getSessionState(SID_s1)).resume_text, null);
  await api.sendUtterance(SID_s1, "위험 또");
  await staff.intervene(SID_s1, "END", "i2");
  assert.equal((await api.getSessionState(SID_s1)).state, "ENDED");
  await assert.rejects(api.getSessionState("nope"), (e) => e instanceof ApiError && e.status === 404);
});

// 요구사항: 위험 정지 중인 키오스크가 상태 폴링으로 재개를 알고 이어간다. 재개를 일으키는 것은 시간이 아니라 직원의 결정(사건)이다(U422: 실제 시간을 기다리지 않는다).
test("직원이 RESUME하면 키오스크가 폴링으로 재개를 알고 이어간다", async () => {
  const { api } = await mk({ alertDelivery: "DELIVERED" });
  const flow = createKioskFlow(api, { pollMs: 10, sleep: () => new Promise((r) => setImmediate(r)) }); // 폴링 간격은 판정이 아니다: 시계 없이 한 바퀴씩 양보한다
  await flow.start(); await flow.hear({ text: "위험해요", confidence: 0.9 });
  assert.equal(flow.current.state, "WAITING_STAFF");
  await createStaffApi(api).intervene(flow.session!, "RESUME", "i-resume");
  await waitFor(() => flow.current.state === "LISTENING", "재개를 폴링으로 알아 LISTENING");
  assert.equal(flow.current.state, "LISTENING");
  assert.match(flow.current.text ?? "", /이어서/);
  flow.reset();
});

test("rate_limited 시나리오: 429에 Retry-After를 붙이고 클라이언트가 따른다", async () => {
  const { m } = await mk({ errorStatus: 429, errorTimes: 1, retryAfterSec: 2 });
  const r = await fetch(m.base + "/v1/sessions", { method: "POST", body: "{}" });
  assert.equal(r.status, 429);
  assert.equal(r.headers.get("retry-after"), "2");
  assert.equal(((await r.json()) as any).code, "UNAVAILABLE");
  const waits: number[] = [];
  m.state.sc.errorTimes = 1;
  const api = createPublicApiClient({ baseUrl: m.base + "/v1", rand: () => 0, sleep: async (ms) => { waits.push(ms); } });
  (await api.startSession()).session_id;
  assert.deepEqual(waits, [2000]);
});

test("같은 turn_id는 같은 응답이고 한 번만 처리된다", async () => {
  const { m, api } = await mk();
  const SID_s1 = (await api.startSession()).session_id;
  const a = await api.sendUtterance(SID_s1, "하나", "t-same");
  const b = await api.sendUtterance(SID_s1, "하나", "t-same");
  assert.deepEqual(a, b);
  assert.equal(m.state.sessions.get(SID_s1)!.turns, 1);
});

/** 모의 서버가 응답하지 않기로 한 요청(hangFirst)은 서버가 그 요청을 받은 것을 확인한 뒤 클라이언트 쪽에서 끊는다.
 * 클라이언트 타임아웃 값을 짧게 줄이는 방식은 부하 때문에 정상 요청까지 끊어 간헐 실패를 만든다(이 파일의 이전 방식).
 * 실제 10초 타임아웃 경로는 test/client.test.ts의 가짜 fetch 시험이 본다. */
function hangThenAbort(m: Awaited<ReturnType<typeof startMock>>): typeof fetch {
  return (async (u: any, init: any) => {
    const left = m.state.sc.hangFirst;
    if (left <= 0) return fetch(u, init);
    const ctl = new AbortController();
    const p = fetch(u, { ...init, signal: ctl.signal });
    void waitFor(() => m.state.sc.hangFirst < left, "서버가 무응답 요청을 받음").then(() => ctl.abort());
    return p;
  }) as typeof fetch;
}

test("hang 시나리오: 앞 두 번 무응답이어도 같은 turn_id 재시도로 한 번만 처리", async () => {
  const { m, api } = await mk({ hangFirst: 0 }, {});
  (api as any).f = hangThenAbort(m);
  const SID_s1 = (await api.startSession()).session_id;
  m.state.sc.hangFirst = 2;
  const r = await api.sendUtterance(SID_s1, "하나", "t1");
  assert.ok(validate(r));
  assert.equal(m.state.sessions.get(SID_s1)!.turns, 1);
});

test("hang이 3회 이상이면 CallStaffError", async () => {
  const { m, api } = await mk({}, {});
  (api as any).f = hangThenAbort(m);
  const SID_s1 = (await api.startSession()).session_id;
  m.state.sc.hangFirst = 3;
  await assert.rejects(api.sendUtterance(SID_s1, "하나", "t1"), CallStaffError);
});

test("error 시나리오: 503 두 번 뒤 성공", async () => {
  const { api } = await mk({ errorStatus: 503, errorTimes: 2 });
  const first = await api.startSession(), SID_s1 = first.session_id;
  assert.ok(validate(first), JSON.stringify(validate.errors));
  await api.sendUtterance(SID_s1, "x", "t1"); // 지연 시나리오의 실제 지연은 모의 서버(시연용 대역)의 기능이고 요구사항이 아니라 시간을 재지 않는다(U422)
});

test("위험 정지 -> 알림 -> 개입 RESUME/END, 중복 turn_id는 같은 응답, 정지 아니면 409", async () => {
  const { m, api } = await mk();
  const staff = createStaffApi(createPublicApiClient({ baseUrl: m.base + "/v1", ...fast }));
  const SID_s1 = (await api.startSession()).session_id;
  await assert.rejects(staff.intervene(SID_s1, "RESUME", "i0"), (e) => e instanceof ApiError && e.status === 409);
  const stop = await api.sendUtterance(SID_s1, "위험해요");
  assert.ok(validate(stop));
  assert.equal(stop.turn_failure_signal?.staff_alert, "DELIVERED");
  await assert.rejects(api.sendUtterance(SID_s1, "또"), (e) => e instanceof ApiError && e.status === 409);
  const open = await staff.listAlerts("OPEN");
  assert.equal(open.items.length, 1);
  assert.equal(open.items[0].kind, "RISK_STOP");
  const r1 = await staff.intervene(SID_s1, "RESUME", "i1");
  const r2 = await staff.intervene(SID_s1, "RESUME", "i1");
  assert.deepEqual(r1, r2);
  assert.ok(validate(r1));
  assert.equal((await staff.listAlerts("OPEN")).items.length, 0);
  const done = (await staff.listAlerts("RESOLVED")).items[0];
  assert.equal(done.resolved_by_decision, "RESUME");
});

test("delivery_failed 시나리오: 키오스크가 직원 호출 화면, 알림은 목록에 있다", async () => {
  const { m, api } = await mk({ alertDelivery: "DELIVERY_FAILED" });
  const flow = createKioskFlow(api);
  await flow.start(); await flow.hear({ text: "위험해요", confidence: 0.9 });
  assert.equal(flow.current.state, "CALL_STAFF");
  assert.equal(m.state.alerts.length, 1);
});

test("not_committed 시나리오", async () => {
  const { api } = await mk({ notCommitted: true });
  const flow = createKioskFlow(api);
  await flow.start(); await flow.hear({ text: "아파요", confidence: 0.9 });
  assert.equal(flow.current.repeatReason, "NOT_COMMITTED");
});

test("푸시 구독 등록은 멱등, 해지 가능", async () => {
  const { m, api } = await mk();
  const staff = createStaffApi(api);
  const sub = { endpoint: "https://push.example/1", keys: { p256dh: "a", auth: "b" } };
  await staff.registerPush(sub); await staff.registerPush(sub);
  assert.equal(m.state.subs.size, 1);
  await staff.unregisterPush(sub.endpoint);
  assert.equal(m.state.subs.size, 0);
});

test("SSE: 새 알림과 해결 이벤트, Last-Event-ID로 이어 받기", async () => {
  const { m, api } = await mk();
  const SID_s1 = (await api.startSession()).session_id;
  await api.sendUtterance(SID_s1, "위험");
  const read = async (headers: Record<string, string> = {}, want = 1) => {
    const ctl = new AbortController();
    const res = await fetch(m.base + "/v1/staff/alerts/stream", { headers, signal: ctl.signal });
    const dec = new TextDecoder(); let buf = "";
    for await (const chunk of res.body as any) { buf += dec.decode(chunk); if ((buf.match(/^event: (alert|resolved)\n/gm) ?? []).length >= want) break; } // heartbeat 이벤트는 세지 않는다
    ctl.abort(); return buf;
  };
  const first = await read();
  assert.match(first, /id: 1\nevent: alert\ndata: .*"status":"OPEN"/);
  await createStaffApi(api).intervene(SID_s1, "END", "i1");
  const resumed = await read({ "last-event-id": "1" });
  assert.doesNotMatch(resumed, /id: 1\n/);
  assert.match(resumed, /id: 2\nevent: resolved\ndata: .*"status":"RESOLVED"/);
});

test("healthz/readyz와 모르는 경로", async () => {
  const { m } = await mk();
  assert.equal((await fetch(m.base + "/healthz")).status, 200);
  assert.equal((await fetch(m.base + "/readyz")).status, 200);
  const r = await fetch(m.base + "/v1/nope");
  assert.equal(r.status, 404);
});

test("turn_in_progress 시나리오: 409 CONFLICT + details.reason + Retry-After, 클라이언트가 같은 turn_id로 재시도해 성공한다", async () => {
  const { m } = await mk({ errorStatus: 409, errorTimes: 1, errorReason: "TURN_IN_PROGRESS", retryAfterSec: 2 });
  const r = await fetch(m.base + "/v1/sessions", { method: "POST", body: "{}" });
  assert.equal(r.status, 409);
  assert.equal(r.headers.get("retry-after"), "2");
  const b = (await r.json()) as any;
  assert.equal(b.code, "CONFLICT"); assert.equal(b.details.reason, "TURN_IN_PROGRESS");
  const waits: number[] = [];
  m.state.sc.errorTimes = 1;
  const api = createPublicApiClient({ baseUrl: m.base + "/v1", rand: () => 0, sleep: async (ms) => { waits.push(ms); } });
  (await api.startSession()).session_id;
  assert.deepEqual(waits, [2000]);
});

test("SSE: 연결 직후 id 없는 heartbeat, 끄면 멈추고, resyncOnConnect면 resync를 한 번 보낸다", async () => {
  const { m } = await mk({ resyncOnConnect: true }, {});
  const ctl = new AbortController();
  const res = await fetch(m.base + "/v1/staff/alerts/stream", { signal: ctl.signal });
  const dec = new TextDecoder(); let buf = "";
  for await (const chunk of res.body as any) { buf += dec.decode(chunk); if (buf.includes("event: resync")) break; } // 연결 직후 heartbeat와 resync가 먼저 온다(주기 heartbeat는 시간 의존이라 보지 않는다)
  assert.match(buf, /event: heartbeat\ndata: \{"ts":"\d{4}-\d\d-\d\dT[^"]+"\}\n\n/);
  assert.doesNotMatch(buf, /id: \d+\nevent: heartbeat/);
  assert.equal((buf.match(/^event: resync\n/gm) ?? []).length, 1);
  assert.match(buf, /event: resync\ndata: \{"reason":"EVENTS_NOT_RESUMABLE"\}/);
  const r = await fetch(m.base + "/__mock/heartbeat", { method: "POST", body: JSON.stringify({ on: false }) });
  assert.equal(((await r.json()) as any).heartbeat, false);
  ctl.abort();
});

test("StaffSessionView: 모의 서버의 세션 보기가 survey-service 스키마를 그대로 지킨다(알림 kind는 RISK_STOP 등 공개 이름)", async () => {
  const { api } = await mk({ alertDelivery: "DELIVERED" });
  const sid = (await api.startSession()).session_id; await api.sendUtterance(sid, "위험해요");
  const v = await createStaffApi(api).getSession(sid);
  const vView = ajv.compile(JSON.parse(readFileSync(new URL("StaffSessionView.json", SCHEMA_DIR), "utf8")));
  assert.ok(vView(v), JSON.stringify(vView.errors));
  assert.equal(v.alerts[0].kind, "RISK_STOP");
});
