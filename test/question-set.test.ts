// 문진표 선택(계약 3.3.0, ADR 0036): 시작 전에 활성 목록을 받고, 조각 > 기기 설정 > 목록(하나면 자동, 둘 이상이면 선택 화면) 순으로 정한다.
// 모의 서버(GET /v1/question-sets, SESSION_START question_set_id)로 실제 클라이언트·상태 기계를 돌린다.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createPublicApiClient } from "../src/wiring/public_api.ts";
import { createKioskFlow, loadKioskStart } from "../src/wiring/kiosk.ts";
import { createStartHolder, resolveStart } from "../src/components/start_values.ts";
import { startMock, fakeTimers, flowTimers, settle } from "./helpers.ts";

const open: Array<() => Promise<void>> = [];
after(async () => { for (const c of open) await c(); });
const fast = { retry: { maxAttempts: 3 }, sleep: async () => {} };
const SETS = [{ question_set_id: "general", title: "일반 문진", version: "1.0.0" }, { question_set_id: "cardio", title: "심장 문진", version: "2.0.0" }];
async function rigTimers(sets: typeof SETS) {
  const mock = await startMock({ questionSets: sets }); open.push(mock.close);
  const timers = fakeTimers();
  const api = createPublicApiClient({ ...fast, baseUrl: `${mock.base}/v1` });
  const flow = createKioskFlow(api, { idleMs: 0, timers: flowTimers(timers) });
  return { flow, mock, timers };
}
const win = (hash: string) => ({ location: { hash, pathname: "/", search: "" }, history: { replaceState: () => {} } });

async function rig(sets: typeof SETS, hash = "", config: unknown = null) {
  const mock = await startMock({ questionSets: sets }); open.push(mock.close);
  const api = createPublicApiClient({ ...fast, baseUrl: `${mock.base}/v1` });
  const holder = createStartHolder(() => loadKioskStart(win(hash), (async () => config === null ? new Response("", { status: 404 }) : new Response(JSON.stringify(config))) as any));
  const flow = createKioskFlow(api, { startValues: () => holder.take(), idleMs: 0 });
  const started = () => [...mock.state.sessions.values()].map((s) => s.questionSetId);
  return { flow, mock, started };
}

test("조각의 question_set_id가 목록에 있으면 선택 화면 없이 그 값으로 시작한다", async () => {
  const { flow, started } = await rig(SETS, "#question_set_id=cardio");
  await flow.start();
  assert.equal(flow.current.state, "LISTENING");
  assert.deepEqual(started(), ["cardio"]);
});

test("조각이 기기 설정보다 먼저다", async () => {
  const { flow, started } = await rig(SETS, "#question_set_id=cardio", { question_set_id: "general" });
  await flow.start();
  assert.deepEqual(started(), ["cardio"]);
});

test("조각이 없으면 기기 설정의 question_set_id를 쓴다", async () => {
  const { flow, started } = await rig(SETS, "", { question_set_id: "cardio" });
  await flow.start();
  assert.deepEqual(started(), ["cardio"]);
});

test("값이 없고 목록이 둘이면 선택 화면을 보이고 고른 값을 보낸다", async () => {
  const { flow, started, mock } = await rig(SETS);
  await flow.start();
  assert.equal(flow.current.state, "CHOOSING");
  assert.deepEqual(flow.current.choices, [{ id: "general", title: "일반 문진" }, { id: "cardio", title: "심장 문진" }]);
  assert.equal(mock.state.sessions.size, 0, "고르기 전에는 세션을 시작하지 않는다");
  await flow.choose("nope"); // 목록에 없는 값은 무시
  assert.equal(flow.current.state, "CHOOSING");
  await flow.choose("cardio");
  assert.equal(flow.current.state, "LISTENING");
  assert.deepEqual(started(), ["cardio"]);
});

