/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/UtteranceRequest.json */


/**
 * 발화 전송 입력. 빈 발화(공백뿐)는 서버로 보내지 않는다.
 */
export interface UtteranceRequest {
session_id: string
utterance: string
turn_id: string
}
