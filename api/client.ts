import { AbortedError, ApiError, CallStaffError } from "./errors.ts";
import { isValidSessionId, newTurnId } from "./ids.ts";
import { isValidSubjectRef } from "./device.ts";
import { validateSessionStarted, validateFrontendInput, validateSessionState, validateStaffAlertBody, validateStaffCallRetryResult } from "./validate.ts";
import { DEFAULT_RETRY, isRetryable, waitMs, type RetryPolicy } from "./retry.ts";
import type { BoundaryError, Decision, FrontendInput, PushConfig, SessionStart, SessionState, StartedSession, StaffAlert, StaffCallOutcome, StaffCallRetryResult } from "./types.ts";

export interface ClientOptions {
  /** 같은 출처의 /v1. 직원 콘솔은 게이트웨이가 직원 인증을 붙인다. */
  baseUrl?: string;
  /** 키오스크 기기 토큰(메모리 값). 있으면 /sessions* 요청에만 Authorization: Bearer로 보낸다. 직원 경로에는 보내지 않는다. */
  deviceToken?: () => string | null;
  fetch?: typeof fetch;
  timeoutMs?: number; // 기본 10초
  /** 재시도 정책(api/retry.ts). 일부만 덮어쓸 수 있다. */
  retry?: Partial<RetryPolicy>;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  rand?: () => number;
}

/** 호출마다 붙이는 선택 사항. 키오스크가 대기 표시와 직원 호출·그만하기에 쓴다. */
export interface CallOptions {
  signal?: AbortSignal;
  /** true면 한 번만 보내고 어떤 오류도 그대로 던진다(자동 재시도·CallStaffError 변환 없음). 재알림처럼 429(간격/상한)의 의미를 호출자가 직접 다뤄야 하는 호출용. */
  single?: boolean;
  /** 재시도하기 직전에 부른다(대기 화면 표시용). */
  onRetry?: (info: { attempt: number; waitMs: number; status: number | null }) => void;
}

export class PublicApiClient {
  private f: typeof fetch;
  private base: string;
  private timeoutMs: number;
  private policy: RetryPolicy;
  private now: () => number;
  private rand: () => number;
  private sleep: (ms: number) => Promise<void>;
  private deviceToken: () => string | null;
  private queues = new Map<string, Promise<unknown>>();

  constructor(o: ClientOptions = {}) {
    this.f = o.fetch ?? ((...a) => globalThis.fetch(...a));
    this.deviceToken = o.deviceToken ?? (() => null);
    this.base = (o.baseUrl ?? "/v1").replace(/\/$/, "");
    this.timeoutMs = o.timeoutMs ?? 10_000;
    this.policy = { ...DEFAULT_RETRY, ...o.retry };
    this.now = o.now ?? (() => Date.now());
    this.rand = o.rand ?? Math.random;
    this.sleep = o.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  }

  /** subjectRef가 있으면 본문에 넣는다(없으면 필드 생략). 형식이 틀리면 보내지 않는다. */
  startSession(subjectRef?: string | null, co: CallOptions = {}): Promise<StartedSession> {
    const body: SessionStart = { kind: "SESSION_START" }; // 세션 ID는 서버가 발급해 응답에 싣는다(2.2.0, D106)
    if (subjectRef !== undefined && subjectRef !== null) {
      if (!isValidSubjectRef(subjectRef)) throw new Error("subject_ref 형식 오류(1~128자 [A-Za-z0-9._:/#=+-])");
      body.subject_ref = subjectRef;
    }
    // 아직 ID가 없으므로 세션별 직렬 큐에 넣지 않는다(이후 요청부터 응답의 ID로 큐가 생긴다).
    return this.call<StartedSession>("POST", `/sessions`, body, true, co, validateSessionStarted);
  }

  /** turnId를 주면 그 ID로 보낸다(재시도 모두 같은 ID). 빈 발화는 보내지 않는다. */
  sendUtterance(sessionId: string, utterance: string, turnId: string = newTurnId(), co: CallOptions = {}): Promise<FrontendInput> {
    this.check(sessionId);
    if (utterance.trim() === "") throw new Error("빈 발화는 서버로 보내지 않는다");
    return this.serial(sessionId, () =>
      this.post(`/sessions/${sessionId}/turns`, {
        session_id: sessionId,
        kind: "UTTERANCE",
        utterance,
        turn_id: turnId,
      }, co),
    );
  }

  endSession(sessionId: string, co: CallOptions = {}): Promise<FrontendInput> {
    this.check(sessionId);
    return this.serial(sessionId, () =>
      this.post(`/sessions/${sessionId}/end`, { session_id: sessionId, kind: "SESSION_END" }, co),
    );
  }

