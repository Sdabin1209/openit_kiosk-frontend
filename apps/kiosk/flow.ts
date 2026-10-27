// 키오스크 상태 기계. UI를 모른다. 화면은 subscribe로 상태를 받아 그린다.
import { AbortedError, ApiError, CallStaffError } from "../../api/errors.ts";
import { newSessionId, newTurnId } from "../../api/ids.ts";
import type { PublicApiClient } from "../../api/client.ts";
import type { FrontendInput } from "../../api/types.ts";
import type { KioskStart } from "../../api/device.ts";
import { isUsableTranscript, type SttResult } from "./stt.ts";
import { IDLE_RESET_MS, LONG_WAIT_NOTICE_MS, MAX_INPUT_CHARS, MAX_REPEAT } from "./clinical.ts";

export type KioskState =
  | "IDLE" | "STARTING" | "LISTENING" | "REPEAT_PROMPT" | "SENDING"
  | "WAITING_STAFF" | "CALL_STAFF" | "ENDING" | "ENDED";

export type CallStaffReason = "RETRY_EXHAUSTED" | "DELIVERY_FAILED" | "AUTH" | "START_FAILED" | "NO_DEVICE_TOKEN" | "STAFF_REQUESTED" | "BAD_SUBJECT_REF" | "REPEAT_LIMIT";
export type RepeatReason = "EMPTY_STT" | "NOT_COMMITTED";

export interface KioskView {
  state: KioskState;
  text: string | null; // 화면에 보일 응답 문장(메모리에만 둔다)
  callStaffReason?: CallStaffReason;
  repeatReason?: RepeatReason;
  /** 일시 장애로 같은 요청을 다시 보내는 중(STARTING·SENDING). 화면은 대기 문구와 직원 호출·그만하기를 보인다. */
  retrying?: boolean;
  /** 마이크를 쓸 수 없다(거부·오류): 화면 입력으로 대체한다. */
  textFallback?: boolean;
  /** 접수 참조 없이 시작했다(한 번 쓴 참조는 다시 쓰지 않는다). 현장 확인용 표시. */
  startNotice?: "NO_SUBJECT_REF";
  /** 위험 정지 대기 중 안내: 상태 확인 실패(서버 무응답) 또는 오래 기다림. */
  waitNotice?: "SERVER_UNREACHABLE" | "LONG_WAIT";
  /** 종료 요청이 서버에 닿지 않았다(ENDED 화면에서 직원에게 알리게 한다). */
  endFailed?: boolean;
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
  private repeatStreak = 0; // 연달아 '다시 말씀해 주세요'가 나온 횟수
  private micBlocked = false; // 마이크 거부·STT 오류: 화면 입력으로 대체
  private notice: KioskView["startNotice"];
  private idleMs: number;
  private timers: { set: (fn: () => void, ms: number) => unknown; clear: (h: unknown) => void };
  private idleTimer: unknown = null;
  constructor(api: PublicApiClient, o: { pollMs?: number; sleep?: (ms: number) => Promise<void>; startValues?: () => Promise<KioskStart>; idleMs?: number; timers?: { set: (fn: () => void, ms: number) => unknown; clear: (h: unknown) => void } } = {}) {
    this.idleMs = o.idleMs ?? IDLE_RESET_MS;
    this.timers = o.timers ?? { set: (fn, ms) => { const h = setTimeout(fn, ms) as unknown as { unref?: () => void }; h.unref?.(); return h; }, clear: (h) => clearTimeout(h as number) };
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
    if (this.notice && (v.state === "LISTENING" || v.state === "REPEAT_PROMPT" || v.state === "SENDING")) v = { ...v, startNotice: this.notice };
    if (this.micBlocked && (v.state === "LISTENING" || v.state === "REPEAT_PROMPT")) v = { ...v, textFallback: true };
    this.view = v; this.armIdle(); for (const l of this.listeners) l(v); }
  private patch(p: Partial<KioskView>) { this.view = { ...this.view, ...p }; for (const l of this.listeners) l(this.view); }

