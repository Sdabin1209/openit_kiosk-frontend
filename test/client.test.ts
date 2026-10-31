import { test } from "node:test";
import assert from "node:assert/strict";
import { REQUEST_TIMEOUT_MS } from "../src/config.ts";
import { createPublicApiClient } from "../src/wiring/public_api.ts";
import { ApiError, CallStaffError } from "../src/components/link_public_api_send.ts";
import { json, ok, started, timesOut, settle, fakeTimers } from "./helpers.ts";

const fast = { retry: { maxAttempts: 3 }, sleep: async () => {} };

test("무응답이면 같은 turn_id로 재시도하고 이후 성공한다", async () => {
  const seen: string[] = [];
  let n = 0;
  const c = createPublicApiClient({ ...fast, fetch: (async (_u: any, init: RequestInit) => {
    seen.push(JSON.parse(init.body as string).turn_id);
    return ++n < 3 ? timesOut() : ok("다음 질문"); // 가짜 의존이 즉시 시간 초과(AbortError)를 낸다
  }) as any });
  const r = await c.sendUtterance("s1", "머리가 아파요", "t-fixed");
  assert.equal(r.response_text, "다음 질문");
  assert.deepEqual(seen, ["t-fixed", "t-fixed", "t-fixed"]);
});

test("3회 실패하면 CallStaffError(직원 호출)", async () => {
  let n = 0;
  const c = createPublicApiClient({ ...fast, fetch: ((_u: any, init: RequestInit) => { n++; return timesOut(); }) as any });
  await assert.rejects(c.sendUtterance("s1", "안녕", "t1"), (e) => e instanceof CallStaffError && e.attempts === 3);
  assert.equal(n, 3);
});

test("503은 재시도, 409/404/403은 재시도하지 않는다", async () => {
  let n = 0;
  const c503 = createPublicApiClient({ ...fast, fetch: (async () => (++n < 2 ? json({ code: "UNAVAILABLE" }, 503) : ok())) as any });
  await c503.sendUtterance("s1", "x", "t");
  assert.equal(n, 2);
  for (const st of [409, 404, 403, 400]) {
    let k = 0;
    const c = createPublicApiClient({ ...fast, fetch: (async () => { k++; return json({ code: "X" }, st); }) as any });
    await assert.rejects(c.sendUtterance("s1", "x", "t"), (e) => e instanceof ApiError && e.status === st);
    assert.equal(k, 1, `status ${st}`);
  }
});

test("한 세션의 요청은 하나씩 순서대로 보낸다", async () => {
  const order: string[] = [];
  let active = 0, maxActive = 0;
  let release!: () => void;
  const gate = new Promise<void>((r) => { release = r; }); // 첫째 요청을 붙잡는다(시간이 아니라 사건으로 순서를 본다)
  const c = createPublicApiClient({ ...fast, fetch: (async (_u: any, init: RequestInit) => {
    active++; maxActive = Math.max(maxActive, active);
    const b = JSON.parse(init.body as string);
    order.push(b.utterance ?? b.kind);
    if (b.utterance === "첫째") await gate;
    active--; return b.kind === "SESSION_START" ? started() : ok();
  }) as any });
  const sid = (await c.startSession()).session_id; // 서버가 발급한 ID(2.2.0). 시작은 ID를 얻기 전이라 큐 밖이고, 이후 요청부터 세션별로 직렬화된다
  const all = Promise.all([c.sendUtterance(sid, "첫째", "t1"), c.sendUtterance(sid, "둘째", "t2"), c.endSession(sid)]);
  await settle();
  // 첫째가 끝나지 않은 동안 뒤의 요청은 나가지 않는다(이벤트 루프를 충분히 돌린 뒤 확인: 붙잡힌 동안 '없음'만 볼 수 있어 거짓 통과는 가능해도 거짓 실패는 없다).
  assert.deepEqual(order, ["SESSION_START", "첫째"]);
  release();
  await all;
  assert.deepEqual(order, ["SESSION_START", "첫째", "둘째", "SESSION_END"]);
  assert.equal(maxActive, 1);
});

test("요청에 Authorization이 없고 같은 출처 /v1로 간다", async () => {
  let h: any, url = "";
  const c = createPublicApiClient({ ...fast, fetch: (async (u: string, init: RequestInit) => { h = init.headers; url = u; return started(); }) as any });
  await c.startSession();
  assert.equal(url, "/v1/sessions");
  assert.equal(Object.keys(h).some((k) => k.toLowerCase() === "authorization"), false);
});

test("빈 발화와 잘못된 session_id는 보내지 않는다", () => {
  const c = createPublicApiClient({ fetch: (async () => { throw new Error("called"); }) as any });
  assert.throws(() => c.sendUtterance("s1", "   "));
  assert.throws(() => c.endSession("bad id!"));
  assert.throws(() => c.endSession("a".repeat(65)));
});

