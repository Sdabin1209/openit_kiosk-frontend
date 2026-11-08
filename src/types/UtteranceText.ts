/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/UtteranceText.json */


/**
 * 서버로 보낼 발화 문장 한 칸. 형식(공백뿐 거부, 최대 길이)은 계약 UtteranceBody.utterance 가 정한다. 여기에 값을 되풀이하지 않는다(D117).
 */
export type UtteranceText = string
