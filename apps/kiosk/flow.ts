// 키오스크 상태 기계. UI를 모른다. 화면은 subscribe로 상태를 받아 그린다.
import { AbortedError, ApiError, CallStaffError } from "../../api/errors.ts";
import { newSessionId, newTurnId } from "../../api/ids.ts";
import type { PublicApiClient } from "../../api/client.ts";
import type { FrontendInput } from "../../api/types.ts";
import type { KioskStart } from "../../api/device.ts";
import { isUsableTranscript, type SttResult } from "./stt.ts";

export type KioskState =
  | "IDLE" | "STARTING" | "LISTENING" | "REPEAT_PROMPT" | "SENDING"
  | "WAITING_STAFF" | "CALL_STAFF" | "ENDING" | "ENDED";

export type CallStaffReason = "RETRY_EXHAUSTED" | "DELIVERY_FAILED" | "AUTH" | "START_FAILED" | "NO_DEVICE_TOKEN" | "STAFF_REQUESTED" | "BAD_SUBJECT_REF";
export type RepeatReason = "EMPTY_STT" | "NOT_COMMITTED";

export interface KioskView {
  state: KioskState;
  text: string | null; // 화면에 보일 응답 문장(메모리에만 둔다)
  callStaffReason?: CallStaffReason;
  repeatReason?: RepeatReason;
  /** 일시 장애로 같은 요청을 다시 보내는 중(STARTING·SENDING). 화면은 대기 문구와 직원 호출·그만하기를 보인다. */
  retrying?: boolean;
}

export class KioskFlow {
  private view: KioskView = { state: "IDLE", text: null };
  private listeners = new Set<(v: KioskView) => void>();
  private sessionId: string | null = null;
  private pendingTurnId: string | null = null; // 실패한 같은 발화를 다시 보낼 때 재사용
  private pendingUtterance: string | null = null;

  private api: PublicApiClient;
  private pollMs: number;
  private sleep: (ms: number) => Promise<void>;
  private inflight: AbortController | null = null; // 진행 중 요청(직원 호출·그만하기가 끊는다)
  private gen = 0; // 폴링을 끊기 위한 세대 번호
  private startValues: (() => Promise<KioskStart>) | null;
  constructor(api: PublicApiClient, o: { pollMs?: number; sleep?: (ms: number) => Promise<void>; startValues?: () => Promise<KioskStart> } = {}) {
    this.api = api;
    this.startValues = o.startValues ?? null; // 시작 URL 조각·기기 설정에서 읽은 값(메모리)
    this.pollMs = o.pollMs ?? 2000; // 계약: 2초 간격
    this.sleep = o.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  }

  get current(): KioskView { return this.view; }
  get session(): string | null { return this.sessionId; }
  subscribe(fn: (v: KioskView) => void): () => void {
    this.listeners.add(fn); fn(this.view);
    return () => this.listeners.delete(fn);
  }
  private set(v: KioskView) {
    if (v.state !== "WAITING_STAFF") this.gen++; // 대기 화면을 떠나면 폴링 종료
    this.view = v; for (const l of this.listeners) l(v); }

  async start(): Promise<void> {
    if (this.view.state !== "IDLE") return;
    this.sessionId = newSessionId();
    this.pendingTurnId = this.pendingUtterance = null;
    this.set({ state: "STARTING", text: null });
    try {
      let subjectRef: string | null = null;
      if (this.startValues) {
        const v = await this.startValues();
        if (!v.deviceToken) return this.set({ state: "CALL_STAFF", text: null, callStaffReason: "NO_DEVICE_TOKEN" }); // 서버로 보내지 않는다
        if (v.subjectInvalid) return this.set({ state: "CALL_STAFF", text: null, callStaffReason: "BAD_SUBJECT_REF" });
        subjectRef = v.subjectRef;
      }
      const ctl = this.begin();
      const r = await this.api.startSession(this.sessionId, subjectRef, this.opts(ctl));
      this.inflight = null;
      this.handle(r);
    } catch (e) {
      if (e instanceof AbortedError) return; // 환자가 직원 호출·그만하기를 눌러 이미 화면이 바뀌었다
      this.inflight = null;
      this.fail(e, "START_FAILED");
    }
  }

