// FAULT_POLICY 원칙 2·3·7: 일시 장애 재시도(같은 turn_id, 지수 백오프+지터, 총 예산)와 직원 호출 전환.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createPublicApiClient } from "../src/wiring/public_api.ts";
import type { PublicApiClient } from "../src/components/link_public_api_send.ts";
import { ApiError, CallStaffError, AbortedError } from "../src/components/link_public_api_send.ts";
import { createRetryPolicy } from "../src/components/retry_policy.ts";
import { DEFAULT_RETRY } from "../src/config.ts";
const backoffMs = (n: number, _p: unknown = DEFAULT_RETRY, rand: () => number = Math.random) => createRetryPolicy(DEFAULT_RETRY, rand).backoffMs(n);
const waitMs = (n: number, retryAfterMs: number | null) => createRetryPolicy(DEFAULT_RETRY).decide({ attempt: n, retryAfterMs, elapsedMs: 0 }).waitMs;
import { createKioskFlow } from "../src/wiring/kiosk.ts";
import type { KioskFlow } from "../src/components/kiosk_flow.ts";
import { json, ok, settle, waitFor, started } from "./helpers.ts";

/** 가상 시계: sleep이 시계를 앞으로 보낸다. 예산 계산을 실제 대기 없이 시험한다. */
function clock() {
  let t = 0; const waits: number[] = [];
  return { now: () => t, sleep: async (ms: number) => { waits.push(ms); t += ms; }, waits, advance: (ms: number) => { t += ms; } };
}
const err = (status: number, headers: Record<string, string> = {}, code = "UNAVAILABLE", details?: unknown) =>
  new Response(JSON.stringify({ code, message: "x", retryable: true, details }), { status, headers });
const inProgress = (headers: Record<string, string> = {}) => err(409, headers, "CONFLICT", { reason: "TURN_IN_PROGRESS" });
function make(responses: Array<() => Response | Promise<Response>>, extra: Record<string, unknown> = {}) {
  const c = clock(); const turnIds: string[] = []; let n = 0;
  const api = createPublicApiClient({ timeoutMs: 1000, now: c.now, sleep: c.sleep, rand: () => 0.5, ...extra, fetch: (async (_u: string, init: RequestInit) => {
    turnIds.push(JSON.parse(init.body as string).turn_id);
    const r = responses[Math.min(n++, responses.length - 1)]!;
    return r();
  }) as any });
  return { api, c, turnIds, count: () => n };
}

test("503 두 번 뒤 성공: 같은 turn_id로 재시도하고 응답을 돌려준다", async () => {
  const { api, turnIds, count } = make([() => err(503), () => err(503), () => ok("다음 질문")]);
  const r = await api.sendUtterance("s1", "머리가 아파요", "t-same");
  assert.equal(r.response_text, "다음 질문");
  assert.equal(count(), 3);
  assert.deepEqual(turnIds, ["t-same", "t-same", "t-same"]);
});

test("502·504·429·네트워크 오류도 재시도한다", async () => {
  for (const first of [() => err(502), () => err(504), () => err(429), () => { throw new TypeError("fetch failed"); }]) {
    const { api, count } = make([first as any, () => ok()]);
    await api.sendUtterance("s1", "x", "t");
    assert.equal(count(), 2);
  }
});

test("504가 계속되면 예산(24초)을 넘기기 전에 CallStaffError로 끝난다", async () => {
  const { api, c, count } = make([() => err(504)]);
  await assert.rejects(api.sendUtterance("s1", "x", "t"), (e) => e instanceof CallStaffError && e.lastCause instanceof ApiError && e.lastCause.status === 504);
  const total = c.waits.reduce((a, b) => a + b, 0);
  assert.ok(total < DEFAULT_RETRY.budgetMs, `대기 합 ${total}`);
  assert.ok(count() > 3, "예산 안에서 3회보다 많이 시도한다");
  assert.ok(c.waits.every((w) => w <= DEFAULT_RETRY.maxMs));
});

test("4xx(429 제외)와 500은 재시도하지 않고 바로 실패한다", async () => {
  for (const st of [400, 401, 403, 404, 409, 422, 500]) {
    const { api, count } = make([() => err(st, {}, "X")]);
    await assert.rejects(api.sendUtterance("s1", "x", "t"), (e) => e instanceof ApiError && e.status === st, `status ${st}`);
    assert.equal(count(), 1, `status ${st}`);
  }
});

