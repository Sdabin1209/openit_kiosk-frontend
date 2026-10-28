// 서비스 워커: 웹 푸시를 알림으로 보인다. 본문에는 세션 ID와 종류만 온다(계약).
const sw = self as any;
sw.addEventListener("push", (event: any) => {
  let d: any = {};
  try { d = event.data ? event.data.json() : {}; } catch { /* 형식 모름: 일반 문구 */ }
  const body = d.session_id ? `세션 ${d.session_id} (${d.kind ?? "알림"})` : "새 알림이 있습니다";
  // 왜 renotify: 재알림은 같은 alert_id(=같은 tag)로 다시 온다. renotify 없이는 같은 tag 알림이 소리·진동 없이 조용히 교체되어 직원이 재알림을 놓친다(M-1).
  event.waitUntil(sw.registration.showNotification("직원 호출", { body, tag: d.alert_id ?? "staff-alert", renotify: true, requireInteraction: true }));
});
sw.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  event.waitUntil(sw.clients.openWindow("/staff/"));
});
