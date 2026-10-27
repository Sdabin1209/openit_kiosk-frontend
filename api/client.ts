import { ApiError, CallStaffError } from "./errors.ts";
import { isValidSessionId, newTurnId } from "./ids.ts";
import { isValidSubjectRef } from "./device.ts";
import type { BoundaryError, Decision, FrontendInput, PushConfig, SessionStart, SessionState } from "./types.ts";

export interface ClientOptions {
  /** 같은 출처의 /v1. 직원 콘솔은 게이트웨이가 직원 인증을 붙인다. */
  baseUrl?: string;
  /** 키오스크 기기 토큰(메모리 값). 있으면 /sessions* 요청에만 Authorization: Bearer로 보낸다. 직원 경로에는 보내지 않는다. */
  deviceToken?: () => string | null;
  fetch?: typeof fetch;
  timeoutMs?: number; // 기본 10초
  maxAttempts?: number; // 기본 3
  retryDelayMs?: number; // 무응답·네트워크 오류 뒤 대기(기본 0.5초)
  defaultRetryAfterMs?: number; // 429·503에 Retry-After가 없을 때(기본 1초)
  sleep?: (ms: number) => Promise<void>;
}

const RETRYABLE_STATUS = new Set([429, 503]);

export class PublicApiClient {
  private f: typeof fetch;
  private base: string;
  private timeoutMs: number;
  private maxAttempts: number;
  private retryDelayMs: number;
  private defaultRetryAfterMs: number;
  private sleep: (ms: number) => Promise<void>;
  private deviceToken: () => string | null;
  private queues = new Map<string, Promise<unknown>>();

  constructor(o: ClientOptions = {}) {
    this.f = o.fetch ?? ((...a) => globalThis.fetch(...a));
    this.deviceToken = o.deviceToken ?? (() => null);
    this.base = (o.baseUrl ?? "/v1").replace(/\/$/, "");
    this.timeoutMs = o.timeoutMs ?? 10_000;
    this.maxAttempts = o.maxAttempts ?? 3;
    this.retryDelayMs = o.retryDelayMs ?? 500;
    this.defaultRetryAfterMs = o.defaultRetryAfterMs ?? 1000;
    this.sleep = o.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  }

  /** subjectRef가 있으면 본문에 넣는다(없으면 필드 생략). 형식이 틀리면 보내지 않는다. */
  startSession(sessionId: string, subjectRef?: string | null): Promise<FrontendInput> {
    this.check(sessionId);
    const body: SessionStart = { session_id: sessionId, kind: "SESSION_START" };
    if (subjectRef !== undefined && subjectRef !== null) {
      if (!isValidSubjectRef(subjectRef)) throw new Error("subject_ref 형식 오류(1~128자 [A-Za-z0-9._:/#=+-])");
      body.subject_ref = subjectRef;
    }
    return this.serial(sessionId, () => this.post(`/sessions`, body));
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

  /** 위험 정지 중 키오스크가 2초 간격으로 폴링한다. */
  getSessionState(sessionId: string): Promise<SessionState> {
    this.check(sessionId);
    return this.request("GET", `/sessions/${sessionId}/state`);
  }
  getPushConfig(): Promise<PushConfig> {
    return this.request("GET", `/staff/push-config`);
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
        if (i < attempts) {
          // 429·503은 Retry-After(초)를 따르고 없으면 1초. 무응답·네트워크 오류는 짧게 쉰다.
          const wait = e instanceof ApiError ? (e.retryAfterMs ?? this.defaultRetryAfterMs) : this.retryDelayMs;
          await this.sleep(wait);
        }
      }
    }
    throw new CallStaffError(attempts, last);
  }

  private async once<T>(method: string, path: string, body: unknown): Promise<T> {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), this.timeoutMs);
    try {
      const headers: Record<string, string> = body === undefined ? { accept: "application/json" } : { "content-type": "application/json", accept: "application/json" };
      const token = /^\/sessions(\/|$)/.test(path) ? this.deviceToken() : null;
      if (token) headers.authorization = `Bearer ${token}`;
      const res = await this.f(this.base + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ctl.signal,
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) {
        let err: BoundaryError | null = null;
        try { err = (await res.json()) as BoundaryError; } catch { /* 본문 없음 */ }
        const ra = Number(res.headers.get("retry-after"));
        const retryAfterMs = Number.isInteger(ra) && ra >= 0 && res.headers.get("retry-after") ? ra * 1000 : null;
        throw new ApiError(res.status, err, retryAfterMs);
      }
      if (res.status === 204) return undefined as T;
      const text = await res.text();
      return (text ? JSON.parse(text) : undefined) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}
