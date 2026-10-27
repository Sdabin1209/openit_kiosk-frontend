import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import { PublicApiClient } from "../api/client.ts";
import { StaffApi } from "../api/staff.ts";
import { ApiError, CallStaffError } from "../api/errors.ts";
import { KioskFlow } from "../apps/kiosk/flow.ts";
import { startMock } from "./helpers.ts";

const SCHEMA_DIR = new URL("../../survey-service/schema/schemas/", import.meta.url);
const ajv = new Ajv2020({ strict: false });
const validate = ajv.compile(JSON.parse(readFileSync(new URL("FrontendInput.json", SCHEMA_DIR), "utf8")));
const validateMsg = ajv.compile(JSON.parse(readFileSync(new URL("FrontendMessage.json", SCHEMA_DIR), "utf8")));
const fast = { retryDelayMs: 0, sleep: async () => {} };
const open: Array<() => Promise<void>> = [];
after(async () => { for (const c of open) await c(); });
async function mk(sc = {}, opt = {}, mopt = {}) {
  const m = await startMock(sc, mopt); open.push(m.close);
  return { m, api: new PublicApiClient({ baseUrl: m.base + "/v1", ...fast, ...opt }) };
}

test("모의 서버 응답이 FrontendInput 스키마를 지키고 전체 문진이 돈다", async () => {
  const { m, api } = await mk();
  const outs = [await api.startSession("s1"), await api.sendUtterance("s1", "머리가 아파요"), await api.sendUtterance("s1", "어제부터요"), await api.endSession("s1")];
  for (const o of outs) assert.ok(validate(o), JSON.stringify(validate.errors));
  assert.equal(outs[3].response_text, null);
  assert.equal(m.state.log.some((l) => l.path.includes("secret")), false);
});

const validateDecision = ajv.compile(JSON.parse(readFileSync(new URL("InterventionDecision.json", SCHEMA_DIR), "utf8")));
const BSCHEMAS = new URL("../../boundary-contracts/schemas/", import.meta.url);
const bs = (n: string) => ajv.compile(JSON.parse(readFileSync(new URL(n, BSCHEMAS), "utf8")));
const vAlert = bs("StaffAlert.schema.json"), vPage = bs("StaffAlertPage.schema.json"), vState = bs("SessionState.schema.json"), vPush = bs("PushConfig.schema.json");

