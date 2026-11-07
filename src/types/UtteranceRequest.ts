/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/UtteranceRequest.json */


/**
 * 발화 전송 입력. 빈 발화(공백뿐)는 서버로 보내지 않는다.
 */
export interface UtteranceRequest {
/**
 * 근거: 1~64자(PUBLIC_API.md 세션 ID 형식)
 */
session_id: string
utterance: string
/**
 * 근거: 상한 64 는 PUBLIC_API.md 세션·턴 ID 형식과 같다
 */
turn_id: string
}