test("선택 화면에서 처음으로 돌아가면 세션을 시작하지 않는다", async () => {
  const { flow, mock } = await rig(SETS);
  await flow.start(); flow.cancelChoose();
  assert.equal(flow.current.state, "IDLE");
  assert.equal(mock.state.sessions.size, 0);
});

test("값이 없고 목록이 하나면 자동으로 시작한다", async () => {
  const { flow, started } = await rig([SETS[0]!]);
  await flow.start();
  assert.equal(flow.current.state, "LISTENING");
  assert.deepEqual(started(), ["general"]);
});

test("B-02: 조각 값이 목록에 없으면 그 값을 보내지 않고 정한 값이 없는 경우와 같이 한다(둘 이상이면 선택 화면)", async () => {
  const { flow, started, mock } = await rig(SETS, "#question_set_id=gone");
  await flow.start();
  assert.equal(flow.current.state, "CHOOSING");
  assert.deepEqual(started(), []);
  assert.equal(mock.state.log.filter((l) => l.method === "POST" && l.path === "/v1/sessions").length, 0, "없는 값으로 시작 요청을 보내지 않았다");
  await flow.choose("general");
  assert.deepEqual(started(), ["general"]);
});

test("B-02: 조각 값이 목록에 없고 목록이 하나면 그 하나로 시작한다", async () => {
  const { flow, started } = await rig([SETS[0]!], "#question_set_id=gone");
  await flow.start();
  assert.equal(flow.current.state, "LISTENING");
  assert.deepEqual(started(), ["general"]);
});

test("I절·B-01: 활성 릴리스가 없으면(목록 503 NO_ACTIVE_RELEASE + Retry-After) 시작 불가 안내를 보이고 Retry-After 뒤 목록을 다시 받아 시작한다", async () => {
  const { flow, mock, timers } = await rigTimers([]);
  await flow.start();
  assert.equal(flow.current.state, "NOT_OPEN");
  assert.equal(mock.state.sessions.size, 0);
  const lists = () => mock.state.log.filter((l) => l.path === "/v1/question-sets").length;
  assert.equal(lists(), 1, "재시도 루프에 넣지 않고 한 번만 받았다");
  mock.state.sc.questionSets = [SETS[0]!]; // 릴리스가 활성이 됨
  timers.advance(999); await settle(); assert.equal(lists(), 1, "Retry-After(1초) 전에는 다시 받지 않는다");
  timers.advance(1); await settle();
  assert.equal(flow.current.state, "LISTENING");
  assert.equal(lists(), 2);
});

test("I절·B-01: 시작 불가 안내에서 처음으로 돌아가면 더 받지 않는다", async () => {
  const { flow, mock, timers } = await rigTimers([]);
  await flow.start(); flow.cancelChoose();
  assert.equal(flow.current.state, "IDLE");
  timers.advance(60_000); await settle();
  assert.equal(mock.state.log.filter((l) => l.path === "/v1/question-sets").length, 1);
});

test("B-02: 목록을 받은 뒤 활성 세트가 바뀌어 400 UNKNOWN_QUESTION_SET을 받으면 목록을 다시 받아 한 번만 같은 처리를 하고 같은 값으로 다시 보내지 않는다", async () => {
  const mock = await startMock({ questionSets: SETS }); open.push(mock.close);
  let lists = 0;
  const f = (async (u: string, init: RequestInit) => {
    if (String(u).endsWith("/question-sets") && ++lists === 1) return new Response(JSON.stringify({ items: [{ question_set_id: "ghost", title: "유령", version: "1" }] })); // 낡은 목록
    return fetch(u, init);
  }) as any;
  const flow = createKioskFlow(createPublicApiClient({ ...fast, baseUrl: `${mock.base}/v1`, fetch: f }), { idleMs: 0 });
  await flow.start();
  assert.equal(flow.current.state, "CHOOSING");
  assert.deepEqual(flow.current.choices?.map((c) => c.id), ["general", "cardio"]);
  assert.equal(lists, 2);
  assert.equal(mock.state.log.filter((l) => l.method === "POST" && l.path === "/v1/sessions").length, 1, "ghost로 한 번만 보냈다");
});

