// D85(PUBLIC_API.md 추가 인터페이스 A·C·E·F): subject_ref 전송, 기기 토큰 헤더, 직원 기록의 새 필드.
// 값은 모두 가짜다. 환자 참조·기기 토큰은 로그·콘솔에 남지 않아야 한다.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { PublicApiClient } from "../api/client.ts";
import { StaffApi } from "../api/staff.ts";
import { ApiError } from "../api/errors.ts";
import { loadKioskStart, parseFragment, type KioskStart } from "../api/device.ts";
import { KioskFlow } from "../apps/kiosk/flow.ts";
import { startMock, json, ok, started } from "./helpers.ts";

const TOKEN = "dev-tok-FAKE-123";
const REF = "visit:2026/10#27=a+b.c_d-e";
const open: Array<() => Promise<void>> = [];
after(async () => { for (const c of open) await c(); });
const fast = { retry: { maxAttempts: 3 }, sleep: async () => {} };
const win = (hash: string, search = "") => {
  const calls: string[] = [];
  return { calls, location: { hash, pathname: "/", search }, history: { replaceState: (_d: unknown, _u: string, url?: string | null) => { calls.push(String(url)); } } };
};

test("시작 URL 조각: subject_ref·device를 읽고 주소창에서 지운다('+' 보존)", async () => {
  const w = win(`#device=${TOKEN}&subject_ref=${encodeURIComponent(REF)}`, "?x=1");
  const s = await loadKioskStart(w, (() => { throw new Error("조각이 있으면 설정을 읽지 않는다"); }) as any);
  assert.deepEqual(s, { deviceToken: TOKEN, subjectRef: REF, subjectInvalid: false });
  assert.deepEqual(w.calls, ["/?x=1"]); // 조각만 지워진다
  assert.deepEqual(parseFragment("#subject_ref=a+b=c"), { subject_ref: "a+b=c" });
});

test("조각이 없으면 /config.json(device_token, subject_ref)에서 받고, 없으면 null", async () => {
  const seen: string[] = [];
  const s = await loadKioskStart(win(""), (async (u: string) => { seen.push(u); return json({ device_token: TOKEN, subject_ref: "p1" }); }) as any);
  assert.deepEqual(s, { deviceToken: TOKEN, subjectRef: "p1", subjectInvalid: false });
  assert.deepEqual(seen, ["/config.json"]); // 쿼리 문자열 없음
  const none = await loadKioskStart(win(""), (async () => json({}, 404)) as any);
  assert.deepEqual(none, { deviceToken: null, subjectRef: null, subjectInvalid: false });
  const broken = await loadKioskStart(win(""), (async () => new Response("<html>")) as any);
  assert.equal(broken.deviceToken, null);
});

test("subject_ref 형식 검증: 129자·허용 밖 문자·빈 값은 무효로 표시", async () => {
  for (const bad of ["x".repeat(129), "공백 있음", "a b", "a?b", ""]) {
    const s = await loadKioskStart(win(`#device=${TOKEN}&subject_ref=${encodeURIComponent(bad)}`));
    assert.equal(s.subjectInvalid, true, JSON.stringify(bad));
    assert.equal(s.subjectRef, null);
  }
  assert.equal((await loadKioskStart(win(`#device=${TOKEN}&subject_ref=${"x".repeat(128)}`))).subjectInvalid, false);
});

function capture() {
  const calls: { url: string; headers: Record<string, string>; body: any }[] = [];
  const f = (async (u: string, init: RequestInit) => {
    calls.push({ url: u, headers: init.headers as Record<string, string>, body: init.body ? JSON.parse(init.body as string) : undefined });
    return init.body && JSON.parse(init.body as string).kind === "SESSION_START" ? started("질문") : ok("질문");
  }) as any;
  return { calls, f };
}

test("세션 시작 본문에 subject_ref를 넣고, 없으면 필드를 생략하고, 틀리면 보내지 않는다", async () => {
  const { calls, f } = capture();
  const c = new PublicApiClient({ ...fast, fetch: f });
  const SID_s1 = (await c.startSession(REF)).session_id;
  const SID_s2 = (await c.startSession()).session_id;
  const SID_s3 = (await c.startSession(null)).session_id;
  assert.equal(calls[0].body.subject_ref, REF);
  assert.equal("subject_ref" in calls[1].body, false);
  assert.equal("subject_ref" in calls[2].body, false);
  assert.throws(() => c.startSession("공백 있음"), /subject_ref/);
  assert.equal(calls.length, 3);
});

