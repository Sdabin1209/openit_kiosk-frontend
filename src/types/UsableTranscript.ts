/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/UsableTranscript.json */


/**
 * 서버로 보내도 되는 인식 결과. 글자가 하나도 없는(공백·문장부호뿐) 결과와 신뢰도 0.4 미만은 거부한다. 0.4는 잠정(사용자 결정 U10, 근거 없는 임의 값, 측정하지 않았다, ADR 0008).
 */
export interface UsableTranscript {
text: string
confidence: (number | null)
}