test("B-02: 다시 받은 뒤에도 UNKNOWN_QUESTION_SET이면 되풀이하지 않고 직원 호출 화면", async () => {
  const mock = await startMock({ questionSets: SETS }); open.push(mock.close);
  const f = (async (u: string, init: RequestInit) =>
    String(u).endsWith("/question-sets") ? new Response(JSON.stringify({ items: [{ question_set_id: "ghost", title: "유령", version: "1" }, { question_set_id: "ghost2", title: "유령2", version: "1" }] })) : fetch(u, init)) as any;
  const flow = createKioskFlow(createPublicApiClient({ ...fast, baseUrl: `${mock.base}/v1`, fetch: f }), { idleMs: 0 });
  await flow.start(); assert.equal(flow.current.state, "CHOOSING");
  await flow.choose("ghost"); // 400 UNKNOWN -> 목록 다시(같은 낡은 목록) -> 선택 화면
  assert.equal(flow.current.state, "CHOOSING");
  await flow.choose("ghost"); // 두 번째 400은 되풀이하지 않는다
  assert.deepEqual([flow.current.state, flow.current.callStaffReason], ["CALL_STAFF", "START_FAILED"]);
});

test("400 QUESTION_SET_REQUIRED는 재시도 없이 직원 호출 화면", async () => {
  const mock = await startMock({ questionSets: SETS }); open.push(mock.close);
  const f = (async (u: string, init: RequestInit) =>
    String(u).endsWith("/question-sets") ? new Response(JSON.stringify({ items: [SETS[0]] })) : fetch(u, init)) as any; // 낡은 목록(하나) -> 생략 시작
  const api = createPublicApiClient({ ...fast, baseUrl: `${mock.base}/v1`, fetch: ((u: string, init: RequestInit) => String(u).endsWith("/sessions") ? fetch(u, { ...init, body: JSON.stringify({ kind: "SESSION_START" }) }) : f(u, init)) as any });
  const flow = createKioskFlow(api, { idleMs: 0 });
  await flow.start();
  assert.deepEqual([flow.current.state, flow.current.callStaffReason], ["CALL_STAFF", "START_FAILED"]);
  assert.equal(mock.state.log.filter((l) => l.method === "POST" && l.path === "/v1/sessions").length, 1);
});

test("요청: 목록 읽기와 시작 본문에 question_set_id가 실리고, 기기 토큰은 목록 요청에도 간다", async () => {
  const seen: { url: string; auth: unknown; body: unknown }[] = [];
  const mock = await startMock({ questionSets: [SETS[0]!] }); open.push(mock.close);
  const f = (async (u: string, init: RequestInit) => { seen.push({ url: u.replace(mock.base, ""), auth: (init.headers as any).authorization, body: init.body ? JSON.parse(init.body as string) : null }); return fetch(u, init); }) as any;
  const api = createPublicApiClient({ ...fast, baseUrl: `${mock.base}/v1`, fetch: f, deviceToken: () => "tok-FAKE" });
  await api.listQuestionSets();
  await api.startSession(null, "general");
  assert.equal(seen[0]!.url, "/v1/question-sets"); assert.equal(seen[0]!.auth, "Bearer tok-FAKE");
  assert.deepEqual(seen[1]!.body, { kind: "SESSION_START", question_set_id: "general" });
  assert.throws(() => api.startSession(null, "공백 있음"), /question_set_id/);
});

test("시작 값: 형식이 틀린 조각 문진표 ID는 버리고(직원 호출 없음) 기기 설정으로 간다", () => {
  const s = resolveStart({ hash: "#question_set_id=bad%20id", config: { question_set_id: "ok-1" } });
  assert.equal(s.questionSetId, "ok-1");
  assert.equal(s.subjectInvalid, false);
});
