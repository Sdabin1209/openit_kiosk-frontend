// 직원 콘솔의 알림 보조 정보(2.1.0, CR-H001·CR-H002). 순수 함수: 서버가 준 optional 필드를 글자로 바꾼다.
// 왜: 정지 사유와 전달 상태는 직원이 '지금 무엇을 먼저 할지'를 정한다. 색에만 기대면 색각 이상·흑백 인쇄·화면 낭독에서 사라지므로
// 항상 글자 접두("[위험]", "[되묻기 한도]")를 같이 쓴다. 필드가 없는 옛 서버에서는 빈 결과를 돌려 기존 화면을 그대로 둔다.
// 입력 AlertInfoInput(schemas/AlertInfoInput.json) -> 출력 PauseLabel / 문자열 줄. 입력은 계약 StaffAlert의 부분집합이며 모르는 값도 받는다.
import { AlertInfoInput as vInfo, PauseLabel as vLabel } from "../types/validators.gen.cjs";
import type { AlertInfoInput } from "../types/AlertInfoInput.ts";
import type { PauseLabel } from "../types/PauseLabel.ts";

/** 읽는 필드만 (모르는 키를 허용하는 인덱스 시그니처는 뺀다: 계약 StaffAlert 등 더 큰 타입을 그대로 넘긴다). */
type Info = { [K in keyof AlertInfoInput as string extends K ? never : K]: AlertInfoInput[K] };
type PauseReason = PauseLabel["reason"];
/** 읽는 쪽 규약(PUBLIC_API.md H절): 모르는 값은 OTHER. 값이 없으면 undefined(미상). */
function normalizePauseReason(v: unknown): PauseReason | undefined {
  if (v === undefined || v === null) return undefined;
  return v === "RISK" || v === "REASK_LIMIT" || v === "OTHER" ? v : "OTHER";
}

/** 정지 사유 표시. 필드가 없으면 null(기존 표시 유지). 모르는 값은 OTHER(PUBLIC_API.md H절). */
export function pauseLabel(a: Pick<Info, "pause_reason">): { reason: PauseReason; text: string } | null {
  if (!vInfo(a)) throw new Error("AlertInfoInput 스키마 위반");
  const r = normalizePauseReason(a.pause_reason);
  if (!r) return null;
  const text = r === "RISK" ? "[위험 정지] 위험 신호로 멈췄습니다. 환자 안전을 먼저 확인하세요."
    : r === "REASK_LIMIT" ? "[되묻기 한도 정지] 환자가 위험해서가 아니라 질문을 여러 번 되물어도 답을 못 받아 멈췄습니다. 환자 상태를 확인하고 이어갈지 정하세요."
    : "[정지: 그 밖의 사유]";
  const out: PauseLabel = { reason: r, text };
  if (!vLabel(out)) throw new Error("PauseLabel 스키마 위반"); // 내는 쪽이 검증한다
  return out;
}
const DELIVERY: Record<string, string> = { DELIVERED: "전달됨", DELIVERY_FAILED: "전달 실패" };
const OUTCOME: Record<string, string> = { STAFF_NOTIFIED_MANUALLY: "환자가 직접 직원에게 알렸다고 보고", NOT_NOTIFIED: "환자가 아직 직원에게 알리지 못했다고 보고" };
/** 전달 시도·마지막 전달 상태·환자 직접 통지 보고. 값이 없으면 줄을 만들지 않는다. 모르는 값은 그대로 보인다. */
export function deliveryLines(a: Info): string[] {
  if (!vInfo(a)) throw new Error("AlertInfoInput 스키마 위반");
  const out: string[] = [];
  if (a.delivery_attempts !== undefined || a.last_delivery_status) {
    const st = a.last_delivery_status ? (DELIVERY[a.last_delivery_status] ?? a.last_delivery_status) : "알 수 없음";
    out.push(`전달 ${a.delivery_attempts ?? "?"}회 시도, 마지막: ${st}${a.last_delivery_status === "DELIVERY_FAILED" ? " (직원이 직접 확인 필요)" : ""}`);
  }
  if (a.manual_notice_outcome) out.push(`${OUTCOME[a.manual_notice_outcome] ?? `환자 통지 보고: ${a.manual_notice_outcome}`}${a.manual_notice_reported_at ? ` (${a.manual_notice_reported_at})` : ""}`);
  return out;
}
