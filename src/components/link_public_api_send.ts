// 통신 컴포넌트(보내는 쪽): 공개 API(I10, PUBLIC_API.md)를 부르는 클라이언트. HTTP는 이 파일에서만 한다(DESIGN.md 4절).
// 입력: 요청 입력 스키마(StartRequest, UtteranceRequest, SessionRequest, StaffCallRetryInput, StaffCallReportInput, InterventionRequest) -> 출력: 계약 응답 타입(FrontendInput, SessionState 등).
// 계약 타입 <-> 영역 타입 변환을 맡는다. 재시도 판단은 주입받은 retry_policy를 쓴다(컴포넌트끼리 import하지 않는다, 규칙 3).
// UI를 모른다. 세션 순서 큐, 응답 대기 타임아웃, 상태 코드 분기, 오류를 ApiFailure 데이터 모양으로 던진다.
import {
  InterventionRequest as vIntervention, SessionRequest as vSession, StaffCallReportInput as vReport, StaffCallRetryInput as vRetry,
  StartRequest as vStart, UtteranceRequest as vUtterance, FrontendBody as vFrontend, StartedBody as vStarted, SessionStateBody as vState,
  StaffAlertBody as vAlertBody, StaffCallRetryBody as vRetryBody, type ValidateFn,
} from "../types/validators.gen.cjs";
import type { BoundaryError } from "../types/BoundaryError.ts";
import type { FrontendInput } from "../types/FrontendInput.ts";
import type { PushConfig } from "../types/PushConfig.ts";
import type { SessionState } from "../types/SessionState.ts";
import type { StaffAlert } from "../types/StaffAlert.ts";
import type { StaffAlertPage } from "../types/StaffAlertPage.ts";
import type { StaffCallRetryResult } from "../types/StaffCallRetryResult.ts";
import type { StaffSessionView } from "../types/StaffSessionView.ts";

/** 재시도 판단 포트(입력·출력 스키마는 schemas/RetryQuery·RetryDecision·StatusQuery·StatusClass). wiring이 retry_policy의 함수를 넣는다. */
export interface RetryPolicyPort {
  classify(q: { status: number; reason: string | null }): { retryable: boolean; outcomeUnknown: boolean };
  decide(q: { attempt: number; retryAfterMs: number | null; elapsedMs: number }): { giveUp: boolean; waitMs: number };
}
type Decision = "RESUME" | "END";
type StaffCallOutcome = "STAFF_NOTIFIED_MANUALLY" | "NOT_NOTIFIED";
/** 세션 시작 응답: FrontendInput + 서버가 발급한 session_id(PUBLIC_API.md 원칙 절, 2.2.0). */
export type StartedSession = FrontendInput & { session_id: string };
export interface PushSubscriptionJson { endpoint: string; keys: { p256dh: string; auth: string }; [k: string]: unknown }

