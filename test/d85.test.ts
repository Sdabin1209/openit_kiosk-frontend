// 공개 API A/C/E/F: 환자 참조, 서버 발급 ID, 기기 mTLS. 모든 값은 시험용이다.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createPublicApiClient, createStaffApi } from "../src/wiring/public_api.ts";
import { loadKioskStart } from "../src/wiring/kiosk.ts";
import { parseFragment } from "../src/components/start_values.ts";
import { createKioskFlow } from "../src/wiring/kiosk.ts";
import { startMock, json, ok, started, qsFetch } from "./helpers.ts";

const REF = "visit:2026/10#27=a+b.c_d-e";
const open: Array<() => Promise<void>> = [];
after(async () => { for (const close of open) await close(); });
const fast = { retry: { maxAttempts: 3 }, sleep: async () => {} };
const win = (hash: string, search = "") => {
  const calls: string[] = [];
  return { calls, location: { hash, pathname: "/", search }, history: { replaceState: (_d: unknown, _u: string, url?: string | null) => { calls.push(String(url)); } } };
};

test("시작 조각의 환자 참조를 읽고 주소창에서 지운다(+ 보존)", async () => {
  const w = win(`#subject_ref=${encodeURIComponent(REF)}`, "?x=1");
  assert.deepEqual(await loadKioskStart(w, (async () => json({}, 404)) as any), { subjectRef: REF, subjectInvalid: false, questionSetId: null });
  assert.deepEqual(w.calls, ["/?x=1"]);
  assert.deepEqual(parseFragment("#subject_ref=a+b=c"), { subject_ref: "a+b=c" });
});

test("공개 기기 설정은 문진표·STT 설정만 주고 환자 참조·기기 자격은 주지 않는다", async () => {
  const seen: string[] = [];
  const value = await loadKioskStart(win(""), (async (url: string) => { seen.push(url); return json({ question_set_id: "general", allow_remote_stt: true }); }) as any);
  assert.deepEqual(value, { subjectRef: null, subjectInvalid: false, questionSetId: "general", allowRemoteStt: true });
  assert.deepEqual(seen, ["/config.json"]);
  for (const response of [json({}, 404), new Response("<html>")]) {
    assert.deepEqual(await loadKioskStart(win(""), (async () => response) as any), { subjectRef: null, subjectInvalid: false, questionSetId: null });
  }
});

test("폐기된 기기 토큰 설정/조각은 계약 위반으로 통째로 거부한다", async () => {
  for (const [hash, config] of [["#device=retired&subject_ref=p1", {}], ["", { device_token: "retired", subject_ref: "p1" }]] as const) {
    const value = await loadKioskStart(win(hash), (async () => json(config)) as any);
    assert.equal(value.subjectRef, null);
    assert.equal(value.subjectInvalid, hash !== "");
    assert.equal("deviceToken" in value, false);
  }
});

test("공개 설정의 폐기된 환자 참조는 쓰지 않고 조각의 참조만 유지한다", async () => {
  for (const hash of ["", "#subject_ref=url-patient"]) {
    const value = await loadKioskStart(win(hash), (async () => json({ subject_ref: "public-patient", question_set_id: "general", allow_remote_stt: true })) as any);
    assert.deepEqual(value, { subjectRef: hash ? "url-patient" : null, subjectInvalid: false, questionSetId: null });
  }
});

test("환자 참조의 길이·문자 형식 오류를 알리고 값 없이 시작하지 않는다", async () => {
  for (const bad of ["x".repeat(129), "공백 있음", "a b", "a?b", ""]) {
    const value = await loadKioskStart(win(`#subject_ref=${encodeURIComponent(bad)}`), (async () => json({}, 404)) as any);
    assert.equal(value.subjectInvalid, true);
    assert.equal(value.subjectRef, null);
  }
  assert.equal((await loadKioskStart(win(`#subject_ref=${"x".repeat(128)}`), (async () => json({}, 404)) as any)).subjectInvalid, false);
});

function capture() {
  const calls: { url: string; headers: Record<string, string>; body: any }[] = [];
  const fetch = (async (url: string, init: RequestInit) => {
    const body = init.body ? JSON.parse(init.body as string) : undefined;
    calls.push({ url, headers: init.headers as Record<string, string>, body });
    return body?.kind === "SESSION_START" ? started("질문") : ok("질문");
  }) as any;
  return { calls, fetch };
}

test("시작 본문에는 환자 참조만 넣고 세션 ID·기기 인증 헤더는 보내지 않는다", async () => {
  const { calls, fetch } = capture();
  const api = createPublicApiClient({ ...fast, fetch: qsFetch(fetch) });
  const sid = (await api.startSession(REF)).session_id;
  await api.sendUtterance(sid, "가짜");
  await api.endSession(sid);
  await createStaffApi(api).intervene(sid, "RESUME", "t1");
  assert.equal(calls[0].body.subject_ref, REF);
  assert.equal("session_id" in calls[0].body, false);
  for (const call of calls) {
    assert.equal(call.headers.authorization, undefined);
    assert.equal(call.headers["x-openit-device"], undefined);
    assert.equal(call.headers["x-openit-user"], undefined);
  }
  await api.startSession();
  assert.equal("subject_ref" in calls.at(-1)!.body, false);
  assert.throws(() => api.startSession("공백 있음"), /subject_ref/);
});

