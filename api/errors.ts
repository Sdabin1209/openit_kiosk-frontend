import type { BoundaryError } from "./types.ts";

/** 전송 계층 한도 응답(본문 크기 413, 요청 줄 414, 헤더 431; RFC 9110 15.5.14·15.5.15, RFC 6585 5). */
const TRANSPORT_LIMIT_STATUS: ReadonlySet<number> = new Set([413, 414, 431]);

/** 서버가 응답했으나 재시도로 해결되지 않는 오류(400/401/403/404/409 등). */
export class ApiError extends Error {
  status: number;
  body: BoundaryError | null;
  /** Retry-After(초)를 밀리초로. 없으면 null. */
  retryAfterMs: number | null;
  /** 오류 본문 `details.reason`(PUBLIC_API.md 409·429 행)을 해석한 값. 없거나 문자열이 아니면 null. 호출자는 본문 모양을 직접 읽지 않고 이 값을 쓴다(KF-09). */
  reason: string | null;
  /** 오류 종류. 본문의 BoundaryError.code. 413·414·431은 HTTP 서버가 앱 전에 내 본문이 JSON이 아닐 수 있으므로 본문과 무관하게 INVALID_RECORD(계약 CONVENTIONS 9절, 2.2.2). 알 수 없으면 null. */
  code: string | null;
  constructor(status: number, body: BoundaryError | null, retryAfterMs: number | null = null) {
    super(`API ${status}${body ? " " + body.code : ""}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.retryAfterMs = retryAfterMs;
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
