import type { PushSubscriptionJson } from "../../api/types.ts";

function b64ToBytes(s: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** VAPID 공개키는 GET /v1/staff/push-config에서 받는다(공개 값). 비밀 키는 브라우저에 없다. */
export async function enablePush(
  getKey: () => Promise<string | null>,
  register: (s: PushSubscriptionJson) => Promise<void>,
): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("이 브라우저는 웹 푸시를 지원하지 않습니다");
  const key = await getKey();
  if (!key) throw new Error("푸시가 꺼져 있습니다(실시간 구독만 동작)");
  const reg = await navigator.serviceWorker.register("/staff/sw.js", { scope: "/staff/" });
  await navigator.serviceWorker.ready;
  if ((await Notification.requestPermission()) !== "granted") throw new Error("알림 권한이 거부되었습니다");
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) });
  await register(sub.toJSON() as PushSubscriptionJson);
}
