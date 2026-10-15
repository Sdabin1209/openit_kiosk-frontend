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
async function mk(sc = {}, opt = {}) {
  const m = await startMock(sc); open.push(m.close);
  return { m, api: new PublicApiClient({ baseUrl: m.base + "/v1", ...fast, ...opt }) };
}

test("모의 서버 응답이 FrontendInput 스키마를 지키고 전체 문진이 돈다", async () => {
  const { m, api } = await mk();
  const outs = [await api.startSession("s1"), await api.sendUtterance("s1", "머리가 아파요"), await api.sendUtterance("s1", "어제부터요"), await api.endSession("s1")];
  for (const o of outs) assert.ok(validate(o), JSON.stringify(validate.errors));
  assert.equal(outs[3].response_text, null);
  assert.equal(m.state.log.some((l) => l.path.includes("secret")), false);
});

test("보내는 본문이 FrontendMessage 스키마를 지킨다(turn_id는 스키마에 없음, CR-002)", () => {
  assert.ok(validateMsg({ session_id: "s1", kind: "UTTERANCE", utterance: "x" }));
  assert.equal(validateMsg({ session_id: "s1", kind: "UTTERANCE", utterance: "x", turn_id: "t" }), false);
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
  assert.match(first, /id: 1\ndata: .*"status":"OPEN"/);
  await new StaffApi(api).intervene("s1", "END", "i1");
  const resumed = await read({ "last-event-id": "1" });
  assert.doesNotMatch(resumed, /id: 1\n/);
  assert.match(resumed, /id: 2\ndata: .*"status":"RESOLVED"/);
});

test("healthz/readyz와 모르는 경로", async () => {
  const { m } = await mk();
  assert.equal((await fetch(m.base + "/healthz")).status, 200);
  assert.equal((await fetch(m.base + "/readyz")).status, 200);
  const r = await fetch(m.base + "/v1/nope");
  assert.equal(r.status, 404);
});
