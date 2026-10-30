// 단계 B(계약 2.2.0, D106): 세션 ID는 서버가 발급한다. 기대값의 출처: ../boundary-contracts/PUBLIC_API.md 원칙 절
// "POST /v1/sessions 본문에서 session_id를 생략하면 서버가 ... 응답의 session_id로 돌려준다. 프론트가 session_id를 보내는 방식은
// 폐기 예정(3.0.0에서 제거)". 이 시험이 쓴 구현이 아니라 그 문장이 기준이다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createPublicApiClient } from "../src/wiring/public_api.ts";
import type { PublicApiClient } from "../src/components/link_public_api_send.ts";
import { createKioskFlow } from "../src/wiring/kiosk.ts";
import type { KioskFlow } from "../src/components/kiosk_flow.ts";
import { json, ok, settle, startMock, started, SERVER_SESSION_ID } from "./helpers.ts";

const say = (t: string) => ({ text: t, confidence: 0.9 });
function rig(o: { startResp?: () => Response } = {}) {
  const calls: Array<{ method: string; url: string; body: any }> = [];
  const api = createPublicApiClient({ now: () => 0, sleep: async () => {}, retry: { maxAttempts: 1 }, fetch: (async (url: string, init: RequestInit) => {
    const body = init.body ? JSON.parse(init.body as string) : undefined;
    calls.push({ method: init.method ?? "GET", url, body });
    if (body?.kind === "SESSION_START") return (o.startResp ?? (() => started()))();
    if (body?.kind === "SESSION_END") return ok(null);
    if (init.method === "GET") return json({ session_id: SERVER_SESSION_ID, state: "ACTIVE", resume_text: null });
    return ok("다음 질문");
  }) as any });
  return { api, calls };
}

test("세션 시작 요청 본문에 session_id가 없다", async () => {
  const { api, calls } = rig();
  const r = await api.startSession(null);
  assert.equal("session_id" in calls[0].body, false, "본문에 session_id가 있으면 안 된다");
  assert.equal(calls[0].body.kind, "SESSION_START");
  assert.equal(r.session_id, SERVER_SESSION_ID, "응답의 session_id를 돌려준다");
});

test("이후 요청(발화, 종료)이 응답의 session_id를 경로와 본문에 쓴다", async () => {
  const { api, calls } = rig();
  const flow = createKioskFlow(api, { idleMs: 0 });
  await flow.start();
  assert.equal(flow.session, SERVER_SESSION_ID);
  await flow.hear(say("배가 아파요"));
  await flow.end();
  const turn = calls.find((c) => c.body?.kind === "UTTERANCE")!, end = calls.find((c) => c.body?.kind === "SESSION_END")!;
  assert.ok(turn.url.endsWith(`/sessions/${SERVER_SESSION_ID}/turns`), turn.url);
  assert.equal(turn.body.session_id, SERVER_SESSION_ID);
  assert.ok(end.url.endsWith(`/sessions/${SERVER_SESSION_ID}/end`), end.url);
  assert.equal(end.body.session_id, SERVER_SESSION_ID);
});

test("응답에 session_id가 없거나 형식이 틀리면 시작 성공으로 보지 않는다(직원 호출)", async () => {
  for (const bad of [json({ response_text: "첫 질문", turn_failure_signal: null }), started("첫 질문", null, "bad id!"), started("첫 질문", null, "a".repeat(65))]) {
    const { api } = rig({ startResp: () => bad.clone() });
    const flow = createKioskFlow(api, { idleMs: 0 });
    await flow.start();
    assert.equal(flow.current.state, "CALL_STAFF");
    assert.equal(flow.session, null, "검증되지 않은 ID를 세션으로 두지 않는다");
  }
});

test("시작 재시도 중 '그만하기': 서버가 발급한 ID를 아직 모르므로 종료 요청 없이 끝난다", async () => {
  const calls: string[] = [];
  const api = createPublicApiClient({ now: () => 0, sleep: () => new Promise(() => {}), fetch: (async (_u: string, init: RequestInit) => {
    const b = JSON.parse(init.body as string); calls.push(b.kind);
    return json({ code: "UNAVAILABLE" }, 503);
  }) as any });
  const flow = createKioskFlow(api, { idleMs: 0, sleep: () => new Promise(() => {}) });
  void flow.start(); await settle();
  assert.equal(flow.current.state, "STARTING");
  await flow.end(); await settle();
  assert.equal(flow.current.state, "ENDED", "그만하기가 먹는다");
  assert.deepEqual(calls.filter((k) => k === "SESSION_END"), [], "ID가 없으니 종료 요청을 보내지 않는다");
});

test("소스에 세션 ID를 만드는 코드가 없다(newSessionId 제거)", () => {
  const ids = readFileSync(new URL("../src/wiring/ids.ts", import.meta.url), "utf8");
  const flow = readFileSync(new URL("../src/components/kiosk_flow.ts", import.meta.url), "utf8");
  assert.doesNotMatch(ids, /newSessionId/);
  assert.doesNotMatch(flow, /newSessionId/);
});

test("모의 서버: session_id를 생략하면 계약 형식의 ID를 발급해 응답에 싣고, 시작마다 다르다", async () => {
  const m = await startMock();
  try {
    const post = async (b: object) => { const r = await fetch(m.base + "/v1/sessions", { method: "POST", body: JSON.stringify(b) }); return { status: r.status, body: await r.json() as any }; };
    const a = await post({ kind: "SESSION_START" }), b = await post({ kind: "SESSION_START" });
    assert.equal(a.status, 200);
    for (const x of [a, b]) assert.match(x.body.session_id, /^[A-Za-z0-9_-]{1,64}$/);
    assert.notEqual(a.body.session_id, b.body.session_id);
    assert.equal(typeof a.body.response_text, "string");
    // 발급된 ID로 이어 갈 수 있다
    const t = await fetch(`${m.base}/v1/sessions/${a.body.session_id}/turns`, { method: "POST", body: JSON.stringify({ session_id: a.body.session_id, kind: "UTTERANCE", utterance: "안녕", turn_id: "t1" }) });
    assert.equal(t.status, 200);
    // 폐기 예정 방식(2.x에서만 허용): 클라이언트가 보낸 ID는 그대로 쓰고 응답에도 돌려준다
    const legacy = await post({ kind: "SESSION_START", session_id: "legacy-1" });
    assert.equal(legacy.status, 200); assert.equal(legacy.body.session_id, "legacy-1");
  } finally { await m.close(); }
});
