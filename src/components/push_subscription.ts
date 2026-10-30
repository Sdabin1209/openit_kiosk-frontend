// 웹 푸시 구독 컴포넌트(브라우저 PushManager라는 바깥 자원을 다룬다). 입력: VAPID 공개키를 얻는 함수와 서버에 등록하는 함수(wiring이 link_public_api_send를 넣는다). 출력: 구독 등록·해지 결과.
interface PushSubscriptionJson { endpoint: string; keys: { p256dh: string; auth: string }; [k: string]: unknown }

function b64ToBytes(s: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** 푸시 구독을 해지한다: 서버 등록을 지우고 브라우저 구독을 끊는다. 구독이 없으면 아무것도 하지 않는다. */
export async function disablePush(unregister: (endpoint: string) => Promise<void>): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  const reg = await navigator.serviceWorker.getRegistration("/staff/");
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return false;
  await unregister(sub.endpoint); // 서버 먼저: 실패하면 구독을 유지해 다시 시도할 수 있다
  await sub.unsubscribe();
  return true;
}
export async function hasPush(): Promise<boolean> {
  try { return !!(await (await navigator.serviceWorker.getRegistration("/staff/"))?.pushManager.getSubscription()); } catch { return false; }
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
