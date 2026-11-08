/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/StartedBody.json */


/**
 * 세션 시작 응답 본문: FrontendBody + 서버가 발급한 session_id(1~64자 영문·숫자·-_). 없거나 틀리면 성공으로 보지 않는다(ID를 지어내지 않는다).
 */
export type StartedBody = (FrontendBody & {
/**
 * 세션 ID(서버 발급, PUBLIC_API A절). 4.x 공개 형식 [A-Za-z0-9_-]{1,64} 와 Id 의 교집합: 첫 글자 영문·숫자, 이후 영문·숫자·_·-, 1~64자. '.'·':' 는 넓히지 않았다. 근거: survey-service 가 secrets.token_hex(32)(64자 소문자 16진)로 발급한다(2026-11-08 결함 #21, 첫 글자 _·- 가 Id 를 어기던 token_urlsafe 대체). 이 타입의 값은 Id 이므로 envelope_id 가 바꾸지 않는다(CONVENTIONS 116행).
 */
session_id: string
})

/**
 * 턴·종료·개입 응답 본문을 받아들이는 조건(문진 스키마 FrontendInput의 읽는 쪽 부분집합, 모르는 키 허용). 어기면 성공으로 취급하지 않고 재시도한다(FAULT_POLICY 원칙 10).
 */
export interface FrontendBody {
response_text: (string | null)
turn_failure_signal: (null | {
session_id: string
write_committed: ("COMMITTED" | "NOT_COMMITTED")
staff_alert: ("NONE" | "DELIVERED" | "DELIVERY_FAILED")
})
}