// ---- 오류(데이터 모양은 schemas/ApiFailure.json). 업무 컴포넌트는 클래스를 가져오지 않고 name과 필드만 읽는다.
/** 응답 본문이 비었거나 JSON이 아니거나 스키마에 맞지 않는다. 5xx와 같이 재시도한다. */
export class BadBodyError extends Error {
  constructor(what: string) { super(`응답 본문이 올바르지 않습니다: ${what}`); this.name = "BadBodyError"; }
}
/** 전송 계층 한도 응답(본문 크기 413, 요청 줄 414, 헤더 431; RFC 9110 15.5.14·15.5.15, RFC 6585 5). */
const TRANSPORT_LIMIT_STATUS: ReadonlySet<number> = new Set([413, 414, 431]);
/** 서버가 응답했으나 재시도로 해결되지 않는 오류(400/401/403/404/409 등). */
export class ApiError extends Error {
  status: number;
  body: BoundaryError | null;
  /** Retry-After(초)를 밀리초로. 없으면 null. */
  retryAfterMs: number | null;
  /** 오류 본문 `details.reason`(PUBLIC_API.md 409·429 행). 없거나 문자열이 아니면 null. 호출자는 본문 모양을 직접 읽지 않고 이 값을 쓴다(KF-09). */
  reason: string | null;
  /** 오류 종류. 본문의 BoundaryError.code. 413·414·431은 HTTP 서버가 앱 전에 내 본문이 JSON이 아닐 수 있으므로 본문과 무관하게 INVALID_RECORD(계약 CONVENTIONS 9절, 2.2.2). */
  code: string | null;
  /** 401·403 = 인증 거부. 상태 코드 해석(PUBLIC_API.md)은 이 링크 한 곳에서 하고 업무 컴포넌트·화면은 이 값을 읽는다. */
  auth: boolean;
  constructor(status: number, body: BoundaryError | null, retryAfterMs: number | null = null) {
    super(`API ${status}${body ? " " + body.code : ""}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.retryAfterMs = retryAfterMs;
    this.auth = status === 401 || status === 403;
    this.code = TRANSPORT_LIMIT_STATUS.has(status) ? "INVALID_RECORD" : (typeof body?.code === "string" ? body.code : null);
    const r = (body?.details as { reason?: unknown } | null | undefined)?.reason;
    this.reason = typeof r === "string" ? r : null;
  }
}
/** 재시도를 모두 썼다. 직원 호출 화면을 보여야 한다. */
export class CallStaffError extends Error {
  attempts: number;
  lastCause: unknown;
  constructor(attempts: number, lastCause: unknown) {
    super(`요청이 ${attempts}회 실패했습니다`);
    this.name = "CallStaffError";
    this.attempts = attempts;
    this.lastCause = lastCause;
  }
}
/** 호출자(환자의 직원 호출·그만하기)가 요청을 끊었다. 재시도하지 않는다. */
export class AbortedError extends Error {
  constructor() { super("요청이 취소되었습니다"); this.name = "AbortedError"; }
}

/** 입력 스키마 검증 하나로 거부한다(코드 안에 따로 거부 조건을 두지 않는다, DESIGN.md 5절). */
function accept(v: ValidateFn, what: string, data: unknown): void {
  if (!v(data)) throw new Error(`${what} 스키마 위반: ${(v.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`).join("; ")}`);
}
/** 응답 본문 검증기를 call()의 validate 인자 모양으로 바꾼다. 어기면 BadBodyError -> 일시 장애와 같이 재시도(FAULT_POLICY 원칙 10). */
const body = (v: ValidateFn, what: string) => (r: unknown) => { if (!v(r)) throw new BadBodyError(what); };

export interface ClientOptions {
  /** 같은 출처의 /v1. 직원 콘솔은 게이트웨이가 직원 인증을 붙인다. */
  baseUrl?: string;
  /** 키오스크 기기 토큰(메모리 값). 있으면 /sessions* 요청에만 Authorization: Bearer로 보낸다. 직원 경로에는 보내지 않는다. */
  deviceToken?: () => string | null;
  fetch?: typeof fetch;
  timeoutMs?: number; // 기본 12초(config.ts REQUEST_TIMEOUT_MS와 같은 값, 사용자 결정 2026-10-30)
  /** 재시도 판단(components/retry_policy.ts). wiring이 넣는다. */
  retryPolicy: RetryPolicyPort;
  /** 턴 ID 발급(wiring). 호출자가 주지 않은 발화·개입에 쓴다. */
  newTurnId: () => string;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
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
  private retryPolicy: RetryPolicyPort;
  private newTurnId: () => string;
  private now: () => number;
  private sleep: (ms: number) => Promise<void>;
  private deviceToken: () => string | null;
  private queues = new Map<string, Promise<unknown>>();

  constructor(o: ClientOptions) {
    this.f = o.fetch ?? ((...a) => globalThis.fetch(...a));
    this.deviceToken = o.deviceToken ?? (() => null);
    this.base = (o.baseUrl ?? "/v1").replace(/\/$/, "");
    this.timeoutMs = o.timeoutMs ?? 12_000;
    this.retryPolicy = o.retryPolicy;
    this.newTurnId = o.newTurnId;
    this.now = o.now ?? (() => Date.now());
    this.sleep = o.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  }

  /** subjectRef가 있으면 본문에 넣는다(없으면 필드 생략). 형식이 틀리면 보내지 않는다. */
  startSession(subjectRef?: string | null, co: CallOptions = {}): Promise<StartedSession> {
    accept(vStart, "StartRequest", subjectRef === undefined || subjectRef === null ? {} : { subject_ref: subjectRef });
    const req: { kind: "SESSION_START"; subject_ref?: string } = { kind: "SESSION_START" }; // 세션 ID는 서버가 발급해 응답에 싣는다(2.2.0, D106)
    if (subjectRef !== undefined && subjectRef !== null) req.subject_ref = subjectRef;
    // 아직 ID가 없으므로 세션별 직렬 큐에 넣지 않는다(이후 요청부터 응답의 ID로 큐가 생긴다).
    return this.call<StartedSession>("POST", `/sessions`, req, true, co, body(vStarted, "StartedBody"));
  }

  /** turnId를 주면 그 ID로 보낸다(재시도 모두 같은 ID). 빈 발화는 보내지 않는다. */
  sendUtterance(sessionId: string, utterance: string, turnId: string = this.newTurnId(), co: CallOptions = {}): Promise<FrontendInput> {
    accept(vUtterance, "UtteranceRequest", { session_id: sessionId, utterance, turn_id: turnId }); // 빈 발화·잘못된 ID는 보내지 않는다
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
    accept(vSession, "SessionRequest", { session_id: sessionId });
    return this.serial(sessionId, () =>
      this.post(`/sessions/${sessionId}/end`, { session_id: sessionId, kind: "SESSION_END" }, co),
    );
  }

  /** 위험 정지 중 키오스크가 2초 간격으로 폴링한다. */
  getSessionState(sessionId: string, co: CallOptions = {}): Promise<SessionState> {
    accept(vSession, "SessionRequest", { session_id: sessionId });
    return this.call("GET", `/sessions/${sessionId}/state`, undefined, true, co, body(vState, "SessionStateBody"));
  }
  /**
   * 직원 호출 재알림(2.1.0, PUBLIC_API.md G절). single: 429는 '너무 일찍 눌렀다/상한'이라는 답이지 일시 장애가 아니므로 자동 재시도하지 않는다(환자 화면의 카운트다운이 대신한다).
   * 같은 turnId 재전송은 서버가 같은 응답을 주므로(멱등) 응답 없이 실패했으면 호출자가 같은 turnId로 다시 보낸다.
   */
  staffCallRetry(sessionId: string, turnId: string, co: CallOptions = {}): Promise<StaffCallRetryResult> {
    accept(vRetry, "StaffCallRetryInput", { session_id: sessionId, turn_id: turnId });
    return this.serial(sessionId, () => this.call<StaffCallRetryResult>("POST", `/sessions/${sessionId}/staff-call/retry`, { turn_id: turnId }, false, { ...co, single: true }, body(vRetryBody, "StaffCallRetryBody")));
  }
  /** 환자가 직접 알렸는지(2.1.0 G절)를 서버에 남긴다. 자유 문장 없음. */
  staffCallReport(sessionId: string, outcome: StaffCallOutcome, turnId: string, co: CallOptions = {}): Promise<StaffAlert> {
    accept(vReport, "StaffCallReportInput", { session_id: sessionId, outcome, turn_id: turnId });
    return this.serial(sessionId, () => this.call<StaffAlert>("POST", `/sessions/${sessionId}/staff-call/report`, { outcome, turn_id: turnId }, false, { ...co, single: true }, body(vAlertBody, "StaffAlertBody")));
  }
  /** vapid_public_key가 null이면 푸시는 꺼져 있고 SSE만 동작한다. */
  getPushConfig(): Promise<PushConfig> {
    return this.request("GET", `/staff/push-config`);
  }

  intervene(sessionId: string, decision: Decision, turnId: string): Promise<FrontendInput> {
    accept(vIntervention, "InterventionRequest", { session_id: sessionId, decision, turn_id: turnId });
    return this.serial(sessionId, () =>
      this.post(`/sessions/${sessionId}/intervention`, { session_id: sessionId, decision, turn_id: turnId }),
    );
  }

  /** 재시도 정책을 같이 쓰는 일반 요청(직원 콘솔의 GET/POST/DELETE). */
  request<T>(method: string, path: string, reqBody?: unknown, retry = true): Promise<T> {
    return this.call<T>(method, path, reqBody, retry, {});
  }

  // ---- 직원 콘솔 REST(공개 API /v1/staff/*). 실시간 스트림은 link_staff_stream_receive가 맡는다. ----
  listAlerts(status: "OPEN" | "RESOLVED", limit = 50, cursor?: string): Promise<StaffAlertPage> {
    const c = cursor ? `&cursor=${encodeURIComponent(cursor)}` : "";
    return this.request("GET", `/staff/alerts?status=${status}&limit=${limit}${c}`);
  }
  /** 세션 기록(읽기 전용). 404는 ApiError(status 404)로 올라온다. */
  getSession(sessionId: string): Promise<StaffSessionView> {
    return this.request("GET", `/staff/sessions/${encodeURIComponent(sessionId)}`);
  }
  registerPush(sub: PushSubscriptionJson): Promise<void> {
    return this.request("POST", `/staff/push-subscriptions`, sub);
  }
  unregisterPush(endpoint: string): Promise<void> {
    // 푸시 엔드포인트 URL은 그 자체가 푸시 권한을 주는 값이라 URL(쿼리 문자열은 서버·게이트웨이 로그에 남는다)에 싣지 않고 본문으로 보낸다
    // (계약 2.2.0 `POST /v1/staff/push-subscriptions/unsubscribe`, 표준성 점검 #42, CR-006). 옛 `DELETE ?endpoint=`로 되돌아가지 않는다.
    return this.request("POST", `/staff/push-subscriptions/unsubscribe`, { endpoint });
  }

  // ---- 내부 ----

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

  private post(path: string, reqBody: unknown, co: CallOptions = {}): Promise<FrontendInput> {
    return this.call<FrontendInput>("POST", path, reqBody, true, co, body(vFrontend, "FrontendBody"));
  }

  /** 일시 장애(429·502·503·504·네트워크 오류·무응답, 409 details.reason=TURN_IN_PROGRESS)는 같은 요청 그대로 지수 백오프로 재시도하고,
   * 총 예산을 넘으면 CallStaffError. 그 밖의 오류는 바로 던진다. */
  private async call<T>(method: string, path: string, reqBody: unknown, retry: boolean, co: CallOptions, validate?: (v: unknown) => void): Promise<T> {
    const start = this.now();
    let last: unknown;
    for (let i = 1; ; i++) {
      if (co.signal?.aborted) throw new AbortedError();
      try {
        const r = await this.once<T>(method, path, reqBody, co.signal);
        validate?.(r); // 본문이 계약에 맞지 않으면 BadBodyError -> 아래에서 일시 장애와 같이 재시도
        return r;
      } catch (e) {
        if (e instanceof AbortedError) throw e;
        if (co.single) throw e;
        if (e instanceof ApiError && !this.retryPolicy.classify({ status: e.status, reason: e.reason }).retryable) throw e;
        last = e;
        // 예산을 넘겼거나 다음 대기까지 하면 넘는다면 더 기다리지 않고 직원 호출로 넘긴다(판단은 retry_policy).
        const d = this.retryPolicy.decide({ attempt: i, retryAfterMs: e instanceof ApiError ? e.retryAfterMs : null, elapsedMs: this.now() - start });
        if (!retry || d.giveUp) throw new CallStaffError(i, last);
        co.onRetry?.({ attempt: i, waitMs: d.waitMs, status: e instanceof ApiError ? e.status : null });
        await this.sleepAbortable(d.waitMs, co.signal);
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

  private async once<T>(method: string, path: string, reqBody: unknown, outer?: AbortSignal): Promise<T> {
    const ctl = new AbortController();
    const onOuter = () => ctl.abort();
    outer?.addEventListener("abort", onOuter, { once: true });
    const timer = setTimeout(() => ctl.abort(), this.timeoutMs);
    try {
      const headers: Record<string, string> = reqBody === undefined ? { accept: "application/json" } : { "content-type": "application/json", accept: "application/json" };
      const token = /^\/sessions(\/|$)/.test(path) ? this.deviceToken() : null;
      if (token) headers.authorization = `Bearer ${token}`;
      const res = await this.f(this.base + path, {
        method,
        headers,
        body: reqBody === undefined ? undefined : JSON.stringify(reqBody),
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
