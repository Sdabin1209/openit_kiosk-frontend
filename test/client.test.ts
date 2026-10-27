import { test } from "node:test";
import assert from "node:assert/strict";
import { PublicApiClient } from "../api/client.ts";
import { ApiError, CallStaffError } from "../api/errors.ts";
import { hang, json, ok } from "./helpers.ts";

const fast = { timeoutMs: 20, retry: { maxAttempts: 3 }, sleep: async () => {} };

test("무응답이면 같은 turn_id로 재시도하고 이후 성공한다", async () => {
  const seen: string[] = [];
  let n = 0;
  const c = new PublicApiClient({ ...fast, fetch: (async (_u: any, init: RequestInit) => {
    seen.push(JSON.parse(init.body as string).turn_id);
    return ++n < 3 ? hang(init) : ok("다음 질문");
  }) as any });
  const r = await c.sendUtterance("s1", "머리가 아파요", "t-fixed");
  assert.equal(r.response_text, "다음 질문");
  assert.deepEqual(seen, ["t-fixed", "t-fixed", "t-fixed"]);
});

test("3회 실패하면 CallStaffError(직원 호출)", async () => {
  let n = 0;
  const c = new PublicApiClient({ ...fast, fetch: ((_u: any, init: RequestInit) => { n++; return hang(init); }) as any });
  await assert.rejects(c.sendUtterance("s1", "안녕", "t1"), (e) => e instanceof CallStaffError && e.attempts === 3);
  assert.equal(n, 3);
});

test("503은 재시도, 409/404/403은 재시도하지 않는다", async () => {
  let n = 0;
  const c503 = new PublicApiClient({ ...fast, fetch: (async () => (++n < 2 ? json({ code: "UNAVAILABLE" }, 503) : ok())) as any });
  await c503.sendUtterance("s1", "x", "t");
  assert.equal(n, 2);
  for (const st of [409, 404, 403, 400]) {
    let k = 0;
    const c = new PublicApiClient({ ...fast, fetch: (async () => { k++; return json({ code: "X" }, st); }) as any });
    await assert.rejects(c.sendUtterance("s1", "x", "t"), (e) => e instanceof ApiError && e.status === st);
    assert.equal(k, 1, `status ${st}`);
  }
});

test("한 세션의 요청은 하나씩 순서대로 보낸다", async () => {
  const order: string[] = [];
  let active = 0, maxActive = 0;
  const c = new PublicApiClient({ ...fast, timeoutMs: 1000, fetch: (async (_u: any, init: RequestInit) => {
    active++; maxActive = Math.max(maxActive, active);
    const b = JSON.parse(init.body as string);
    order.push(b.utterance ?? b.kind);
    await new Promise((r) => setTimeout(r, b.utterance === "첫째" ? 30 : 1));
    active--; return ok();
  }) as any });
  await Promise.all([c.startSession("s1"), c.sendUtterance("s1", "첫째", "t1"), c.sendUtterance("s1", "둘째", "t2"), c.endSession("s1")]);
  assert.deepEqual(order, ["SESSION_START", "첫째", "둘째", "SESSION_END"]);
  assert.equal(maxActive, 1);
});

test("요청에 Authorization이 없고 같은 출처 /v1로 간다", async () => {
  let h: any, url = "";
  const c = new PublicApiClient({ ...fast, fetch: (async (u: string, init: RequestInit) => { h = init.headers; url = u; return ok(); }) as any });
  await c.startSession("s1");
  assert.equal(url, "/v1/sessions");
  assert.equal(Object.keys(h).some((k) => k.toLowerCase() === "authorization"), false);
});

test("빈 발화와 잘못된 session_id는 보내지 않는다", () => {
  const c = new PublicApiClient({ fetch: (async () => { throw new Error("called"); }) as any });
  assert.throws(() => c.sendUtterance("s1", "   "));
  assert.throws(() => c.startSession("bad id!"));
  assert.throws(() => c.startSession("a".repeat(65)));
});

test("429·503은 Retry-After(초) 이상 기다리고, 없으면 지수 백오프(0.5초 기준)를 따른다", async () => {
  const waits: number[] = [];
  const mk = (headers: Record<string, string>, status: number) => {
    let n = 0;
    return new PublicApiClient({ timeoutMs: 1000, rand: () => 0, sleep: async (ms) => { waits.push(ms); }, fetch: (async () =>
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
  const c = new PublicApiClient({ ...fast, timeoutMs: 1000, fetch: (async (u: string) => { urls.push(u); return json({}); }) as any });
  await c.getSessionState("s1"); await c.getPushConfig();
  assert.deepEqual(urls, ["/v1/sessions/s1/state", "/v1/staff/push-config"]);
});