  /** STT 결과(또는 화면 입력)를 받는다. 쓸 수 없으면 서버로 보내지 않는다. */
  async hear(r: SttResult | null): Promise<void> {
    const s = this.view.state;
    if (s !== "LISTENING" && s !== "REPEAT_PROMPT") return; // 위험 정지 중에는 말을 받지 않는다
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
      const ctl = this.begin();
      const resp = await this.api.sendUtterance(this.sessionId!, text, turnId, this.opts(ctl));
      this.inflight = null;
      this.pendingTurnId = this.pendingUtterance = null; // 발화는 메모리에도 남기지 않는다
      this.handle(resp);
    } catch (e) {
      if (e instanceof AbortedError) return;
      this.inflight = null;
      this.fail(e, "RETRY_EXHAUSTED");
    }
  }

  async end(): Promise<void> {
    if (!this.sessionId || this.view.state === "IDLE" || this.view.state === "ENDED") return;
    this.inflight?.abort(); this.inflight = null; // 재시도 중인 요청이 있으면 끊는다(보낸 발화는 서버가 같은 turn_id로 멱등 처리)
    this.set({ state: "ENDING", text: null });
    try { await this.api.endSession(this.sessionId); } catch { /* 종료 실패는 화면을 막지 않는다 */ }
    this.sessionId = null; this.pendingTurnId = this.pendingUtterance = null;
    this.set({ state: "ENDED", text: null });
  }

  /** 환자가 대기(재시도) 중에 직원 호출을 눌렀다. 진행 중 요청을 끊고 직원 호출 화면으로 간다. */
  callStaff(): void {
    if (this.view.state === "IDLE" || this.view.state === "ENDED") return;
    this.inflight?.abort(); this.inflight = null;
    this.set({ state: "CALL_STAFF", text: null, callStaffReason: "STAFF_REQUESTED" });
  }

  reset(): void {
    this.inflight?.abort(); this.inflight = null;
    this.sessionId = null; this.pendingTurnId = this.pendingUtterance = null;
    this.set({ state: "IDLE", text: null });
  }

  private begin(): AbortController { this.inflight?.abort(); return (this.inflight = new AbortController()); }
  private opts(ctl: AbortController) {
    return {
      signal: ctl.signal,
      onRetry: () => {
        if (this.inflight !== ctl) return;
        const v = this.view;
        if (v.state !== "STARTING" && v.state !== "SENDING") return;
        this.view = { ...v, retrying: true }; for (const l of this.listeners) l(this.view);
      },
    };
  }

  /** 서버 응답 처리: 직원 호출 실패가 가장 우선. */
  private handle(r: FrontendInput): void {
    const sig = r.turn_failure_signal;
    if (sig?.staff_alert === "DELIVERY_FAILED") {
      return this.set({ state: "CALL_STAFF", text: r.response_text, callStaffReason: "DELIVERY_FAILED" });
    }
    if (sig?.staff_alert === "DELIVERED") {
      return this.waitForStaff(r.response_text);
    }
    if (sig?.write_committed === "NOT_COMMITTED") {
      return this.set({ state: "REPEAT_PROMPT", text: r.response_text, repeatReason: "NOT_COMMITTED" });
    }
    this.set({ state: "LISTENING", text: r.response_text });
  }

  /** 위험 정지 화면: 2초 간격으로 세션 상태를 보고, 재개되면 resume_text를 보이며 이어간다. */
  private waitForStaff(text: string | null): void {
    this.set({ state: "WAITING_STAFF", text });
    const id = this.sessionId!, g = this.gen;
    void (async () => {
      while (this.gen === g) {
        await this.sleep(this.pollMs);
        if (this.gen !== g) return;
        try {
          const s = await this.api.getSessionState(id);
          if (this.gen !== g) return;
          if (s.state === "ACTIVE") return this.set({ state: "LISTENING", text: s.resume_text });
          if (s.state === "ENDED") { this.sessionId = null; return this.set({ state: "ENDED", text: null }); }
          // PAUSED_RISK 또는 모르는 값: 계속 기다린다
        } catch (e) {
          if (this.gen !== g) return;
          if (e instanceof ApiError && e.status === 404) { this.sessionId = null; return this.set({ state: "IDLE", text: null }); }
          if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return this.set({ state: "CALL_STAFF", text: null, callStaffReason: "AUTH" });
          // 그 밖의 오류(재시도 소진 포함)는 계속 폴링한다. 대기 화면은 직원 호출을 이미 안내 중이다.
        }
      }
    })();
  }

  private fail(e: unknown, dflt: CallStaffReason): void {
    if (e instanceof ApiError) {
      if (e.status === 409) return this.waitForStaff(null); // 위험 정지 중이거나 순서 어긋남: 상태를 폴링해 확인
      if (e.status === 404) { this.sessionId = null; return this.set({ state: "IDLE", text: null }); } // 세션 만료
      if (e.status === 401 || e.status === 403) return this.set({ state: "CALL_STAFF", text: null, callStaffReason: "AUTH" });
    }
    if (e instanceof CallStaffError || e instanceof ApiError || e instanceof Error) {
      return this.set({ state: "CALL_STAFF", text: null, callStaffReason: dflt });
    }
    this.set({ state: "CALL_STAFF", text: null, callStaffReason: dflt });
  }
}
