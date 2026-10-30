/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/SttResult.json */


/**
 * 음성 인식 어댑터의 출력.
 */
export interface SttResult {
text: string
confidence: (number | null)
}