test("기기 토큰은 /sessions* 요청에만 Authorization: Bearer로 간다(직원 경로·없을 때는 없음)", async () => {
  const { calls, f } = capture();
  let tok: string | null = TOKEN;
  const c = new PublicApiClient({ ...fast, fetch: f, deviceToken: () => tok });
  const SID_s1 = (await c.startSession()).session_id; await c.sendUtterance(SID_s1, "가짜"); await c.getSessionState(SID_s1).catch(() => {}); await c.endSession(SID_s1);
  await new StaffApi(c).listAlerts("OPEN").catch(() => {});
  await c.intervene(SID_s1, "RESUME", "t1");
  const bySession = calls.filter((x) => x.url.includes("/sessions"));
  assert.ok(bySession.length >= 4 && bySession.every((x) => x.headers.authorization === `Bearer ${TOKEN}`));
  assert.equal(calls.find((x) => x.url.includes("/staff/"))!.headers.authorization, undefined);
  tok = null; calls.length = 0;
  const SID_s9 = (await c.startSession()).session_id;
  assert.equal(calls[0].headers.authorization, undefined);
});

test("개입 결정 본문에 직원 ID가 없다(E절: 게이트웨이 헤더)", async () => {
  const { calls, f } = capture();
  await new StaffApi(new PublicApiClient({ ...fast, fetch: f })).intervene("s1", "END", "t1");
  assert.deepEqual(Object.keys(calls[0].body).sort(), ["decision", "session_id", "turn_id"]);
  assert.equal(calls[0].headers["x-openit-user"], undefined);
});

function flowWith(start: KioskStart, handler: (b: any) => Response = (b) => b.kind === "SESSION_START" ? started("질문") : ok("질문")) {
  const calls: any[] = [];
  const api = new PublicApiClient({ ...fast, deviceToken: () => start.deviceToken, fetch: (async (_u: string, init: RequestInit) => { calls.push({ body: JSON.parse(init.body as string), auth: (init.headers as any).authorization }); return handler(calls.at(-1).body); }) as any });
  return { flow: new KioskFlow(api, { startValues: async () => start }), calls };
}

test("키오스크 흐름: 정상이면 subject_ref와 토큰이 시작 요청에 실린다", async () => {
  const { flow, calls } = flowWith({ deviceToken: TOKEN, subjectRef: REF, subjectInvalid: false });
  await flow.start();
  assert.equal(flow.current.state, "LISTENING");
  assert.equal(calls[0].body.subject_ref, REF);
  assert.equal(calls[0].auth, `Bearer ${TOKEN}`);
});

test("키오스크 흐름: 기기 토큰이 없으면 요청 없이 설정 필요 화면(직원 호출)", async () => {
  const { flow, calls } = flowWith({ deviceToken: null, subjectRef: null, subjectInvalid: false });
  await flow.start();
  assert.deepEqual([flow.current.state, flow.current.callStaffReason], ["CALL_STAFF", "NO_DEVICE_TOKEN"]);
  assert.equal(calls.length, 0);
});

test("키오스크 흐름: subject_ref 형식 오류면 보내지 않고 직원 호출", async () => {
  const { flow, calls } = flowWith({ deviceToken: TOKEN, subjectRef: null, subjectInvalid: true });
  await flow.start();
  assert.deepEqual([flow.current.state, flow.current.callStaffReason], ["CALL_STAFF", "BAD_SUBJECT_REF"]);
  assert.equal(calls.length, 0);
});

test("키오스크 흐름: 서버 401은 인증 거부, 서버가 subject_ref를 필수로 해 400이면 직원 호출", async () => {
  const a = flowWith({ deviceToken: TOKEN, subjectRef: null, subjectInvalid: false }, () => json({ code: "PERMISSION_DENIED" }, 401));
  await a.flow.start();
  assert.deepEqual([a.flow.current.state, a.flow.current.callStaffReason], ["CALL_STAFF", "AUTH"]);
  assert.equal(a.calls.length, 1);
  const b = flowWith({ deviceToken: TOKEN, subjectRef: null, subjectInvalid: false }, () => json({ code: "INVALID_RECORD" }, 400));
  await b.flow.start();
  assert.equal(b.flow.current.state, "CALL_STAFF");
});

async function mk(sc = {}) {
  const m = await startMock(sc); open.push(m.close);
  const hdr = (h: Record<string, string> = {}) => ({ "content-type": "application/json", ...h });
  const start = (body: object, h: Record<string, string> = {}) => fetch(m.base + "/v1/sessions", { method: "POST", headers: hdr(h), body: JSON.stringify({ kind: "SESSION_START", ...body }) });
  return { m, start, hdr };
}