  /** 위험 정지 중 키오스크가 2초 간격으로 폴링한다. */
  getSessionState(sessionId: string, co: CallOptions = {}): Promise<SessionState> {
    this.check(sessionId);
    return this.call("GET", `/sessions/${sessionId}/state`, undefined, true, co, validateSessionState);
  }
  /**
   * 직원 호출 재알림(2.1.0, PUBLIC_API.md G절). single: 429는 '너무 일찍 눌렀다/상한'이라는 답이지 일시 장애가 아니므로 자동 재시도하지 않는다(환자 화면의 카운트다운이 대신한다).
   * 같은 turnId 재전송은 서버가 같은 응답을 주므로(멱등) 응답 없이 실패했으면 호출자가 같은 turnId로 다시 보낸다.
   */
  staffCallRetry(sessionId: string, turnId: string, co: CallOptions = {}): Promise<StaffCallRetryResult> {
    this.check(sessionId);
    return this.serial(sessionId, () => this.call<StaffCallRetryResult>("POST", `/sessions/${sessionId}/staff-call/retry`, { turn_id: turnId }, false, { ...co, single: true }, validateStaffCallRetryResult));
  }
  /** 환자가 직접 알렸는지(2.1.0 G절)를 서버에 남긴다. 자유 문장 없음. */
  staffCallReport(sessionId: string, outcome: StaffCallOutcome, turnId: string, co: CallOptions = {}): Promise<StaffAlert> {
    this.check(sessionId);
    return this.serial(sessionId, () => this.call<StaffAlert>("POST", `/sessions/${sessionId}/staff-call/report`, { outcome, turn_id: turnId }, false, { ...co, single: true }, validateStaffAlertBody));
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
    return this.call<T>(method, path, body, retry, {});
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

  private post(path: string, body: unknown, co: CallOptions = {}): Promise<FrontendInput> {
    return this.call<FrontendInput>("POST", path, body, true, co, validateFrontendInput);
  }

  /** 일시 장애(429·502·503·504·네트워크 오류·무응답, 409 details.reason=TURN_IN_PROGRESS)는 같은 요청 그대로 지수 백오프로 재시도하고,
   * 총 예산을 넘으면 CallStaffError. 그 밖의 오류는 바로 던진다. */
  private async call<T>(method: string, path: string, body: unknown, retry: boolean, co: CallOptions, validate?: (v: unknown) => void): Promise<T> {
    const p = this.policy, start = this.now();
    const maxAttempts = retry ? p.maxAttempts : 1;
    let last: unknown;
    for (let i = 1; ; i++) {
      if (co.signal?.aborted) throw new AbortedError();
      try {
        const r = await this.once<T>(method, path, body, co.signal);
        validate?.(r); // 본문이 계약에 맞지 않으면 BadBodyError -> 아래에서 일시 장애와 같이 재시도
        return r;
      } catch (e) {
        if (e instanceof AbortedError) throw e;
        if (co.single) throw e;
        if (e instanceof ApiError && !isRetryable(e.status, e.reason)) throw e;
        last = e;
        const wait = waitMs(i, e instanceof ApiError ? e.retryAfterMs : null, p, this.rand);
        // 예산을 넘겼거나 다음 대기까지 하면 넘는다면 더 기다리지 않고 직원 호출로 넘긴다.
        if (i >= maxAttempts || this.now() - start + wait >= p.budgetMs) throw new CallStaffError(i, last);
        co.onRetry?.({ attempt: i, waitMs: wait, status: e instanceof ApiError ? e.status : null });
        await this.sleepAbortable(wait, co.signal);
      }
    }
  }

  private sleepAbortable(ms: number, signal?: AbortSignal): Promise<void> {
    if (!signal) return this.sleep(ms);
    return new Promise<void>((resolve, reject) => {
      const onAbort = () => reject(new AbortedError());
      if (signal.aborted) return onAbort();
      signal.addEventListener("abort", onAbort, { once: true });
      this.sleep(ms).then(() => { signal.removeEventListener("abort", onAbort); resolve(); }, reject);
    });
  }

  private async once<T>(method: string, path: string, body: unknown, outer?: AbortSignal): Promise<T> {
    const ctl = new AbortController();
    const onOuter = () => ctl.abort();
    outer?.addEventListener("abort", onOuter, { once: true });
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
    } catch (e) {
      if (outer?.aborted) throw new AbortedError();
      throw e;
    } finally {
      outer?.removeEventListener("abort", onOuter);
      clearTimeout(timer);
    }
  }
}
