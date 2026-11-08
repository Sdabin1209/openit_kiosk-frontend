/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/StaffCallRetryInput.json */


/**
 * 직원 호출 재알림 요청 입력. 같은 turn_id의 재전송은 서버가 같은 응답을 준다(멱등).
 */
export interface StaffCallRetryInput {
/**
 * 세션 ID(서버 발급, PUBLIC_API A절). 4.x 공개 형식 [A-Za-z0-9_-]{1,64} 와 Id 의 교집합: 첫 글자 영문·숫자, 이후 영문·숫자·_·-, 1~64자. '.'·':' 는 넓히지 않았다. 근거: survey-service 가 secrets.token_hex(32)(64자 소문자 16진)로 발급한다(2026-11-08 결함 #21, 첫 글자 _·- 가 Id 를 어기던 token_urlsafe 대체). 이 타입의 값은 Id 이므로 envelope_id 가 바꾸지 않는다(CONVENTIONS 116행).
 */
session_id: string
/**
 * 턴 ID(공개 입구 turn_id 와 같은 Id). 5.0.0: 64자 상한 사본을 Id(128) 참조로 바꿨다(D117).
 */
turn_id: string
}
