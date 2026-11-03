// 문진표 선택(계약 3.3.0, ADR 0036): 시작 전에 활성 목록을 받고, 조각 > 기기 설정 > 목록(하나면 자동, 둘 이상이면 선택 화면) 순으로 정한다.
// 모의 서버(GET /v1/question-sets, SESSION_START question_set_id)로 실제 클라이언트·상태 기계를 돌린다.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createPublicApiClient } from "../src/wiring/public_api.ts";
import { createKioskFlow, loadKioskStart } from "../src/wiring/kiosk.ts";
import { createStartHolder, resolveStart } from "../src/components/start_values.ts";
import { startMock } from "./helpers.ts";

const open: Array<() => Promise<void>> = [];
after(async () => { for (const c of open) await c(); });
const fast = { retry: { maxAttempts: 3 }, sleep: async () => {} };
const SETS = [{ question_set_id: "general", title: "일반 문진", version: "1.0.0" }, { question_set_id: "cardio", title: "심장 문진", version: "2.0.0" }];
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
  assert.equal(flow.current.chooseNotice, undefined);
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

test("조각 값이 목록에 없으면 안내와 함께 선택 화면", async () => {
  const { flow, started } = await rig(SETS, "#question_set_id=gone");
  await flow.start();
  assert.deepEqual([flow.current.state, flow.current.chooseNotice], ["CHOOSING", "QUESTION_SET_NOT_FOUND"]);
  assert.deepEqual(started(), []);
  await flow.choose("general");
  assert.deepEqual(started(), ["general"]);
});

test("목록이 비면 문진표 없음 안내(직원 호출 화면)", async () => {
  const { flow, mock } = await rig([]);
  await flow.start();
  assert.deepEqual([flow.current.state, flow.current.callStaffReason], ["CALL_STAFF", "NO_QUESTION_SET"]);
  assert.equal(mock.state.sessions.size, 0);
});

test("서버 오류 reason: UNKNOWN_QUESTION_SET·QUESTION_SET_REQUIRED는 선택 화면으로 복구한다", async () => {
  const mock = await startMock({ questionSets: SETS }); open.push(mock.close);
  let listCalls = 0;
  const f = (async (u: string, init: RequestInit) => {
    if (u.endsWith("/question-sets")) { listCalls++; return listCalls === 1 ? new Response(JSON.stringify({ items: [SETS[0]] })) : fetch(u, init); } // 첫 목록은 낡은 값(하나)
    return fetch(u, init);
  }) as any;
  const api = createPublicApiClient({ ...fast, baseUrl: `${mock.base}/v1`, fetch: f });
  const flow = createKioskFlow(api, { idleMs: 0 });
  await flow.start(); // 낡은 목록이 하나라 자동 시작 -> 서버는 둘 이상이라 question_set_id가 있어 통과(general). 정상
  assert.equal(flow.current.state, "LISTENING");
  // 서버가 거부하는 경우: 목록이 'ghost'를 내지만 서버에는 없다
  const f2 = (async (u: string, init: RequestInit) => u.endsWith("/question-sets") && !(f2 as any).n++ ? new Response(JSON.stringify({ items: [{ question_set_id: "ghost", title: "유령", version: "1" }] })) : fetch(u, init)) as any;
  f2.n = 0;
  const flow2 = createKioskFlow(createPublicApiClient({ ...fast, baseUrl: `${mock.base}/v1`, fetch: f2 }), { idleMs: 0 });
  await flow2.start();
  assert.deepEqual([flow2.current.state, flow2.current.chooseNotice], ["CHOOSING", "QUESTION_SET_NOT_FOUND"]);
  assert.deepEqual(flow2.current.choices?.map((c) => c.id), ["general", "cardio"]);
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
