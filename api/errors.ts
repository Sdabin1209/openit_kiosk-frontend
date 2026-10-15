import type { BoundaryError } from "./types.ts";

/** 서버가 응답했으나 재시도로 해결되지 않는 오류(400/401/403/404/409 등). */
export class ApiError extends Error {
  status: number;
  body: BoundaryError | null;
  /** Retry-After(초)를 밀리초로. 없으면 null. */
  retryAfterMs: number | null;
  constructor(status: number, body: BoundaryError | null, retryAfterMs: number | null = null) {
    super(`API ${status}${body ? " " + body.code : ""}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.retryAfterMs = retryAfterMs;
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
