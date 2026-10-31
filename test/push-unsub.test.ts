// 점검 #42 / CR-006 / 계약 2.2.0: 푸시 해지는 POST /v1/staff/push-subscriptions/unsubscribe 본문 {"endpoint": "..."} (204).
// 엔드포인트 URL은 그 자체가 푸시 권한을 주는 값이라 URL(쿼리 문자열)에 싣지 않는다. 기준: ../boundary-contracts/PUBLIC_API.md 푸시 구독 행.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createPublicApiClient } from "../src/wiring/public_api.ts";
import { createStaffApi } from "../src/wiring/public_api.ts";
import { startMock } from "./helpers.ts";

const EP = "https://push.example/secret-endpoint-abc";

test("unregisterPush: POST .../unsubscribe, 본문에 endpoint, URL에는 endpoint 없음", async () => {
  const seen: Array<{ method: string; url: string; body: any }> = [];
  const c = createPublicApiClient({ fetch: (async (url: string, init: RequestInit) => { seen.push({ method: init.method!, url, body: init.body ? JSON.parse(init.body as string) : undefined }); return new Response(null, { status: 204 }); }) as any });
  await createStaffApi(c).unregisterPush(EP);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].method, "POST");
  assert.equal(seen[0].url, "/v1/staff/push-subscriptions/unsubscribe");
  assert.deepEqual(seen[0].body, { endpoint: EP });
  assert.ok(!seen[0].url.includes("endpoint") && !seen[0].url.includes("secret"), "URL에 엔드포인트가 실리지 않는다");
});

test("모의 서버: unsubscribe로 구독이 지워지고 204를 낸다", async () => {
  const m = await startMock();
  try {
    await fetch(m.base + "/v1/staff/push-subscriptions", { method: "POST", body: JSON.stringify({ endpoint: EP, keys: { p256dh: "a", auth: "b" } }) });
    assert.equal(m.state.subs.size, 1);
    const r = await fetch(m.base + "/v1/staff/push-subscriptions/unsubscribe", { method: "POST", body: JSON.stringify({ endpoint: EP }) });
    assert.equal(r.status, 204);
    assert.equal(m.state.subs.size, 0);
    const bad = await fetch(m.base + "/v1/staff/push-subscriptions/unsubscribe", { method: "POST", body: JSON.stringify({}) });
    assert.equal(bad.status, 400);
  } finally { await m.close(); }
});
