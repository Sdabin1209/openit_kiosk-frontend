/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/RetryPolicy.json */


/**
 * 재시도 정책 값. 값의 근거는 docs/adr/0004.
 */
export interface RetryPolicy {
/**
 * 첫 재시도 기준 대기(ms)
 */
baseMs: number
factor: number
maxMs: number
/**
 * 총 재시도 예산(ms). 직원 스트림은 무한
 */
budgetMs: number
/**
 * 시도 횟수 상한. 무한은 JSON에 없으므로 이 값을 생략한다
 */
maxAttempts?: number
minJitter: number
}