test("모의 서버: 기기 토큰 검증(401), 형식 검증(400), 필수 설정(400), 직원 경로는 토큰 대상이 아니다", async () => {
  const { m, start } = await mk({ deviceToken: TOKEN });
  assert.equal((await start({ session_id: "a" })).status, 401);
  assert.equal((await start({ session_id: "a" }, { authorization: "Bearer other" })).status, 401);
  const auth = { authorization: `Bearer ${TOKEN}` };
  assert.equal((await start({ session_id: "a", subject_ref: REF }, auth)).status, 200);
  assert.equal((await fetch(m.base + "/v1/sessions/a/state")).status, 401);
  assert.equal((await fetch(m.base + "/v1/sessions/a/state", { headers: auth })).status, 200);
  assert.equal((await fetch(m.base + "/v1/staff/alerts?status=OPEN")).status, 200);
  for (const bad of ["x".repeat(129), "a b", "", 5]) {
    const r = await start({ session_id: "b", subject_ref: bad }, auth);
    assert.equal(r.status, 400, JSON.stringify(bad));
    assert.equal(JSON.stringify(await r.json()).includes("a b"), false); // 값을 되풀이하지 않는다
  }
  const req = await mk({ requireSubjectRef: true });
  assert.equal((await req.start({ session_id: "c" })).status, 400);
  assert.equal((await req.start({ session_id: "c", subject_ref: "p1" })).status, 200);
});

test("모의 서버: StaffSessionView에 subject_ref, 알림에 resolved_by(헤더 값, 본문 값은 무시)", async () => {
  const { m, start, hdr } = await mk();
  await start({ session_id: "s1", subject_ref: REF });
  await start({ session_id: "s2" });
  const view = async (id: string) => (await fetch(`${m.base}/v1/staff/sessions/${id}`)).json() as Promise<any>;
  assert.equal((await view("s1")).subject_ref, REF);
  assert.equal((await view("s2")).subject_ref, null);
  const turn = (b: object) => fetch(m.base + "/v1/sessions/s1/turns", { method: "POST", headers: hdr(), body: JSON.stringify({ session_id: "s1", kind: "UTTERANCE", ...b }) });
  await turn({ utterance: "위험", turn_id: "t1" });
  assert.equal((await view("s1")).alerts[0].resolved_by, null); // 열린 알림
  const bodyWithId = await fetch(m.base + "/v1/sessions/s1/intervention", { method: "POST", headers: hdr({ "x-openit-user": "staff-7" }), body: JSON.stringify({ session_id: "s1", decision: "RESUME", turn_id: "t2", staff_id: "evil" }) });
  assert.equal(bodyWithId.status, 400); // 본문에 직원 ID를 넣을 자리가 없다
  const r = await fetch(m.base + "/v1/sessions/s1/intervention", { method: "POST", headers: hdr({ "x-openit-user": "staff-7" }), body: JSON.stringify({ session_id: "s1", decision: "RESUME", turn_id: "t3" }) });
  assert.equal(r.status, 200);
  const v = await view("s1");
  assert.equal(v.alerts[0].resolved_by, "staff-7");
  const list = await (await fetch(m.base + "/v1/staff/alerts?status=RESOLVED")).json() as any;
  assert.equal("resolved_by" in list.items[0], false); // 알림 목록 모양은 그대로
  const e = await new StaffApi(new PublicApiClient({ baseUrl: m.base + "/v1", ...fast })).getSession("zzz").catch((x) => x);
  assert.ok(e instanceof ApiError && e.status === 404);
});

test("토큰과 환자 참조가 콘솔·모의 서버 로그에 남지 않는다", async () => {
  const { m, start } = await mk({ deviceToken: TOKEN });
  const out: string[] = [];
  const orig = { log: console.log, error: console.error, warn: console.warn, info: console.info, debug: console.debug };
  for (const k of Object.keys(orig) as (keyof typeof orig)[]) console[k] = (...a: unknown[]) => { out.push(a.map(String).join(" ")); };
  try {
    const api = new PublicApiClient({ baseUrl: m.base + "/v1", ...fast, deviceToken: () => TOKEN });
    const flow = new KioskFlow(api, { startValues: async () => ({ deviceToken: TOKEN, subjectRef: REF, subjectInvalid: false }) });
    await flow.start(); await flow.hear({ text: "가짜 문장", confidence: 0.9 });
    const bad = new PublicApiClient({ baseUrl: m.base + "/v1", ...fast, deviceToken: () => "wrong" });
    await bad.startSession(REF).catch(() => {});
    await start({ session_id: "q" }).catch(() => {});
  } finally { Object.assign(console, orig); }
  const all = JSON.stringify([out, m.state.log]);
  assert.equal(all.includes(TOKEN), false);
  assert.equal(all.includes(REF), false);
  assert.equal(all.includes("wrong"), false);
});