test("429·503은 Retry-After(초) 이상 기다리고, 없으면 지수 백오프(0.5초 기준)를 따른다", async () => {
  const waits: number[] = [];
  const mk = (headers: Record<string, string>, status: number) => {
    let n = 0;
    return createPublicApiClient({ rand: () => 0, sleep: async (ms) => { waits.push(ms); }, fetch: (async () =>
      ++n < 3 ? new Response(JSON.stringify({ code: "UNAVAILABLE" }), { status, headers }) : ok()) as any });
  };
  await mk({ "retry-after": "3" }, 429).sendUtterance("s1", "x", "t");
  assert.deepEqual(waits.splice(0), [3000, 3000]);
  await mk({}, 429).sendUtterance("s1", "x", "t");
  assert.deepEqual(waits.splice(0), [250, 500]);
  await mk({}, 503).sendUtterance("s1", "x", "t");
  assert.deepEqual(waits.splice(0), [250, 500]);
});

test("상태 조회와 푸시 설정 호출 경로", async () => {
  const urls: string[] = [];
  const c = createPublicApiClient({ ...fast, fetch: (async (u: string) => { urls.push(u); return json({ session_id: "s1", state: "ACTIVE", resume_text: null }); }) as any });
  await c.getSessionState("s1"); await c.getPushConfig();
  assert.deepEqual(urls, ["/v1/sessions/s1/state", "/v1/staff/push-config"]);
});

// 시한 값이 맞는지는 가짜 타이머(시계 주입)로 직접 확인한다: 실제 시간을 기다리지 않는다(U422). 타이머가 발동하는 때에만 요청 신호가 끊긴다.
test("응답 대기 타이머는 wiring이 넘기는 REQUEST_TIMEOUT_MS(config.ts)에 발동하고 그 전에는 끊지 않는다(가짜 타이머)", async () => {
  const timers = fakeTimers();
  let signal: AbortSignal | undefined;
  const c = createPublicApiClient({ timers, retry: { maxAttempts: 1 }, sleep: async () => {}, fetch: ((_u: string, init: RequestInit) => new Promise((_, rej) => {
    signal = init.signal ?? undefined;
    init.signal?.addEventListener("abort", () => rej(new DOMException("x", "AbortError")));
  })) as any });
  const p = c.request("GET", "/x", undefined, false).catch((e) => e);
  await settle();
  assert.ok(signal, "요청이 나갔다");
  timers.advance(REQUEST_TIMEOUT_MS - 1);
  assert.equal(signal!.aborted, false);
  timers.advance(1);
  assert.equal(signal!.aborted, true);
  assert.ok((await p) instanceof CallStaffError);
  assert.equal(timers.pending(), 0, "끝난 요청의 타이머는 지워진다");
});

// R7(U424): 실제로 보낸 요청 본문(fetch가 받은 것)을 문진 스키마 FrontendMessage·InterventionDecision 전체로 검증한다. turn_id는 API 봉투 필드라 떼어 낸 나머지를 본다(PUBLIC_API.md 30행).
test("시작·발화·종료·개입 요청 본문은 문진 스키마(FrontendMessage, InterventionDecision) 전체를 통과한다(보낸 본문을 잡아 검증)", async () => {
  const { FrontendMessage: vMsg, InterventionDecision: vDec } = await import("../src/types/validators.gen.cjs");
  const sent: Array<{ path: string; body: Record<string, unknown> }> = [];
  const c = createPublicApiClient({ retry: { maxAttempts: 1 }, sleep: async () => {}, fetch: (async (u: string, init: RequestInit) => {
    const body = JSON.parse(init.body as string); sent.push({ path: new URL(u, "http://x").pathname, body });
    return body.kind === "SESSION_START" ? started() : ok();
  }) as any });
  const sid = (await c.startSession("P-1")).session_id;
  await c.startSession();
  await c.sendUtterance(sid, "머리가 아파요", "t-1");
  await c.endSession(sid);
  await c.intervene(sid, "RESUME", "t-2");
  assert.equal(sent.length, 5);
  const strip = ({ turn_id: _t, ...rest }: Record<string, unknown>) => rest;
  for (const s of sent) {
    const v = s.path.endsWith("/intervention") ? vDec : vMsg;
    assert.equal(v(strip(s.body)), true, `${s.path}: ${JSON.stringify(v.errors)}`);
  }
  assert.ok(sent.some((s) => s.path.endsWith("/turns") && s.body.turn_id === "t-1"), "turn_id는 봉투 필드로 그대로 나간다");
});
