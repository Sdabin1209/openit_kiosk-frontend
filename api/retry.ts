// 재시도 정책(FAULT_POLICY 원칙 2·3·7). 값은 이 파일 한 곳에서만 정한다.
// 이 값들은 '정한 것'이다. 임상 현장 흐름에 맞는지는 사용자 결정 대기(FAULT_POLICY 맨 아래)이며 실측으로 확인하지 못했다.

export interface RetryPolicy {
  /** 첫 재시도 전 기준 대기(ms). 서비스 재시작은 수 초 걸리므로 0.5초로 빠르게 한 번 더 시도하되 곧 늘린다. */
  baseMs: number;
  /** 시도마다 곱하는 배율. 2배면 0.5 -> 1 -> 2 -> 4 -> (상한 5). */
  factor: number;
  /** 대기 상한(ms). 환자가 화면 앞에서 기다리므로 한 번 쉬는 시간이 5초를 넘지 않게 한다. */
  maxMs: number;
  /** 총 재시도 예산(ms). FAULT_POLICY 기본 약 20초. 서버 턴 마감(8초)과 키오스크 대기(10초) 뒤에도 한두 번 더 시도할 수 있는 길이. 넘으면 직원 호출 화면. */
  budgetMs: number;
  /** 시도 횟수 상한. 기본은 없음(예산이 끊는다). 시험·특수 용도에서만 둔다. */
  maxAttempts: number;
  /** 지터 하한 비율. 대기는 [ceil*minJitter, ceil] 에서 고른다(모든 키오스크가 같은 시각에 재시도하지 않게 한다). */
  minJitter: number;
}

export const DEFAULT_RETRY: RetryPolicy = {
  baseMs: 500,
  factor: 2,
  maxMs: 5_000,
  budgetMs: 20_000,
  maxAttempts: Number.POSITIVE_INFINITY,
  minJitter: 0.5,
};

/** 재시도하는 상태 코드. 500은 서버 버그로 보고 재시도하지 않는다. 4xx(429 제외)도 하지 않는다. */
export const RETRYABLE_STATUS: ReadonlySet<number> = new Set([429, 502, 503, 504]);
/** 409(code CONFLICT) 중 details.reason이 이 값일 때만 재시도한다(처리 중인 같은 turn_id, PUBLIC_API.md 409 행). 그 밖의 409는 순서 어긋남·위험 정지로 보고 재시도하지 않는다. */
export const TURN_IN_PROGRESS = "TURN_IN_PROGRESS";

/** n번째 재시도(1부터) 앞의 지터 포함 대기. rand는 [0,1) (시험에서 주입). */
export function backoffMs(attempt: number, p: RetryPolicy = DEFAULT_RETRY, rand: () => number = Math.random): number {
  const ceil = Math.min(p.maxMs, p.baseMs * p.factor ** (attempt - 1));
  return Math.round(ceil * (p.minJitter + (1 - p.minJitter) * rand()));
}

/** 서버가 Retry-After를 주면 그보다 일찍 보내지 않는다. 같은 값을 받은 키오스크가 몰리지 않게 위로만 지터를 더한다. */
export function waitMs(attempt: number, retryAfterMs: number | null, p: RetryPolicy = DEFAULT_RETRY, rand: () => number = Math.random): number {
  const b = backoffMs(attempt, p, rand);
  if (retryAfterMs === null) return b;
  return retryAfterMs + Math.round(rand() * Math.min(p.maxMs, p.baseMs * p.factor ** (attempt - 1)) * (1 - p.minJitter));
}
