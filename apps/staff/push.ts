import type { PushSubscriptionJson } from "../../api/types.ts";

function b64ToBytes(s: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** VAPID 공개키는 /config.json(공개 값)에서 읽는다. 비밀 키는 브라우저에 없다. */
export async function enablePush(register: (s: PushSubscriptionJson) => Promise<void>): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("이 브라우저는 웹 푸시를 지원하지 않습니다");
  const cfg = await (await fetch("/config.json", { cache: "no-store" })).json();
  if (!cfg.vapidPublicKey) throw new Error("푸시 공개키가 설정되지 않았습니다");
  const reg = await navigator.serviceWorker.register("/staff/sw.js", { scope: "/staff/" });
  await navigator.serviceWorker.ready;
  if ((await Notification.requestPermission()) !== "granted") throw new Error("알림 권한이 거부되었습니다");
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(cfg.vapidPublicKey) });
  await register(sub.toJSON() as PushSubscriptionJson);
}
