// 푸시 본문을 알림 문구와 tag로 바꾼다. 본문 모양은 계약 스키마 StaffPushPayload가 정한다(모르는 키·session_id 없음은 거부, ADR 0021).
import { PushNotification as vOut, StaffPushPayload as vPayload } from "../types/validators.gen.cjs";
import type { PushNotification } from "../types/PushNotification.ts";

const GENERIC: PushNotification = { body: "새 알림이 있습니다", tag: "staff-alert" };

/** 계약을 어긴 본문은 값을 믿지 않고 일반 문구와 고정 tag로 알린다(알림을 놓치는 것보다 낫다). */
export function pushNotification(data: unknown): PushNotification {
  if (!vPayload(data)) return GENERIC;
  const d = data as { session_id: string; kind?: string; alert_id?: string };
  const out: PushNotification = { body: `세션 ${d.session_id} (${d.kind ?? "알림"})`, tag: d.alert_id ?? GENERIC.tag };
  return vOut(out) ? out : GENERIC; // 내는 쪽이 검증한다
}