test("409 TURN_IN_PROGRESS는 Retry-After 뒤 같은 turn_id로 재시도한다", async () => {
  const { api, c, turnIds } = make([() => inProgress({ "retry-after": "2" }), () => ok("확정된 응답")], { rand: () => 0 });
  const r = await api.sendUtterance("s1", "x", "t-9");
  assert.equal(r.response_text, "확정된 응답");
  assert.deepEqual(c.waits, [2000]);
  assert.deepEqual(turnIds, ["t-9", "t-9"]);
});

test("409 CONFLICT에 reason이 없거나 다르면, 또는 code만 TURN_IN_PROGRESS이면 재시도하지 않는다", async () => {
  for (const r of [() => err(409, {}, "CONFLICT"), () => err(409, {}, "CONFLICT", { reason: "OUT_OF_ORDER" }), () => err(409, {}, "TURN_IN_PROGRESS"), () => err(409, { "retry-after": "1" }, "CONFLICT", {})]) {
    const { api, count } = make([r]);
    await assert.rejects(api.sendUtterance("s1", "x", "t"), (e) => e instanceof ApiError && e.status === 409);
    assert.equal(count(), 1);
  }
});

test("409 TURN_IN_PROGRESS에 Retry-After가 없어도 백오프로 재시도한다", async () => {
  const { api, c } = make([() => inProgress(), () => ok()]);
  await api.sendUtterance("s1", "x", "t");
  assert.equal(c.waits.length, 1);
  assert.ok(c.waits[0]! >= 250 && c.waits[0]! <= 500);
});

test("Retry-After가 남은 예산보다 길면 기다리지 않고 직원 호출로 넘긴다", async () => {
  const { api, c, count } = make([() => err(503, { "retry-after": "60" })]);
  await assert.rejects(api.sendUtterance("s1", "x", "t"), CallStaffError);
  assert.equal(count(), 1);
  assert.deepEqual(c.waits, []);
});

test("백오프: 기준 0.5초·배율 2·상한 5초, 지터는 [50%,100%] 범위", () => {
  const ceil = [500, 1000, 2000, 4000, 5000, 5000];
  ceil.forEach((c, i) => {
    assert.equal(backoffMs(i + 1, DEFAULT_RETRY, () => 0), c / 2);
    assert.equal(backoffMs(i + 1, DEFAULT_RETRY, () => 0.999999), c);
    for (let k = 0; k < 200; k++) {
      const w = backoffMs(i + 1);
      assert.ok(w >= c / 2 && w <= c, `attempt ${i + 1}: ${w}`);
    }
  });
  const seen = new Set(Array.from({ length: 50 }, () => backoffMs(3)));
  assert.ok(seen.size > 10, "지터로 값이 흩어진다");
  // Retry-After는 하한이고 지터는 위로만 더한다
  for (let k = 0; k < 200; k++) {
    const w = waitMs(2, 3000);
    assert.ok(w >= 3000 && w <= 3000 + 1000 * 0.5 + 1, `${w}`);
  }
});

test("지터를 주입하지 않으면 키오스크마다 대기가 달라진다", async () => {
  const run = async () => { const { api, c } = make([() => err(503), () => ok()], { rand: undefined }); await api.sendUtterance("s1", "x", "t"); return c.waits[0]; };
  const vals = new Set<number | undefined>();
  for (let i = 0; i < 30; i++) vals.add(await run());
  assert.ok(vals.size > 3);
});

test("무응답(타임아웃)도 예산에 들어가고 소진하면 직원 호출", async () => {
  const c = clock();
  const api = createPublicApiClient({ timeoutMs: 5, now: c.now, sleep: c.sleep, rand: () => 1 - Number.EPSILON, fetch: ((_u: string, init: RequestInit) => new Promise((_, rej) => {
    init.signal?.addEventListener("abort", () => rej(new DOMException("x", "AbortError")));
  })) as any });
  await assert.rejects(api.sendUtterance("s1", "x", "t"), CallStaffError);
  assert.ok(c.waits.length >= 4);
});

test("취소 신호를 받으면 대기 중에도 바로 끝나고 더 보내지 않는다", async () => {
  const ctl = new AbortController(); let n = 0;
  const api = createPublicApiClient({ sleep: () => new Promise<void>(() => {}), fetch: (async () => { n++; return err(503); }) as any });
  const p = api.sendUtterance("s1", "x", "t", { signal: ctl.signal, onRetry: () => queueMicrotask(() => ctl.abort()) });
  await assert.rejects(p, AbortedError);
  assert.equal(n, 1);
});

