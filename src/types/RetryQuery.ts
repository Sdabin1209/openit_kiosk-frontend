/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/RetryQuery.json */


/**
 * 재시도 판단 입력: 지금까지 시도 횟수와 경과 시간.
 */
export interface RetryQuery {
attempt: number
retryAfterMs: (number | null)
elapsedMs: number
}
