/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: boundary-contracts SessionState (패키지 버전 5.0.0) */


/**
 * 키오스크가 폴링하는 세션 상태(D66). 위험 정지가 풀렸는지와 이어서 할 안내 문장을 알린다.
 */
export interface SessionState {
/**
 * 세션 ID(서버 발급, PUBLIC_API A절). 4.x 공개 형식 [A-Za-z0-9_-]{1,64} 와 Id 의 교집합: 첫 글자 영문·숫자, 이후 영문·숫자·_·-, 1~64자. '.'·':' 는 넓히지 않았다. 근거: survey-service 가 secrets.token_hex(32)(64자 소문자 16진)로 발급한다(2026-11-08 결함 #21, 첫 글자 _·- 가 Id 를 어기던 token_urlsafe 대체). 이 타입의 값은 Id 이므로 envelope_id 가 바꾸지 않는다(CONVENTIONS 116행).
 */
session_id: string
state: ("ACTIVE" | "PAUSED_RISK" | "ENDED")
/**
 * 직원 재개 뒤 이어서 할 안내 문장. 다음 발화 턴이 접수되면 null이 된다
 */
resume_text: (string | null)
/**
 * state가 PAUSED_RISK일 때 정지 사유(2.1.0, CR-H002). 그 밖의 상태에서는 null 또는 생략. 읽는 쪽은 모르는 값을 OTHER로 취급한다. 3.2.0(U36·G12, 사용자 결정 2026-11-03): 되묻기 한도 뒤에는 정지하지 않고 그 문항을 빈칸(REASK_LIMIT 사유)으로 두고 다음 문항으로 가므로 서비스는 REASK_LIMIT 정지를 더 내지 않는다. 값은 호환을 위해 열거에 남긴다(폐기 예정)
 */
pause_reason?: ("RISK" | "REASK_LIMIT" | "OTHER" | null)
}
