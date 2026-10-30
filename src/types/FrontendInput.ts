/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: survey-service/schema/schemas/FrontendInput.json */


export type SessionId = string

export interface FrontendInput {
response_text: (string | null)
turn_failure_signal: (TurnFailureSignal | null)
/**
 * 세션 시작(POST /v1/sessions) 응답에서 서버가 session_id를 발급했을 때만 있다(2.2.0). 이후 경로의 {session_id}에 쓴다. 다른 응답과 프론트가 ID를 정해 보낸 시작 응답에는 없다. PUBLIC_API.md
 */
session_id?: string
}
export interface TurnFailureSignal {
session_id: SessionId
write_committed: ("COMMITTED" | "NOT_COMMITTED")
staff_alert: ("NONE" | "DELIVERED" | "DELIVERY_FAILED")
/**
 * 정지 사유(2.1.0, CR-H002). 위험 신호/위험 규칙은 RISK, 되묻기 한도 초과는 REASK_LIMIT, 그 밖은 OTHER. optional: 없으면 미상. 읽는 쪽은 모르는 값을 OTHER로 취급한다.
 */
pause_reason?: ("RISK" | "REASK_LIMIT" | "OTHER")
}