  /** 유휴 초기화: 입력이 없으면 세션을 끝내고 화면을 처음으로 돌린다(다음 사람에게 남지 않게). 위험 정지 대기는 세션을 끝내지 않는다. */
  private armIdle() {
    if (this.idleTimer !== null) { this.timers.clear(this.idleTimer); this.idleTimer = null; }
    const s = this.view.state;
    // 직원 개입을 기다리는 화면(CALL_STAFF, WAITING_STAFF, 종료 실패 안내 등)에는 걸지 않는다: 그 화면에서는 reset()이
    // 서버 세션(PAUSED_RISK 등)을 그대로 두고 다음 사람이 시작할 수 있게 되기 때문이다(재점검 K-1). 벗어나는 길은 직원 결정이나 환자의 명시적 동작뿐이다.
    if (this.idleMs <= 0 || (s !== "LISTENING" && s !== "REPEAT_PROMPT")) return;
    this.idleTimer = this.timers.set(() => {
      this.idleTimer = null;
      // 서버에 종료 요청을 먼저 보내고, 성공했을 때만 처음 화면으로 돌린다. 실패하면 종료 실패 안내(ENDED, endFailed)를 유지한다.
      void this.end().then(() => { if (this.view.state === "ENDED" && !this.view.endFailed) this.reset(); });
    }, this.idleMs);
  }
  /** 환자 조작(버튼·입력)이 있었다: 유휴 시간을 다시 센다. */
  touch(): void { this.armIdle(); }

  async start(): Promise<void> {
    if (this.view.state !== "IDLE") return;
    this.sessionId = newSessionId();
    this.pendingTurnId = this.pendingUtterance = null;
    this.repeatStreak = 0; this.micBlocked = false; this.notice = undefined;
    this.set({ state: "STARTING", text: null });
    try {
      let subjectRef: string | null = null;
      let confirm: (() => void) | undefined;
      if (this.startValues) {
        const v = await this.startValues();
        if (!v.deviceToken) return this.set({ state: "CALL_STAFF", text: null, callStaffReason: "NO_DEVICE_TOKEN" }); // 서버로 보내지 않는다
        if (v.subjectInvalid) return this.set({ state: "CALL_STAFF", text: null, callStaffReason: "BAD_SUBJECT_REF" });
        subjectRef = v.subjectRef; confirm = v.confirm;
        if (subjectRef === null) this.notice = "NO_SUBJECT_REF"; // 참조 없이 시작한다(이전 환자 값을 쓰지 않는다)
      }
      const ctl = this.begin();
      const r = await this.api.startSession(this.sessionId, subjectRef, this.opts(ctl));
      this.inflight = null;
      confirm?.(); // 시작이 서버에 접수된 뒤에만 한 번 쓴 환자 참조를 비운다(실패한 시작은 같은 참조로 다시 시작할 수 있다)
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
    if (!isUsableTranscript(r)) return this.repeat({ state: "REPEAT_PROMPT", text: null, repeatReason: "EMPTY_STT" });
    const text = Array.from(r!.text.replace(/\u0000/g, "").trim()).slice(0, MAX_INPUT_CHARS).join("").trim(); // 코드 포인트 단위로 자른다(이모지 서로게이트 쌍을 가르지 않는다)
    if (text === "") return this.repeat({ state: "REPEAT_PROMPT", text: null, repeatReason: "EMPTY_STT" });
    // 직전 발화가 응답 없이 실패해 같은 발화를 다시 보내는 경우만 같은 turn_id를 쓴다.
    const turnId = this.pendingUtterance === text && this.pendingTurnId ? this.pendingTurnId : newTurnId();
    this.pendingTurnId = turnId; this.pendingUtterance = text;
    this.set({ state: "SENDING", text: null });
    try {
      const ctl = this.begin();
      const resp = await this.api.sendUtterance(this.sessionId!, text, turnId, this.opts(ctl));
      this.inflight = null;
      this.pendingTurnId = this.pendingUtterance = null; // 발화는 메모리에도 남기지 않는다
      // 계약상 위험 정지가 성공하면 turn_failure_signal은 null일 수 있다(DELIVERED는 신호가 오는 경우뿐).
      // 신호만으로 정지를 알 수 없으면 세션 상태(PAUSED_RISK)를 확인해 대기 화면으로 간다(H-2).
      if (this.needsStateCheck(resp) && (await this.pausedByState(ctl))) return this.waitForStaff(resp.response_text);
      if (this.view.state !== "SENDING") return; // 확인하는 동안 환자가 직원 호출·그만하기를 눌렀다
      this.handle(resp);
    } catch (e) {
      if (e instanceof AbortedError) return;
      this.inflight = null;
      this.fail(e, "RETRY_EXHAUSTED");
    }
  }

  private needsStateCheck(r: FrontendInput): boolean {
    const sig = r.turn_failure_signal;
    return !(sig?.staff_alert === "DELIVERED" || sig?.staff_alert === "DELIVERY_FAILED" || sig?.write_committed === "NOT_COMMITTED");
  }
  /** 정지 여부를 상태 조회로 확인한다. 조회에 실패하면 정지가 아닌 것으로 보고 진행한다(조회 실패가 환자 턴을 막지 않게). */
  private async pausedByState(ctl: AbortController): Promise<boolean> {
    try {
      const s = await this.api.getSessionState(this.sessionId!, { signal: ctl.signal });
      return s.state === "PAUSED_RISK";
    } catch { return false; }
  }

  /** 다시 말하기 화면. 연달아 MAX_REPEAT를 넘으면 직원 호출 안내로 넘긴다(무한 반복 방지). */
  private repeat(v: KioskView): void {
    if (++this.repeatStreak > MAX_REPEAT) return this.set({ state: "CALL_STAFF", text: null, callStaffReason: "REPEAT_LIMIT" });
    this.set(v);
  }

  /** 마이크 거부·STT 오류: 화면 입력으로 대체한다(같은 상한을 센다). */
  sttError(code: string | null): void {
    const s = this.view.state;
    if (s !== "LISTENING" && s !== "REPEAT_PROMPT") return;
    if (code === "not-allowed" || code === "service-not-allowed" || code === "audio-capture" || code === "STT 사용 불가") this.micBlocked = true;
    this.repeat({ state: "REPEAT_PROMPT", text: null, repeatReason: "EMPTY_STT" });
  }

  async end(): Promise<void> {
    if (!this.sessionId || this.view.state === "IDLE" || this.view.state === "ENDED") return;
    this.inflight?.abort(); this.inflight = null; // 재시도 중인 요청이 있으면 끊는다(보낸 발화는 서버가 같은 turn_id로 멱등 처리)
    this.set({ state: "ENDING", text: null });
    let endFailed = false;
    try { await this.api.endSession(this.sessionId); } catch (e) { endFailed = !(e instanceof ApiError && (e.status === 404 || e.status === 409)); } // 이미 끝난/없는 세션은 실패가 아니다
    this.sessionId = null; this.pendingTurnId = this.pendingUtterance = null;
    this.set(endFailed ? { state: "ENDED", text: null, endFailed: true } : { state: "ENDED", text: null });
  }

  /** 환자가 대기(재시도) 중에 직원 호출을 눌렀다. 진행 중 요청을 끊고 직원 호출 화면으로 간다. */
  callStaff(): void {
    if (this.view.state === "IDLE" || this.view.state === "ENDED") return;
    this.inflight?.abort(); this.inflight = null;
    this.set({ state: "CALL_STAFF", text: null, callStaffReason: "STAFF_REQUESTED" });
  }

  reset(): void {
    this.inflight?.abort(); this.inflight = null;
    this.repeatStreak = 0; this.micBlocked = false; this.notice = undefined;
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
      return this.repeat({ state: "REPEAT_PROMPT", text: r.response_text, repeatReason: "NOT_COMMITTED" });
    }
    this.repeatStreak = 0;
    this.set({ state: "LISTENING", text: r.response_text });
  }

