/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: survey-service survey-schema-v4.1.4 schema/schemas/FrontendInput.json */


export interface FrontendInput {
response_text: (string | null)
turn_failure_signal: (TurnFailureSignal | null)
/**
 * 세션 시작(POST /v1/sessions) 성공 응답에서 서버가 발급한 session_id이다. 이후 요청 경로의 {session_id}에 쓴다. 시작 이외의 응답에는 없다. PUBLIC_API.md
 */
session_id?: string
}
export interface TurnFailureSignal {
session_id: string
write_committed: ("COMMITTED" | "NOT_COMMITTED")
staff_alert: ("NONE" | "DELIVERED" | "DELIVERY_FAILED")
/**
 * 정지 사유(2.1.0, CR-H002). 위험 신호/위험 규칙은 RISK, 되묻기 한도 초과는 REASK_LIMIT, 그 밖은 OTHER. optional: 없으면 미상. 읽는 쪽은 모르는 값을 OTHER로 취급한다.
 */
pause_reason?: ("RISK" | "REASK_LIMIT" | "OTHER")
}
