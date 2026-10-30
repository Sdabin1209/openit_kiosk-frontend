// 재시도 정책 컴포넌트. 입력 RetryQuery(시도 횟수·Retry-After·경과 시간) -> 출력 RetryDecision(포기 또는 대기 시간),
// 입력 StatusQuery(HTTP 상태·reason) -> 출력 StatusClass(재시도 가능, 처리 여부 불명). 값은 wiring이 config.ts에서 넣는다.
// 값의 근거 구분은 src/config.ts와 docs/adr/0004, 0003. 순수 함수이며 난수만 주입받는다(같은 입력·같은 난수 -> 같은 출력).
import { RetryDecision as vRetryDecision, RetryPolicy as vRetryPolicy, RetryQuery as vRetryQuery, StatusClass as vStatusClass, StatusQuery as vStatusQuery } from "../types/validators.gen.cjs";
import type { RetryDecision } from "../types/RetryDecision.ts";
import type { RetryPolicy } from "../types/RetryPolicy.ts";
import type { RetryQuery } from "../types/RetryQuery.ts";
import type { StatusClass } from "../types/StatusClass.ts";
import type { StatusQuery } from "../types/StatusQuery.ts";

export type { RetryDecision, RetryPolicy, RetryQuery, StatusClass, StatusQuery };

/** 재시도하는 상태 코드. 500은 서버 버그로 보고 재시도하지 않는다. 4xx(429 제외)도 하지 않는다(FAULT_POLICY 원칙 7). */
const RETRYABLE_STATUS: ReadonlySet<number> = new Set([429, 502, 503, 504]);
/** 409(code CONFLICT) 중 details.reason이 이 값일 때만 재시도한다(처리 중인 같은 turn_id, PUBLIC_API.md 409 행). */
const TURN_IN_PROGRESS = "TURN_IN_PROGRESS";

/** 정책 값은 만들 때 한 번 스키마로 검증한다. maxAttempts를 생략하면 무한(예산이 끊는다). */
export function createRetryPolicy(policy: RetryPolicy, rand: () => number = Math.random) {
  if (!vRetryPolicy(policy)) throw new Error(`RetryPolicy 스키마 위반: ${JSON.stringify(vRetryPolicy.errors)}`);
  const p = policy, maxAttempts = p.maxAttempts ?? Number.POSITIVE_INFINITY, budgetMs = p.budgetMs;
  const ceil = (attempt: number) => Math.min(p.maxMs, p.baseMs * p.factor ** (attempt - 1));

  /** n번째 재시도(1부터) 앞의 지터 포함 대기. */
  function backoffMs(attempt: number): number {
    return Math.round(ceil(attempt) * (p.minJitter + (1 - p.minJitter) * rand()));
  }

  return {
    backoffMs,
    /** 같은 요청을 자동으로 다시 보내도 되는 응답인가, 서버가 처리했는지 모르는 응답인가(재시도 분류의 유일한 정의, KF-09).
     * 두 질문은 다르다: 500은 자동 재시도하지 않지만(서버 버그로 본다) 처리 여부는 모른다(PUBLIC_API.md 125행). */
    classify(q: StatusQuery): StatusClass {
      if (!vStatusQuery(q)) throw new Error("StatusQuery 스키마 위반");
      const out: StatusClass = { retryable: RETRYABLE_STATUS.has(q.status) || (q.status === 409 && q.reason === TURN_IN_PROGRESS), outcomeUnknown: q.status >= 500 };
      if (!vStatusClass(out)) throw new Error("StatusClass 스키마 위반");
      return out;
    },
    /** 서버가 Retry-After를 주면 그보다 일찍 보내지 않는다(같은 값을 받은 키오스크가 몰리지 않게 위로만 지터를 더한다).
     * 예산을 넘겼거나 다음 대기까지 하면 넘는다면 포기한다(직원 호출). */
    decide(q: RetryQuery): RetryDecision {
      if (!vRetryQuery(q)) throw new Error("RetryQuery 스키마 위반");
      const b = backoffMs(q.attempt);
      const waitMs = q.retryAfterMs === null ? b : q.retryAfterMs + Math.round(rand() * ceil(q.attempt) * (1 - p.minJitter));
      const out: RetryDecision = q.attempt >= maxAttempts || q.elapsedMs + waitMs >= budgetMs ? { giveUp: true, waitMs } : { giveUp: false, waitMs };
      if (!vRetryDecision(out)) throw new Error("RetryDecision 스키마 위반");
      return out;
    },
  };
}
export type RetryPolicyPort = ReturnType<typeof createRetryPolicy>;
