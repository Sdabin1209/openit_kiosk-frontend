/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/SessionRequest.json */


/**
 * 세션 하나를 가리키는 요청(종료, 상태 조회) 입력.
 */
export interface SessionRequest {
/**
 * 근거: 1~64자(PUBLIC_API.md 세션 ID 형식)
 */
session_id: string
}
