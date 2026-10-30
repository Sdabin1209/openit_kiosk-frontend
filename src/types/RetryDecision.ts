/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/RetryDecision.json */


/**
 * 재시도 판단 출력: 포기(직원 호출)이거나 대기 시간.
 */
export interface RetryDecision {
giveUp: boolean
waitMs: number
}
