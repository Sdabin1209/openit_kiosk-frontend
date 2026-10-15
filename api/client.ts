import { ApiError, CallStaffError } from "./errors.ts";
import { isValidSessionId, newTurnId } from "./ids.ts";
import type { BoundaryError, Decision, FrontendInput } from "./types.ts";

export interface ClientOptions {
  /** 같은 출처의 /v1. 인증은 게이트웨이가 붙이므로 토큰 옵션은 없다. */
  baseUrl?: string;
  fetch?: typeof fetch;
  timeoutMs?: number; // 기본 10초
  maxAttempts?: number; // 기본 3
  retryDelayMs?: number; // 시도 사이 대기
  sleep?: (ms: number) => Promise<void>;
}

const RETRYABLE_STATUS = new Set([429, 503]);

export class PublicApiClient {
  private f: typeof fetch;
  private base: string;
  private timeoutMs: number;
  private maxAttempts: number;
  private retryDelayMs: number;
  private sleep: (ms: number) => Promise<void>;
  private queues = new Map<string, Promise<unknown>>();

  constructor(o: ClientOptions = {}) {
    this.f = o.fetch ?? ((...a) => globalThis.fetch(...a));
    this.base = (o.baseUrl ?? "/v1").replace(/\/$/, "");
    this.timeoutMs = o.timeoutMs ?? 10_000;
    this.maxAttempts = o.maxAttempts ?? 3;
    this.retryDelayMs = o.retryDelayMs ?? 500;
    this.sleep = o.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  }

  startSession(sessionId: string): Promise<FrontendInput> {
    this.check(sessionId);
    return this.serial(sessionId, () =>
      this.post(`/sessions`, { session_id: sessionId, kind: "SESSION_START" }),
    );
  }

  /** turnId를 주면 그 ID로 보낸다(재시도 모두 같은 ID). 빈 발화는 보내지 않는다. */
  sendUtterance(sessionId: string, utterance: string, turnId: string = newTurnId()): Promise<FrontendInput> {
    this.check(sessionId);
    if (utterance.trim() === "") throw new Error("빈 발화는 서버로 보내지 않는다");
    return this.serial(sessionId, () =>
      this.post(`/sessions/${sessionId}/turns`, {
        session_id: sessionId,
        kind: "UTTERANCE",
        utterance,
        turn_id: turnId,
      }),
    );
  }

  endSession(sessionId: string): Promise<FrontendInput> {
    this.check(sessionId);
    return this.serial(sessionId, () =>
      this.post(`/sessions/${sessionId}/end`, { session_id: sessionId, kind: "SESSION_END" }),
    );
  }

  /** 직원 콘솔 전용 호출은 api/staff.ts가 이 메서드를 쓴다. */
  intervene(sessionId: string, decision: Decision, turnId: string): Promise<FrontendInput> {
    this.check(sessionId);
    return this.serial(sessionId, () =>
      this.post(`/sessions/${sessionId}/intervention`, { session_id: sessionId, decision, turn_id: turnId }),
    );
  }

  /** 재시도 정책을 같이 쓰는 일반 요청(직원 콘솔의 GET/POST/DELETE). */
  request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
    return this.call<T>(method, path, body, retry ? this.maxAttempts : 1);
  }

  // ---- 내부 ----
  private check(id: string) {
    if (!isValidSessionId(id)) throw new Error("session_id 형식 오류(1~64자 영문·숫자·-_)");
  }

  /** 한 세션의 요청은 하나씩 순서대로. */
  private serial<T>(sessionId: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.queues.get(sessionId) ?? Promise.resolve();
    const next = prev.catch(() => undefined).then(fn);
    this.queues.set(sessionId, next);
    next.catch(() => undefined).then(() => {
      if (this.queues.get(sessionId) === next) this.queues.delete(sessionId);
    });
    return next;
  }

  private post(path: string, body: unknown): Promise<FrontendInput> {
    return this.call<FrontendInput>("POST", path, body, this.maxAttempts);
  }

  private async call<T>(method: string, path: string, body: unknown, attempts: number): Promise<T> {
    let last: unknown;
    for (let i = 1; i <= attempts; i++) {
      try {
        return await this.once<T>(method, path, body);
      } catch (e) {
        if (e instanceof ApiError && !RETRYABLE_STATUS.has(e.status)) throw e;
        last = e;
        if (i < attempts) await this.sleep(this.retryDelayMs);
      }
    }
    throw new CallStaffError(attempts, last);
  }

  private async once<T>(method: string, path: string, body: unknown): Promise<T> {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), this.timeoutMs);
    try {
      const res = await this.f(this.base + path, {
        method,
        headers: body === undefined ? { accept: "application/json" } : { "content-type": "application/json", accept: "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ctl.signal,
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) {
        let err: BoundaryError | null = null;
        try { err = (await res.json()) as BoundaryError; } catch { /* 본문 없음 */ }
        throw new ApiError(res.status, err);
      }
      if (res.status === 204) return undefined as T;
      const text = await res.text();
      return (text ? JSON.parse(text) : undefined) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}
