// 재시도 정책(FAULT_POLICY 원칙 2·3·7). 값은 이 파일 한 곳에서만 정한다.
// 값의 근거 구분(자세한 이유: docs/adr/0004, 0003): 총 예산 20초와 재시도 대상 코드 집합 = FAULT_POLICY 원칙 7(정책에서 온 값).
// 지수 백오프+지터 구조 = 표준 관행. 기준 0.5초·상한 5초·지터 하한 50%·직원 스트림 1초/15초·하트비트 30초+지터 5초 = 임의(측정 안 함).
// 이 값들은 '정한 것'이다. 임상 현장 흐름에 맞는지는 사용자 결정 대기(FAULT_POLICY 맨 아래)이며 실측으로 확인하지 못했다.

export interface RetryPolicy {
  /** 첫 재시도 전 기준 대기(ms). 서비스 재시작은 수 초 걸리므로 0.5초로 빠르게 한 번 더 시도하되 곧 늘린다. */
  baseMs: number;
  /** 시도마다 곱하는 배율. 2배면 0.5 -> 1 -> 2 -> 4 -> (상한 5). */
  factor: number;
  /** 대기 상한(ms). 환자가 화면 앞에서 기다리므로 한 번 쉬는 시간이 5초를 넘지 않게 한다. */
  maxMs: number;
  /** 총 재시도 예산(ms). FAULT_POLICY 기본 약 20초. 서버 턴 마감(FAULT_POLICY 6초)과 키오스크 대기(10초) 뒤에도 한두 번 더 시도할 수 있는 길이. 넘으면 직원 호출 화면. */
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

/** 같은 요청을 자동으로 다시 보내도 되는 응답인가(재시도 분류의 유일한 정의, KF-09). 상태 코드와 `ApiError.reason`만 받는다. */
export function isRetryable(status: number, reason: string | null): boolean {
  return RETRYABLE_STATUS.has(status) || (status === 409 && reason === TURN_IN_PROGRESS);
}
/** 서버가 요청을 처리했는지 알 수 없는 응답인가. PUBLIC_API.md 125행: 5xx와 시간 초과는 처리 여부를 모르므로 같은 turn_id를 유지해 다시 보낸다.
 * 자동 재시도 대상(isRetryable)과는 다른 질문이다: 500은 자동 재시도하지 않지만(서버 버그로 본다) 처리 여부는 모른다. */
export function isOutcomeUnknown(status: number): boolean {
  return status >= 500;
}

/** 직원 콘솔 실시간 스트림 재연결(예산 없음: 복구되면 사람 개입 없이 다시 붙는다, 원칙 12).
 * 직원은 화면 앞에서 계속 기다리는 사람이 아니므로 상한을 키오스크(5초)보다 길게 15초로 두고, 상류가 재시작 중일 때 몰려들지 않게 지터를 둔다. */
export const STAFF_STREAM_RETRY: RetryPolicy = { baseMs: 1_000, factor: 2, maxMs: 15_000, budgetMs: Number.POSITIVE_INFINITY, maxAttempts: Number.POSITIVE_INFINITY, minJitter: 0.5 };

/** 직원 알림 스트림 하트비트 감시(PUBLIC_API.md 43행, D87). 서버는 연결 직후 한 번과 약 15초마다 `event: heartbeat`를 보낸다.
 * 한 번 놓친 것은 지연일 수 있으므로 주기의 2배(30초) 동안 아무 하트비트도 없으면 죽은 연결로 본다. 여기에 0~5초 지터를 더해
 * 서버 재시작 직후 모든 콘솔이 같은 초에 재연결하지 않게 한다. 값은 '정한 것'이며 실측하지 않았다.
 * 감시는 첫 하트비트를 받은 연결에서만 켠다(하트비트를 보내지 않는 구버전 서버에서는 켜지 않고 목록 주기 재읽기만 안전망이 된다). */
export const STAFF_HEARTBEAT = { intervalMs: 15_000, missFactor: 2, jitterMs: 5_000 } as const;
export const heartbeatTimeoutMs = (rand: () => number = Math.random) => STAFF_HEARTBEAT.intervalMs * STAFF_HEARTBEAT.missFactor + Math.round(rand() * STAFF_HEARTBEAT.jitterMs);

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