test("환자 참조 오류와 기기 인증 403은 직원 호출 화면으로 간다", async () => {
  const { fetch, calls } = capture();
  const api = createPublicApiClient({ ...fast, fetch: qsFetch(fetch) });
  const bad = createKioskFlow(api, { startValues: async () => ({ subjectRef: null, subjectInvalid: true, questionSetId: null }) });
  await bad.start();
  assert.deepEqual([bad.current.state, bad.current.callStaffReason], ["CALL_STAFF", "BAD_SUBJECT_REF"]);
  assert.equal(calls.length, 0);
  const denied = createKioskFlow(createPublicApiClient({ ...fast, fetch: qsFetch((async () => json({ code: "PERMISSION_DENIED" }, 403)) as any) }));
  await denied.start();
  assert.deepEqual([denied.current.state, denied.current.callStaffReason], ["CALL_STAFF", "AUTH"]);
});

async function mock(options = {}) {
  const value = await startMock(options); open.push(value.close);
  const headers = { "content-type": "application/json" };
  const start = (body: object) => fetch(value.base + "/v1/sessions", { method: "POST", headers, body: JSON.stringify({ kind: "SESSION_START", ...body }) });
  return { ...value, headers, start };
}

test("모의 서버도 호출자 지정 ID·잘못된 환자 참조를 거부하고 서버 ID를 발급한다", async () => {
  const server = await mock();
  assert.equal((await server.start({ session_id: "retired" })).status, 400);
  for (const bad of ["x".repeat(129), "a b", "", 5]) assert.equal((await server.start({ subject_ref: bad })).status, 400);
  const result = await server.start({ subject_ref: REF });
  assert.equal(result.status, 200);
  assert.match(((await result.json()) as any).session_id, /^[A-Za-z0-9_-]{1,64}$/);
  const required = await mock({ requireSubjectRef: true });
  assert.equal((await required.start({})).status, 400);
  assert.equal((await required.start({ subject_ref: "p1" })).status, 200);
});

test("직원 조회에 환자 참조와 게이트웨이가 확인한 해결자 ID를 표시한다", async () => {
  const server = await mock();
  const sid = ((await (await server.start({ subject_ref: REF })).json()) as any).session_id;
  const view = async () => (await fetch(`${server.base}/v1/staff/sessions/${sid}`)).json() as Promise<any>;
  assert.equal((await view()).subject_ref, REF);
  await fetch(`${server.base}/v1/sessions/${sid}/turns`, { method: "POST", headers: server.headers, body: JSON.stringify({ session_id: sid, kind: "UTTERANCE", utterance: "위험", turn_id: "t1" }) });
  assert.equal((await view()).alerts[0].resolved_by, null);
  const intervene = (body: object) => fetch(`${server.base}/v1/sessions/${sid}/intervention`, { method: "POST", headers: { ...server.headers, "x-openit-user": "staff-7" }, body: JSON.stringify({ session_id: sid, decision: "RESUME", ...body }) });
  assert.equal((await intervene({ turn_id: "t2", staff_id: "forged" })).status, 400);
  assert.equal((await intervene({ turn_id: "t3" })).status, 200);
  assert.equal((await view()).alerts[0].resolved_by, "staff-7");
  assert.equal(JSON.stringify(server.state.log).includes(REF), false);
});


test("환자 참조와 발화는 콘솔이나 모의 접근 로그에 남기지 않는다", async () => {
  const { mock: consoleMock } = await import("node:test");
  const logs: unknown[][] = [];
  for (const name of ["log", "warn", "error", "info", "debug"] as const) consoleMock.method(console, name, (...args: unknown[]) => { logs.push(args); });
  try {
    const server = await mock();
    const api = createPublicApiClient({ baseUrl: server.base + "/v1", ...fast });
    const sid = (await api.startSession(REF)).session_id;
    await api.sendUtterance(sid, "private-test-utterance");
    const data = JSON.stringify([logs, server.state.log]);
    assert.equal(data.includes(REF), false);
    assert.equal(data.includes("private-test-utterance"), false);
  } finally { consoleMock.restoreAll(); }
});

// 소스 정독(sweep-1222)에서 찾은 결함: 조각이 환자 참조와 문진표를 모두 정하면 기기 설정을 읽지 않아 allow_remote_stt 가 조용히 무시됐다.
test("조각이 환자 참조와 문진표를 모두 정해도 기기 설정의 STT 허용은 읽고, 두 값은 조각이 이긴다", async () => {
  const seen: string[] = [];
  const value = await loadKioskStart(win("#subject_ref=url-patient&question_set_id=frag-set"), (async (url: string) => { seen.push(url); return json({ question_set_id: "cfg-set", allow_remote_stt: true }); }) as any);
  assert.deepEqual(seen, ["/config.json"]);
  assert.deepEqual(value, { subjectRef: "url-patient", subjectInvalid: false, questionSetId: "frag-set", allowRemoteStt: true });
});

// cd78429 뒤 모든 시작이 /config.json 읽기를 기다린다. 설정은 선택이라 404·오류·멈춤이어도 조각 값으로 시작해야 한다(ADR 0043).
// 실제 시간은 재지 않는다: 상한을 작게 주입하고 결과만 본다.
const FRAG = "#subject_ref=url-patient&question_set_id=frag-set";
const expected = { subjectRef: "url-patient", subjectInvalid: false, questionSetId: "frag-set" }; // allowRemoteStt 키 없음 = 설정에서 켜지 않았다
for (const [name, fetchFn] of [
  ["404", async () => json({}, 404)],
  ["네트워크 오류", async () => { throw new TypeError("fetch failed"); }],
  ["응답이 끝나지 않음", () => new Promise<Response>(() => {})],
] as const) {
  test(`조각이 완전하고 기기 설정이 ${name}이면 조각 값으로 시작하고 STT 허용은 없다`, async () => {
    const value = await loadKioskStart(win(FRAG), fetchFn as any, 20);
    assert.deepEqual(value, expected);
  });
}
