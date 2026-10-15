// 키오스크 상태 기계. UI를 모른다. 화면은 subscribe로 상태를 받아 그린다.
import { ApiError, CallStaffError } from "../../api/errors.ts";
import { newSessionId, newTurnId } from "../../api/ids.ts";
import type { PublicApiClient } from "../../api/client.ts";
import type { FrontendInput } from "../../api/types.ts";
import { isUsableTranscript, type SttResult } from "./stt.ts";

export type KioskState =
  | "IDLE" | "STARTING" | "LISTENING" | "REPEAT_PROMPT" | "SENDING"
  | "WAITING_STAFF" | "CALL_STAFF" | "ENDING" | "ENDED";

export type CallStaffReason = "RETRY_EXHAUSTED" | "DELIVERY_FAILED" | "AUTH" | "START_FAILED";
export type RepeatReason = "EMPTY_STT" | "NOT_COMMITTED";

export interface KioskView {
  state: KioskState;
  text: string | null; // 화면에 보일 응답 문장(메모리에만 둔다)
  callStaffReason?: CallStaffReason;
  repeatReason?: RepeatReason;
}

export class KioskFlow {
  private view: KioskView = { state: "IDLE", text: null };
  private listeners = new Set<(v: KioskView) => void>();
  private sessionId: string | null = null;
  private pendingTurnId: string | null = null; // 실패한 같은 발화를 다시 보낼 때 재사용
  private pendingUtterance: string | null = null;

  private api: PublicApiClient;
  constructor(api: PublicApiClient) { this.api = api; }

  get current(): KioskView { return this.view; }
  get session(): string | null { return this.sessionId; }
  subscribe(fn: (v: KioskView) => void): () => void {
    this.listeners.add(fn); fn(this.view);
    return () => this.listeners.delete(fn);
  }
  private set(v: KioskView) { this.view = v; for (const l of this.listeners) l(v); }

  async start(): Promise<void> {
    if (this.view.state !== "IDLE") return;
    this.sessionId = newSessionId();
    this.pendingTurnId = this.pendingUtterance = null;
    this.set({ state: "STARTING", text: null });
    try {
      const r = await this.api.startSession(this.sessionId);
      this.handle(r);
    } catch (e) {
      this.fail(e, "START_FAILED");
    }
  }

  /** STT 결과(또는 화면 입력)를 받는다. 쓸 수 없으면 서버로 보내지 않는다. */
  async hear(r: SttResult | null): Promise<void> {
    const s = this.view.state;
    if (s !== "LISTENING" && s !== "WAITING_STAFF" && s !== "REPEAT_PROMPT") return;
    if (!isUsableTranscript(r)) {
      this.set({ state: "REPEAT_PROMPT", text: null, repeatReason: "EMPTY_STT" });
      return;
    }
    const text = r!.text.trim();
    // 직전 발화가 응답 없이 실패해 같은 발화를 다시 보내는 경우만 같은 turn_id를 쓴다.
    const turnId = this.pendingUtterance === text && this.pendingTurnId ? this.pendingTurnId : newTurnId();
    this.pendingTurnId = turnId; this.pendingUtterance = text;
    this.set({ state: "SENDING", text: null });
    try {
      const resp = await this.api.sendUtterance(this.sessionId!, text, turnId);
      this.pendingTurnId = this.pendingUtterance = null; // 발화는 메모리에도 남기지 않는다
      this.handle(resp);
    } catch (e) {
      this.fail(e, "RETRY_EXHAUSTED");
    }
  }

  async end(): Promise<void> {
    if (!this.sessionId || this.view.state === "IDLE" || this.view.state === "ENDED") return;
    this.set({ state: "ENDING", text: null });
    try { await this.api.endSession(this.sessionId); } catch { /* 종료 실패는 화면을 막지 않는다 */ }
    this.sessionId = null; this.pendingTurnId = this.pendingUtterance = null;
    this.set({ state: "ENDED", text: null });
  }

  reset(): void {
    this.sessionId = null; this.pendingTurnId = this.pendingUtterance = null;
    this.set({ state: "IDLE", text: null });
  }

  /** 서버 응답 처리: 직원 호출 실패가 가장 우선. */
  private handle(r: FrontendInput): void {
    const sig = r.turn_failure_signal;
    if (sig?.staff_alert === "DELIVERY_FAILED") {
      return this.set({ state: "CALL_STAFF", text: r.response_text, callStaffReason: "DELIVERY_FAILED" });
    }
    if (sig?.staff_alert === "DELIVERED") {
      return this.set({ state: "WAITING_STAFF", text: r.response_text });
    }
    if (sig?.write_committed === "NOT_COMMITTED") {
      return this.set({ state: "REPEAT_PROMPT", text: r.response_text, repeatReason: "NOT_COMMITTED" });
    }
    this.set({ state: "LISTENING", text: r.response_text });
  }

  private fail(e: unknown, dflt: CallStaffReason): void {
    if (e instanceof ApiError) {
      if (e.status === 409) return this.set({ state: "WAITING_STAFF", text: null }); // 위험 정지 중
      if (e.status === 404) { this.sessionId = null; return this.set({ state: "IDLE", text: null }); } // 세션 만료
      if (e.status === 401 || e.status === 403) return this.set({ state: "CALL_STAFF", text: null, callStaffReason: "AUTH" });
    }
    if (e instanceof CallStaffError || e instanceof ApiError || e instanceof Error) {
      return this.set({ state: "CALL_STAFF", text: null, callStaffReason: dflt });
    }
    this.set({ state: "CALL_STAFF", text: null, callStaffReason: dflt });
  }
}
