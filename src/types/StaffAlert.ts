/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: boundary-contracts StaffAlert (패키지 버전 3.1.1) */


/**
 * 직원 콘솔 알림(PUBLIC_API.md). 환자 발화와 개인정보는 담지 않는다. kind는 모르는 값을 그대로 보여 준다.
 */
export interface StaffAlert {
alert_id: string
session_id: string
/**
 * RISK_STOP 등
 */
kind: string
created_at: string
status: ("OPEN" | "RESOLVED")
resolved_by_decision?: ("RESUME" | "END" | null)
resolved_at?: (string | null)
/**
 * 정지 사유(2.1.0, CR-H002). 읽는 쪽은 모르는 값을 OTHER로 취급한다. 없으면(옛 서버) 미상.
 */
pause_reason?: ("RISK" | "REASK_LIMIT" | "OTHER" | null)
/**
 * 전달을 시도한 횟수(첫 전달 포함, 재알림마다 1 증가, 2.1.0, CR-H001)
 */
delivery_attempts?: number
/**
 * 가장 최근 전달 시도의 결과(2.1.0)
 */
last_delivery_status?: ("DELIVERED" | "DELIVERY_FAILED" | null)
/**
 * 키오스크가 보고한, 현장 직원에게 직접 알렸는지(2.1.0). 보고 전에는 null 또는 생략
 */
manual_notice_outcome?: ("STAFF_NOTIFIED_MANUALLY" | "NOT_NOTIFIED" | null)
manual_notice_reported_at?: (string | null)
}
