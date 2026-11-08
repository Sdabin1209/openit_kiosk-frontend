/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: boundary-contracts StaffAlert (패키지 버전 5.0.1) */


/**
 * 직원 콘솔 알림(PUBLIC_API.md). 환자 발화와 개인정보는 담지 않는다. kind는 모르는 값을 그대로 보여 준다.
 */
export interface StaffAlert {
/**
 * 근거: 길이 상한 128 은 설계 상한(CONVENTIONS 2절, 측정 안 함)
 */
alert_id: string
/**
 * 세션 ID(서버 발급, PUBLIC_API A절). 4.x 공개 형식 [A-Za-z0-9_-]{1,64} 와 Id 의 교집합: 첫 글자 영문·숫자, 이후 영문·숫자·_·-, 1~64자. '.'·':' 는 넓히지 않았다. 근거: survey-service 가 secrets.token_hex(32)(64자 소문자 16진)로 발급한다(2026-11-08 결함 #21, 첫 글자 _·- 가 Id 를 어기던 token_urlsafe 대체). 이 타입의 값은 Id 이므로 envelope_id 가 바꾸지 않는다(CONVENTIONS 116행).
 */
session_id: string
/**
 * 알림 종류. 알려진 값: RISK_STOP(위험 정지, 위험 신호·선별 포함), CALL_STAFF(직원 호출: 서비스 판단 또는 위험 신호 severity CALL_STAFF), USER_CALLED_STAFF(환자가 직원 호출). 모르는 값은 읽는 쪽이 일반 알림으로 보인다(CONVENTIONS 1절 3항)
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