  /** 위험 정지 화면: 2초 간격으로 세션 상태를 보고, 재개되면 resume_text를 보이며 이어간다. */
  private waitForStaff(text: string | null): void {
    this.set({ state: "WAITING_STAFF", text });
    const id = this.sessionId!, g = this.gen;
    const longAfter = Math.ceil(LONG_WAIT_NOTICE_MS / this.pollMs);
    let polls = 0;
    void (async () => {
      while (this.gen === g) {
        await this.sleep(this.pollMs);
        if (this.gen !== g) return;
        polls++;
        try {
          const s = await this.api.getSessionState(id);
          if (this.gen !== g) return;
          if (this.view.waitNotice === "SERVER_UNREACHABLE") this.patch({ waitNotice: polls >= longAfter ? "LONG_WAIT" : undefined }); // 연결 회복
          else if (polls >= longAfter && !this.view.waitNotice) this.patch({ waitNotice: "LONG_WAIT" });
          if (s.state === "ACTIVE") return this.set({ state: "LISTENING", text: s.resume_text });
          if (s.state === "ENDED") { this.sessionId = null; return this.set({ state: "ENDED", text: null }); }
          // PAUSED_RISK 또는 모르는 값: 계속 기다린다
        } catch (e) {
          if (this.gen !== g) return;
          if (e instanceof ApiError && e.status === 404) { this.sessionId = null; return this.set({ state: "IDLE", text: null }); }
          if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return this.set({ state: "CALL_STAFF", text: null, callStaffReason: "AUTH" });
          // 그 밖의 오류(재시도 소진 포함)는 계속 폴링하되, 환자에게 상태를 확인하지 못하고 있음을 알리고 직원을 부르도록 안내한다.
          this.patch({ waitNotice: "SERVER_UNREACHABLE" });
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
