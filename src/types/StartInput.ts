/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/StartInput.json */


/**
 * 시작 값 결정 입력: 주소창 조각(#...)과 기기 설정 본문(없으면 null).
 */
export interface StartInput {
hash: string
config: unknown
}
