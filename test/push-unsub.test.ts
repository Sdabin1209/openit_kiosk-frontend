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

// 계약 3.4.0: 푸시 구독 선택 topics(alerts/results), 기본 alerts. 직원 콘솔은 topics를 보내지 않아 기본(alerts)만 받으므로 직원 서비스 워커에 RESULT_READY는 오지 않는다(results는 clinician 역할만 등록, PUBLIC_API.md).
test("직원 콘솔의 푸시 구독 본문에는 topics(results)가 없다: 기본 alerts만 구독한다", async () => {
  const { enablePush } = await import("../src/components/push_subscription.ts");
  const g = globalThis as any;
  const saved = { navigator: Object.getOwnPropertyDescriptor(g, "navigator"), window: g.window, Notification: g.Notification };
  const sub = { endpoint: EP, keys: { p256dh: "a", auth: "b" }, toJSON() { return { endpoint: EP, expirationTime: null, keys: { p256dh: "a", auth: "b" } }; } };
  Object.defineProperty(g, "navigator", { configurable: true, value: { serviceWorker: { register: async () => ({ pushManager: { subscribe: async () => sub } }), ready: Promise.resolve() } } });
  g.window = { PushManager: {} }; g.Notification = { requestPermission: async () => "granted" };
  try {
    const sent: any[] = [];
    await enablePush(async () => "AAAA", async (s) => { sent.push(s); });
    assert.equal(sent.length, 1);
    assert.equal("topics" in sent[0], false);
    assert.ok(!JSON.stringify(sent[0]).includes("results"));
  } finally {
    if (saved.navigator) Object.defineProperty(g, "navigator", saved.navigator); else delete g.navigator;
    g.window = saved.window; g.Notification = saved.Notification;
  }
});

test("푸시 구독 등록 본문은 계약 PushSubscriptionRequest 모양이다: toJSON의 expirationTime은 빼고, https·443·공인 이름이 아닌 endpoint는 보내지 않는다", async () => {
  const seen: any[] = [];
  const c = createPublicApiClient({ fetch: (async (_u: string, init: RequestInit) => { seen.push(JSON.parse(init.body as string)); return new Response(null, { status: 201 }); }) as any });
  const staff = createStaffApi(c);
  await staff.registerPush({ endpoint: "https://push.example/abc", expirationTime: null, keys: { p256dh: "AAA", auth: "BBB" } } as any);
  assert.deepEqual(seen, [{ endpoint: "https://push.example/abc", keys: { p256dh: "AAA", auth: "BBB" } }]);
  for (const bad of ["http://push.example/abc", "https://127.0.0.1/abc", "https://localhost/abc", "https://push.example:8443/abc"]) {
    await assert.rejects(async () => staff.registerPush({ endpoint: bad, keys: { p256dh: "AAA", auth: "BBB" } } as any), /PushSubscriptionRequest/, bad);
  }
  assert.equal(seen.length, 1, "거부된 것은 보내지 않았다");
});