test("turn_id는 API 봉투 필드: 떼어 내면 FrontendMessage/InterventionDecision을 지킨다(D66)", async () => {
  const bodies: Record<string, any>[] = [];
  const c = new PublicApiClient({ ...fast, fetch: (async (_u: string, init: RequestInit) => { bodies.push(JSON.parse(init.body as string)); return new Response(JSON.stringify({ response_text: null, turn_failure_signal: null })); }) as any });
  await c.startSession("s1"); await c.sendUtterance("s1", "x", "t1"); await c.intervene("s1", "RESUME", "t2"); await c.endSession("s1");
  assert.equal(bodies.length, 4);
  for (const b of bodies) {
    const { turn_id, ...rest } = b as Record<string, any>;
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
  ajv.addSchema(JSON.parse(readFileSync(new URL("_common.schema.json", BSCHEMAS), "utf8")), "_common.schema.json");
  const vErr = bs("BoundaryError.schema.json");
  const okErr: boolean = vErr(body);
  assert.ok(okErr, JSON.stringify(vErr.errors));
  assert.match(String(body.pipeline_schema_version), /^2\./);
});

test("알림·목록·상태·푸시 설정 응답이 v2.0.2 스키마를 지킨다", async () => {
  const { m, api } = await mk({ vapidPublicKey: "PUBKEY" });
  await api.startSession("s1"); await api.sendUtterance("s1", "위험");
  const page = await new StaffApi(api).listAlerts("OPEN");
  assert.ok(vPage(page), JSON.stringify(vPage.errors));
  assert.ok(vAlert(page.items[0]));
  const st = await api.getSessionState("s1");
  assert.ok(vState(st), JSON.stringify(vState.errors));
  assert.equal(st.state, "PAUSED_RISK");
  const pc = await new StaffApi(api).pushConfig();
  assert.ok(vPush(pc)); assert.equal(pc.vapid_public_key, "PUBKEY");
  m.state.sc.vapidPublicKey = null;
  assert.equal((await api.getPushConfig()).vapid_public_key, null);
});

test("위험 정지 -> 직원 재개: state는 ACTIVE+resume_text, 다음 턴 뒤 null, 종료는 ENDED", async () => {
  const { api } = await mk();
  const staff = new StaffApi(api);
  await api.startSession("s1"); await api.sendUtterance("s1", "위험");
  await staff.intervene("s1", "RESUME", "i1");
  const a = await api.getSessionState("s1");
  assert.equal(a.state, "ACTIVE"); assert.ok(a.resume_text);
  await api.sendUtterance("s1", "계속", "t9");
  assert.equal((await api.getSessionState("s1")).resume_text, null);
  await api.sendUtterance("s1", "위험 또");
  await staff.intervene("s1", "END", "i2");
  assert.equal((await api.getSessionState("s1")).state, "ENDED");
  await assert.rejects(api.getSessionState("nope"), (e) => e instanceof ApiError && e.status === 404);
});

test("risk_resume 시나리오: 키오스크가 폴링으로 재개를 알고 이어간다", async () => {
  const { api } = await mk({ autoResumeMs: 30 });
  const flow = new KioskFlow(api, { pollMs: 10, sleep: (ms) => new Promise((r) => setTimeout(r, ms)) });
  await flow.start(); await flow.hear({ text: "위험해요", confidence: 0.9 });
  assert.equal(flow.current.state, "WAITING_STAFF");
  await new Promise((r) => setTimeout(r, 150));
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
  const api = new PublicApiClient({ baseUrl: m.base + "/v1", sleep: async (ms) => { waits.push(ms); } });
  await api.startSession("s2");
  assert.deepEqual(waits, [2000]);
});

test("같은 turn_id는 같은 응답이고 한 번만 처리된다", async () => {
  const { m, api } = await mk();
  await api.startSession("s1");
  const a = await api.sendUtterance("s1", "하나", "t-same");
  const b = await api.sendUtterance("s1", "하나", "t-same");
  assert.deepEqual(a, b);
  assert.equal(m.state.sessions.get("s1")!.turns, 1);
});

test("hang 시나리오: 앞 두 번 무응답이어도 같은 turn_id 재시도로 한 번만 처리", async () => {
  const { m, api } = await mk({ hangFirst: 0 }, { timeoutMs: 50 });
  await api.startSession("s1");
  m.state.sc.hangFirst = 2;
  const r = await api.sendUtterance("s1", "하나", "t1");
  assert.ok(validate(r));
  assert.equal(m.state.sessions.get("s1")!.turns, 1);
});

test("hang이 3회 이상이면 CallStaffError", async () => {
  const { m, api } = await mk({}, { timeoutMs: 30 });
  await api.startSession("s1");
  m.state.sc.hangFirst = 3;
  await assert.rejects(api.sendUtterance("s1", "하나", "t1"), CallStaffError);
});

test("error 시나리오: 503 두 번 뒤 성공, 지연 시나리오", async () => {
  const { m, api } = await mk({ errorStatus: 503, errorTimes: 2 });
  assert.ok(validate(await api.startSession("s1")));
  m.state.sc.delayMs = 40;
  const t0 = Date.now(); await api.sendUtterance("s1", "x", "t1");
  assert.ok(Date.now() - t0 >= 35);
});

test("위험 정지 -> 알림 -> 개입 RESUME/END, 중복 turn_id는 같은 응답, 정지 아니면 409", async () => {
  const { m, api } = await mk();
  const staff = new StaffApi(new PublicApiClient({ baseUrl: m.base + "/v1", ...fast }));
  await api.startSession("s1");
  await assert.rejects(staff.intervene("s1", "RESUME", "i0"), (e) => e instanceof ApiError && e.status === 409);
  const stop = await api.sendUtterance("s1", "위험해요");
  assert.ok(validate(stop));
  assert.equal(stop.turn_failure_signal?.staff_alert, "DELIVERED");
  await assert.rejects(api.sendUtterance("s1", "또"), (e) => e instanceof ApiError && e.status === 409);
  const open = await staff.listAlerts("OPEN");
  assert.equal(open.items.length, 1);
  assert.equal(open.items[0].kind, "RISK_STOP");
  const r1 = await staff.intervene("s1", "RESUME", "i1");
  const r2 = await staff.intervene("s1", "RESUME", "i1");
  assert.deepEqual(r1, r2);
  assert.ok(validate(r1));
  assert.equal((await staff.listAlerts("OPEN")).items.length, 0);
  const done = (await staff.listAlerts("RESOLVED")).items[0];
  assert.equal(done.resolved_by_decision, "RESUME");
});

test("delivery_failed 시나리오: 키오스크가 직원 호출 화면, 알림은 목록에 있다", async () => {
  const { m, api } = await mk({ alertDelivery: "DELIVERY_FAILED" });
  const flow = new KioskFlow(api);
  await flow.start(); await flow.hear({ text: "위험해요", confidence: 0.9 });
  assert.equal(flow.current.state, "CALL_STAFF");
  assert.equal(m.state.alerts.length, 1);
});

test("not_committed 시나리오", async () => {
  const { api } = await mk({ notCommitted: true });
  const flow = new KioskFlow(api);
  await flow.start(); await flow.hear({ text: "아파요", confidence: 0.9 });
  assert.equal(flow.current.repeatReason, "NOT_COMMITTED");
});

test("푸시 구독 등록은 멱등, 해지 가능", async () => {
  const { m, api } = await mk();
  const staff = new StaffApi(api);
  const sub = { endpoint: "https://push.example/1", keys: { p256dh: "a", auth: "b" } };
  await staff.registerPush(sub); await staff.registerPush(sub);
  assert.equal(m.state.subs.size, 1);
  await staff.unregisterPush(sub.endpoint);
  assert.equal(m.state.subs.size, 0);
});

test("SSE: 새 알림과 해결 이벤트, Last-Event-ID로 이어 받기", async () => {
  const { m, api } = await mk();
  await api.startSession("s1");
  await api.sendUtterance("s1", "위험");
  const read = async (headers: Record<string, string> = {}, want = 1) => {
    const ctl = new AbortController();
    const res = await fetch(m.base + "/v1/staff/alerts/stream", { headers, signal: ctl.signal });
    const dec = new TextDecoder(); let buf = "";
    for await (const chunk of res.body as any) { buf += dec.decode(chunk); if ((buf.match(/^data:/gm) ?? []).length >= want) break; }
    ctl.abort(); return buf;
  };
  const first = await read();
  assert.match(first, /id: 1\nevent: alert\ndata: .*"status":"OPEN"/);
  await new StaffApi(api).intervene("s1", "END", "i1");
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

test("SSE는 설정한 간격으로 ': ping' 주석을 보낸다", async () => {
  const { m } = await mk({}, {}, { pingMs: 20 });
  const ctl = new AbortController();
  const res = await fetch(m.base + "/v1/staff/alerts/stream", { signal: ctl.signal });
  const dec = new TextDecoder(); let buf = "";
  for await (const chunk of res.body as any) { buf += dec.decode(chunk); if (buf.includes(": ping")) break; }
  ctl.abort();
  assert.match(buf, /: ping/);
});
