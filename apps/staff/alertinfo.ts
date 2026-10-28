// 직원 콘솔의 알림 보조 정보(2.1.0, CR-H001·CR-H002). 순수 함수: 서버가 준 optional 필드를 글자로 바꾼다.
// 왜: 정지 사유와 전달 상태는 직원이 '지금 무엇을 먼저 할지'를 정한다. 색에만 기대면 색각 이상·흑백 인쇄·화면 낭독에서 사라지므로
// 항상 글자 접두("[위험]", "[되묻기 한도]")를 같이 쓴다. 필드가 없는 옛 서버에서는 빈 결과를 돌려 기존 화면을 그대로 둔다.
import { normalizePauseReason, type PauseReason, type StaffAlert } from "../../api/types.ts";

type Info = Pick<StaffAlert, "delivery_attempts" | "last_delivery_status" | "manual_notice_outcome" | "manual_notice_reported_at" | "pause_reason">;

/** 정지 사유 표시. 필드가 없으면 null(기존 표시 유지). 모르는 값은 OTHER(PUBLIC_API.md H절). */
export function pauseLabel(a: Pick<Info, "pause_reason">): { reason: PauseReason; text: string } | null {
  const r = normalizePauseReason(a.pause_reason);
  if (!r) return null;
  const text = r === "RISK" ? "[위험 정지] 위험 신호로 멈췄습니다. 환자 안전을 먼저 확인하세요."
    : r === "REASK_LIMIT" ? "[되묻기 한도 정지] 환자가 위험해서가 아니라 질문을 여러 번 되물어도 답을 못 받아 멈췄습니다. 환자 상태를 확인하고 이어갈지 정하세요."
    : "[정지: 그 밖의 사유]";
  return { reason: r, text };
}
const DELIVERY: Record<string, string> = { DELIVERED: "전달됨", DELIVERY_FAILED: "전달 실패" };
const OUTCOME: Record<string, string> = { STAFF_NOTIFIED_MANUALLY: "환자가 직접 직원에게 알렸다고 보고", NOT_NOTIFIED: "환자가 아직 직원에게 알리지 못했다고 보고" };
/** 전달 시도·마지막 전달 상태·환자 직접 통지 보고. 값이 없으면 줄을 만들지 않는다. 모르는 값은 그대로 보인다. */
export function deliveryLines(a: Info): string[] {
  const out: string[] = [];
  if (a.delivery_attempts !== undefined || a.last_delivery_status) {
    const st = a.last_delivery_status ? (DELIVERY[a.last_delivery_status] ?? a.last_delivery_status) : "알 수 없음";
    out.push(`전달 ${a.delivery_attempts ?? "?"}회 시도, 마지막: ${st}${a.last_delivery_status === "DELIVERY_FAILED" ? " (직원이 직접 확인 필요)" : ""}`);
  }
  if (a.manual_notice_outcome) out.push(`${OUTCOME[a.manual_notice_outcome] ?? `환자 통지 보고: ${a.manual_notice_outcome}`}${a.manual_notice_reported_at ? ` (${a.manual_notice_reported_at})` : ""}`);
  return out;
}