// ---- 키오스크 흐름 ----
const say = (t: string) => ({ text: t, confidence: 0.9 });

test("흐름: 503 재시도 중에는 SENDING 상태에 retrying 표시, 성공하면 LISTENING", async () => {
  let n = 0; const seen: any[] = [];
  const c = clock();
  const api = createPublicApiClient({ now: c.now, sleep: c.sleep, fetch: (async (_u: string, init: RequestInit) => {
    const b = JSON.parse(init.body as string);
    if (b.kind === "SESSION_START") return started("질문");
    return ++n < 3 ? err(503) : ok("다음");
  }) as any });
  const flow = createKioskFlow(api);
  flow.subscribe((v) => seen.push({ ...v }));
  await flow.start(); await flow.hear(say("네"));
  assert.equal(flow.current.state, "LISTENING");
  assert.equal(flow.current.retrying, undefined);
  assert.ok(seen.some((v) => v.state === "SENDING" && v.retrying));
});

test("흐름: 504 계속 -> 예산 소진 뒤 직원 호출(RETRY_EXHAUSTED)", async () => {
  const c = clock();
  const api = createPublicApiClient({ now: c.now, sleep: c.sleep, fetch: (async (_u: string, init: RequestInit) =>
    JSON.parse(init.body as string).kind === "SESSION_START" ? started("질문") : err(504)) as any });
  const flow = createKioskFlow(api);
  await flow.start(); await flow.hear(say("네"));
  assert.equal(flow.current.state, "CALL_STAFF");
  assert.equal(flow.current.callStaffReason, "RETRY_EXHAUSTED");
});

test("흐름: 재시도 중 환자가 직원 호출을 누르면 즉시 직원 호출 화면, 더 보내지 않는다", async () => {
  let n = 0;
  const api = createPublicApiClient({ sleep: () => new Promise<void>(() => {}), fetch: (async (_u: string, init: RequestInit) => {
    if (JSON.parse(init.body as string).kind === "SESSION_START") return started("질문");
    n++; return err(503);
  }) as any });
  const flow = createKioskFlow(api);
  await flow.start();
  const p = flow.hear(say("네"));
  await waitFor(() => flow.current.retrying === true, "재시도 중 표시");
  flow.callStaff();
  assert.equal(flow.current.state, "CALL_STAFF");
  assert.equal(flow.current.callStaffReason, "STAFF_REQUESTED");
  await p;
  assert.equal(flow.current.state, "CALL_STAFF");
  await settle();
  assert.equal(n, 1);
});

test("흐름: 재시도 중 그만하기(end)는 재시도를 끊고 종료한다", async () => {
  const kinds: string[] = [];
  const api = createPublicApiClient({ sleep: () => new Promise<void>(() => {}), fetch: (async (_u: string, init: RequestInit) => {
    const k = JSON.parse(init.body as string).kind; kinds.push(k);
    if (k === "UTTERANCE") return err(503);
    return k === "SESSION_START" ? started() : ok(k === "SESSION_END" ? null : "질문");
  }) as any });
  const flow = createKioskFlow(api);
  await flow.start();
  const p = flow.hear(say("네"));
  await waitFor(() => flow.current.retrying === true, "재시도 중 표시");
  await flow.end(); await p;
  assert.equal(flow.current.state, "ENDED");
  assert.deepEqual(kinds, ["SESSION_START", "UTTERANCE", "SESSION_END"]);
});

test("흐름: 재시도 소진까지 모든 시도가 같은 turn_id를 쓴다", async () => {
  const c = clock(); const ids: string[] = [];
  const api = createPublicApiClient({ now: c.now, sleep: c.sleep, fetch: (async (_u: string, init: RequestInit) => {
    const b = JSON.parse(init.body as string);
    if (b.kind === "SESSION_START") return started("질문");
    ids.push(b.turn_id); return err(503);
  }) as any });
  const flow = createKioskFlow(api);
  await flow.start(); await flow.hear(say("네"));
  assert.equal(flow.current.state, "CALL_STAFF");
  assert.ok(new Set(ids).size === 1, "소진까지 모든 재시도가 같은 turn_id");
});

