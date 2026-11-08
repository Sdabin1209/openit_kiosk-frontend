/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: survey-service survey-schema-v5.0.0 schema/schemas/FrontendInput.json */


export interface FrontendInput {
response_text: (string | null)
turn_failure_signal: (TurnFailureSignal | null)
/**
 * 세션 시작(POST /v1/sessions) 성공 응답에서 서버가 발급한 session_id이다. 이후 요청 경로의 {session_id}에 쓴다. 시작 이외의 응답에는 없다. PUBLIC_API.md
 */
session_id?: string
}
export interface TurnFailureSignal {
/**
 * 세션 ID(서버 발급, PUBLIC_API A절). 4.x 공개 형식 [A-Za-z0-9_-]{1,64} 와 Id 의 교집합: 첫 글자 영문·숫자, 이후 영문·숫자·_·-, 1~64자. '.'·':' 는 넓히지 않았다. 근거: survey-service 가 secrets.token_hex(32)(64자 소문자 16진)로 발급한다(2026-11-08 결함 #21, 첫 글자 _·- 가 Id 를 어기던 token_urlsafe 대체). 이 타입의 값은 Id 이므로 envelope_id 가 바꾸지 않는다(CONVENTIONS 116행).
 */
session_id: string
write_committed: ("COMMITTED" | "NOT_COMMITTED")
staff_alert: ("NONE" | "DELIVERED" | "DELIVERY_FAILED")
/**
 * 정지 사유(2.1.0, CR-H002). 위험 신호/위험 규칙은 RISK, 되묻기 한도 초과는 REASK_LIMIT, 그 밖은 OTHER. optional: 없으면 미상. 읽는 쪽은 모르는 값을 OTHER로 취급한다.
 */
pause_reason?: ("RISK" | "REASK_LIMIT" | "OTHER")
}