test("흐름: reason 없는 409는 WAITING_STAFF(기존), TURN_IN_PROGRESS는 대기 뒤 성공", async () => {
  const c = clock(); let mode: "plain" | "busy" = "plain"; let n = 0;
  const api = createPublicApiClient({ now: c.now, sleep: c.sleep, fetch: (async (u: string, init: RequestInit) => {
    if (init.method === "GET") return json({ session_id: "s", state: mode === "plain" ? "PAUSED_RISK" : "ACTIVE", resume_text: null });
    const b = JSON.parse(init.body as string);
    if (b.kind === "SESSION_START") return started("질문");
    if (mode === "plain") return err(409, {}, "CONFLICT");
    return ++n < 2 ? inProgress({ "retry-after": "1" }) : ok("다음");
  }) as any });
  const flow = createKioskFlow(api, { pollMs: 1000, sleep: () => new Promise(() => {}) });
  await flow.start(); await flow.hear(say("네"));
  assert.equal(flow.current.state, "WAITING_STAFF");
  flow.reset();
  mode = "busy"; await flow.start(); await flow.hear(say("네"));
  assert.equal(flow.current.state, "LISTENING"); assert.equal(flow.current.text, "다음");
  flow.reset();
});

// ---- 깨진 응답 본문(원칙 10): 성공으로 취급하지 않고 일시 장애처럼 재시도, 값을 지어내지 않는다 ----
const raw = (body: string, status = 200, ct = "text/html") => () => new Response(body, { status, headers: { "content-type": ct } });
const bad: Array<[string, () => Response]> = [
  ["HTML 본문(200)", raw("<html>gateway</html>")],
  ["빈 본문(200)", raw("")],
  ["잘린 JSON", raw('{"response_text": "안', 200, "application/json")],
  ["배열", raw("[]", 200, "application/json")],
  ["response_text 없음", raw('{"turn_failure_signal": null}', 200, "application/json")],
  ["response_text가 숫자", raw('{"response_text": 1, "turn_failure_signal": null}', 200, "application/json")],
  ["빈 문자열 response_text", raw('{"response_text": "", "turn_failure_signal": null}', 200, "application/json")],
  ["신호의 알 수 없는 값", raw('{"response_text": null, "turn_failure_signal": {"session_id": "s", "write_committed": "MAYBE", "staff_alert": "NONE"}}', 200, "application/json")],
  ["204 본문 없음", () => new Response(null, { status: 204 })],
];
for (const [name, mk] of bad) {
  test(`깨진 응답(${name})은 성공으로 취급하지 않고 재시도해 정상 응답을 받는다`, async () => {
    const { api, count, turnIds } = make([mk, () => ok("정상")]);
    const r = await api.sendUtterance("s1", "x", "t-b");
    assert.equal(r.response_text, "정상");
    assert.equal(count(), 2);
    assert.deepEqual(turnIds, ["t-b", "t-b"]);
  });
}

test("깨진 응답이 계속되면 예산 소진 뒤 직원 호출이고, 값을 지어내 LISTENING으로 가지 않는다", async () => {
  const c = clock();
  const api = createPublicApiClient({ now: c.now, sleep: c.sleep, fetch: (async (_u: string, init: RequestInit) =>
    JSON.parse(init.body as string).kind === "SESSION_START" ? started("질문") : raw("<html>")()) as any });
  const flow = createKioskFlow(api);
  await flow.start(); await flow.hear(say("네"));
  assert.equal(flow.current.state, "CALL_STAFF");
  assert.equal(flow.current.text, null);
});

test("정상 응답 모양(신호 3종, null 응답 문장)은 그대로 통과한다", async () => {
  for (const sig of [null, { session_id: "s", write_committed: "COMMITTED", staff_alert: "NONE" }, { session_id: "s", write_committed: "NOT_COMMITTED", staff_alert: "DELIVERY_FAILED" }]) {
    const { api, count } = make([() => json({ response_text: null, turn_failure_signal: sig })]);
    await api.sendUtterance("s1", "x", "t");
    assert.equal(count(), 1);
  }
});

test("상태 폴링 응답이 깨졌으면 재시도하고 그래도 안 되면 실패(상태를 지어내지 않는다)", async () => {
  let n = 0;
  const c = clock();
  const api = createPublicApiClient({ now: c.now, sleep: c.sleep, fetch: (async () => (++n < 2 ? new Response("<html>") : json({ session_id: "s1", state: "ACTIVE", resume_text: null }))) as any });
  assert.equal((await api.getSessionState("s1")).state, "ACTIVE");
  const api2 = createPublicApiClient({ now: c.now, sleep: c.sleep, fetch: (async () => json({ ok: true })) as any });
  await assert.rejects(api2.getSessionState("s1"), CallStaffError);
});
