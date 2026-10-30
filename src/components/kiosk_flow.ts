// 키오스크 상태 기계 컴포넌트. UI를 모른다. 화면은 subscribe로 상태(KioskView)를 받아 그린다.
// 입력: 환자 조작(start·hear·end·callStaff 등)과 STT 결과(UsableTranscript 스키마로 검증), 주입받은 공개 API 포트(link_public_api_send의 함수 모양).
// 출력: KioskView(schemas/KioskView.json)와 대화 이벤트(ConversationEvent). 링크·재시도 정책·턴 ID 발급은 wiring이 주입한다(규칙 3: 다른 컴포넌트를 import하지 않는다).
import { KioskView as vKioskView, ConversationEvent as vConversationEvent, UsableTranscript as vUsable } from "../types/validators.gen.cjs";
import type { ConversationEvent } from "../types/ConversationEvent.ts";
import type { FrontendInput } from "../types/FrontendInput.ts";
import type { KioskStart } from "../types/KioskStart.ts";
import type { KioskView } from "../types/KioskView.ts";
import type { SessionState } from "../types/SessionState.ts";
import type { StaffCallRetryResult } from "../types/StaffCallRetryResult.ts";
import type { StaffCallView } from "../types/StaffCallView.ts";
import type { SttErrorKind } from "../types/SttErrorKind.ts";
import type { SttResult } from "../types/SttResult.ts";
import { IDLE_RESET_MS, IDLE_WARNING_MS, LONG_WAIT_NOTICE_MS, MAX_INPUT_CHARS, MAX_REPEAT } from "../config.ts";

/** 시작 값(KioskStart) + 시작이 서버에 접수된 뒤 부르는 confirm(한 번 쓴 환자 참조를 비운다). */
export type StartValues = KioskStart & { confirm?: () => void };
type PauseReason = NonNullable<KioskView["pauseReason"]>;
type StaffCallOutcome = "STAFF_NOTIFIED_MANUALLY" | "NOT_NOTIFIED";
export type { KioskView, StaffCallView, ConversationEvent };
export type KioskState = KioskView["state"];
export type CallStaffReason = NonNullable<KioskView["callStaffReason"]>;
export type RepeatReason = NonNullable<KioskView["repeatReason"]>;

/** 링크가 던지는 오류를 데이터(schemas/ApiFailure.json)로 읽는다. 클래스를 가져오지 않는다. */
type Failure = { name?: string; status?: number; auth?: boolean; reason?: string | null; retryAfterMs?: number | null };
const failure = (e: unknown): Failure => (typeof e === "object" && e !== null ? e as Failure : {});
const isAborted = (e: unknown) => failure(e).name === "AbortedError";
type ApiErr = { status: number; auth: boolean; reason: string | null; retryAfterMs: number | null };
/** ApiError(서버가 응답했으나 재시도로 풀리지 않는 오류)이면 그 필드를, 아니면 null. */
const asApi = (e: unknown): ApiErr | null => { const f = failure(e); return f.name === "ApiError" ? { status: f.status ?? 0, auth: f.auth === true, reason: f.reason ?? null, retryAfterMs: f.retryAfterMs ?? null } : null; };
const statusIs = (e: unknown, ...codes: number[]) => { const a = asApi(e); return a !== null && codes.includes(a.status); };
/** 읽는 쪽 규약(PUBLIC_API.md H절): 모르는 값은 OTHER. 값이 없으면(옛 서버, 정지 아님) undefined = 미상. */
function normalizePauseReason(v: unknown): PauseReason | undefined {
  if (v === undefined || v === null) return undefined;
  return v === "RISK" || v === "REASK_LIMIT" || v === "OTHER" ? v : "OTHER";
}

/** 내는 쪽이 내기 전에 검증한다(DESIGN.md 5절, R7). 스키마를 어기는 화면 값은 만들지 않는다. */
function checked(v: KioskView): KioskView { if (!vKioskView(v)) throw new Error(`KioskView schema violation: ${JSON.stringify(vKioskView.errors)}`); return v; }

/** 흐름이 공개 API에 바라는 것(작업 하나 = 입력 -> 출력인 함수). wiring이 link_public_api_send를 넣는다. */
export interface FlowApi {
  startSession(subjectRef: string | null, co?: FlowCall): Promise<FrontendInput & { session_id: string }>;
  sendUtterance(sessionId: string, utterance: string, turnId: string, co?: FlowCall): Promise<FrontendInput>;
  endSession(sessionId: string, co?: FlowCall): Promise<FrontendInput>;
  getSessionState(sessionId: string, co?: FlowCall): Promise<SessionState>;
  staffCallRetry(sessionId: string, turnId: string, co?: FlowCall): Promise<StaffCallRetryResult>;
  staffCallReport(sessionId: string, outcome: StaffCallOutcome, turnId: string, co?: FlowCall): Promise<unknown>;
}
export interface FlowCall { signal?: AbortSignal; onRetry?: (info: { attempt: number; waitMs: number; status: number | null }) => void }

/** report 한 건을 응답 없이 실패했을 때 같은 turn_id로 보내는 최대 횟수. 임의 값(측정 안 함): 환자를 오래 붙잡지 않으면서 한 번의 순간 장애는 넘긴다. */
const REPORT_ATTEMPTS = 2;
export class KioskFlow {
  private view: KioskView = { state: "IDLE", text: null };
  private listeners = new Set<(v: KioskView) => void>();
  private convListeners = new Set<(e: ConversationEvent) => void>();
  private resumeSeq = 0;
  private sessionId: string | null = null;
  private pendingTurnId: string | null = null; // 실패한 같은 발화를 다시 보낼 때 재사용
  private pendingUtterance: string | null = null;

  private api: FlowApi;
  private newTurnId: () => string;
  private isOutcomeUnknown: (status: number) => boolean;
  private pollMs: number;
  private sleep: (ms: number) => Promise<void>;
  private inflight: AbortController | null = null; // 진행 중 요청(직원 호출·그만하기가 끊는다)
  private gen = 0; // 폴링을 끊기 위한 세대 번호
  private startValues: (() => Promise<StartValues>) | null;
  private repeatStreak = 0; // 연달아 '다시 말씀해 주세요'가 나온 횟수
  private micBlocked = false; // 마이크 거부·STT 오류: 화면 입력으로 대체
  private notice: KioskView["startNotice"];
  private idleMs: number;
  private timers: { set: (fn: () => void, ms: number) => unknown; clear: (h: unknown) => void };
  private idleTimer: unknown = null;
  private callTimer: unknown = null; // 다시 부르기 카운트다운
  private retryTurnId: string | null = null; // 응답 없이 실패한 재알림은 같은 turn_id로 다시 보낸다(서버 멱등)
  private staffCallSupported = true; // 기능 감지: 404/405를 한 번 받으면 이 세션 동안 끈다
  private lastPause: PauseReason | undefined;
  constructor(api: FlowApi, o: { newTurnId: () => string; isOutcomeUnknown: (status: number) => boolean; pollMs?: number; sleep?: (ms: number) => Promise<void>; startValues?: () => Promise<StartValues>; idleMs?: number; timers?: { set: (fn: () => void, ms: number) => unknown; clear: (h: unknown) => void } }) {
    this.idleMs = o.idleMs ?? IDLE_RESET_MS;
    this.timers = o.timers ?? { set: (fn, ms) => { const h = setTimeout(fn, ms) as unknown as { unref?: () => void }; h.unref?.(); return h; }, clear: (h) => clearTimeout(h as number) };
    this.api = api;
    this.newTurnId = o.newTurnId; this.isOutcomeUnknown = o.isOutcomeUnknown;
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
  /** 대화 이벤트(환자 발화·시스템 응답·지움)를 받는다. 대화 목록 컴포넌트(chat.ts)가 입력으로 쓴다. 내용은 여기서 저장하지 않는다. */
  subscribeConversation(fn: (e: ConversationEvent) => void): () => void {
    this.convListeners.add(fn);
    return () => this.convListeners.delete(fn);
  }
  private emit(e: ConversationEvent): void { if (!vConversationEvent(e)) throw new Error("ConversationEvent schema violation"); for (const l of this.convListeners) l(e); }
  private say(text: string | null | undefined, id: string): void { if (text) this.emit({ type: "SYSTEM", id, text }); }

  private set(v: KioskView) {
    this.stopCallTimer();
    if (v.state === "IDLE" || v.state === "ENDED") this.emit({ type: "CLEAR" }); // 세션이 끝났거나 처음 화면이면 대화를 지운다
    if (v.state !== "WAITING_STAFF") this.gen++; // 대기 화면을 떠나면 폴링 종료
    if (this.notice && (v.state === "LISTENING" || v.state === "REPEAT_PROMPT" || v.state === "SENDING")) v = { ...v, startNotice: this.notice };
    if (this.micBlocked && (v.state === "LISTENING" || v.state === "REPEAT_PROMPT")) v = { ...v, textFallback: true };
    this.view = checked(v); this.armIdle(); for (const l of this.listeners) l(v); }
  private patch(p: Partial<KioskView>) { this.view = checked({ ...this.view, ...p }); for (const l of this.listeners) l(this.view); }

  /** 유휴 초기화: 입력이 없으면 세션을 끝내고 화면을 처음으로 돌린다(다음 사람에게 남지 않게). 위험 정지 대기는 세션을 끝내지 않는다.
   * 왜 경고 단계가 있나: WCAG 2.2 SC 2.2.1 Timing Adjustable의 Extend 조건(끝나기 전에 알리고 20초 이상 연장할 수 있게 한다, 표준성 점검 #29).
   * 총 제한(idleMs)은 바꾸지 않고 마지막 IDLE_WARNING_MS를 경고 구간으로 쓴다. 타이머는 항상 하나만 걸린다(경고 -> 만료). */
  private armIdle() {
    if (this.idleTimer !== null) { this.timers.clear(this.idleTimer); this.idleTimer = null; }
    if (this.view.idleWarnS !== undefined) this.patch({ idleWarnS: undefined }); // 연장: 경고를 거둔다
    const s = this.view.state;
    // 직원 개입을 기다리는 화면(CALL_STAFF, WAITING_STAFF, 종료 실패 안내 등)에는 걸지 않는다: 그 화면에서는 reset()이
    // 서버 세션(PAUSED_RISK 등)을 그대로 두고 다음 사람이 시작할 수 있게 되기 때문이다(재점검 K-1). 벗어나는 길은 직원 결정이나 환자의 명시적 동작뿐이다.
    if (this.idleMs <= 0 || (s !== "LISTENING" && s !== "REPEAT_PROMPT")) return;
    const warnMs = Math.min(IDLE_WARNING_MS, this.idleMs); // 총 제한이 경고 구간보다 짧으면 처음부터 경고
    const expire = () => {
      this.idleTimer = null;
      // 서버에 종료 요청을 먼저 보내고, 성공했을 때만 처음 화면으로 돌린다. 실패하면 종료 실패 안내(ENDED, endFailed)를 유지한다.
      void this.end().then(() => { if (this.view.state === "ENDED" && !this.view.endFailed) this.reset(); });
    };
    const warn = () => {
      this.patch({ idleWarnS: Math.round(warnMs / 1000) });
      this.idleTimer = this.timers.set(expire, warnMs);
    };
    this.idleTimer = this.idleMs > warnMs ? this.timers.set(warn, this.idleMs - warnMs) : this.timers.set(() => warn(), 0);
  }
  /** 환자 조작(버튼·입력)이 있었다: 유휴 시간을 다시 센다. */
  touch(): void { this.armIdle(); }

  async start(): Promise<void> {
    if (this.view.state !== "IDLE") return;
    this.sessionId = null; // 서버가 발급한 ID를 시작 응답에서 받는다(계약 2.2.0, D106)
    this.pendingTurnId = this.pendingUtterance = null;
    this.repeatStreak = 0; this.micBlocked = false; this.notice = undefined;
    this.set({ state: "STARTING", text: null });
    try {
      let subjectRef: string | null = null;
      let confirm: (() => void) | undefined;
      if (this.startValues) {
        const v = await this.startValues();
        // 기기 인증은 게이트웨이 mTLS다(계약 2.3.0). 기기 토큰이 없어도 시작한다: 있으면 2.x 호환으로 client.ts가 요청에 싣는다.
        if (v.subjectInvalid) return this.set({ state: "CALL_STAFF", text: null, callStaffReason: "BAD_SUBJECT_REF" });
        subjectRef = v.subjectRef; confirm = v.confirm;
        if (subjectRef === null) this.notice = "NO_SUBJECT_REF"; // 참조 없이 시작한다(이전 환자 값을 쓰지 않는다)
      }
      const ctl = this.begin();
      const r = await this.api.startSession(subjectRef, this.opts(ctl));
      this.inflight = null;
      this.sessionId = r.session_id;
      this.say(r.response_text, `${r.session_id}:start`);
      confirm?.(); // 시작이 서버에 접수된 뒤에만 한 번 쓴 환자 참조를 비운다(실패한 시작은 같은 참조로 다시 시작할 수 있다)
      this.handle(r);
    } catch (e) {
      if (isAborted(e)) return; // 환자가 직원 호출·그만하기를 눌러 이미 화면이 바뀌었다
      this.inflight = null;
      this.fail(e, "START_FAILED");
    }
  }

  /** STT 결과(또는 화면 입력)를 받는다. 쓸 수 없으면 서버로 보내지 않는다. */
  async hear(r: SttResult | null): Promise<void> {
    const s = this.view.state;
    if (s !== "LISTENING" && s !== "REPEAT_PROMPT") return; // 위험 정지 중에는 말을 받지 않는다
    if (!vUsable(r)) return this.repeat({ state: "REPEAT_PROMPT", text: null, repeatReason: "EMPTY_STT" });
    const text = Array.from((r as SttResult).text.replace(/\u0000/g, "").trim()).slice(0, MAX_INPUT_CHARS).join("").trim(); // 코드 포인트 단위로 자른다(이모지 서로게이트 쌍을 가르지 않는다)
    if (text === "") return this.repeat({ state: "REPEAT_PROMPT", text: null, repeatReason: "EMPTY_STT" });
    // 직전 발화가 응답 없이 실패해 같은 발화를 다시 보내는 경우만 같은 turn_id를 쓴다.
    const turnId = this.pendingUtterance === text && this.pendingTurnId ? this.pendingTurnId : this.newTurnId();
    this.pendingTurnId = turnId; this.pendingUtterance = text;
    this.emit({ type: "PATIENT", id: turnId, text }); // 같은 turn_id의 재전송은 같은 말풍선이다
    this.set({ state: "SENDING", text: null });
    try {
      const ctl = this.begin();
      const resp = await this.api.sendUtterance(this.sessionId!, text, turnId, this.opts(ctl));
      this.inflight = null;
      this.say(resp.response_text, `${turnId}:r`);
      this.pendingTurnId = this.pendingUtterance = null; // 발화는 메모리에도 남기지 않는다
      // 계약상 위험 정지가 성공하면 turn_failure_signal은 null일 수 있다(DELIVERED는 신호가 오는 경우뿐).
      // 신호만으로 정지를 알 수 없으면 세션 상태(PAUSED_RISK)를 확인해 대기 화면으로 간다(H-2).
      const st = this.needsStateCheck(resp) ? await this.sessionStateOf(ctl) : null;
      if (st === "PAUSED_RISK") return this.waitForStaff(resp.response_text);
      if (this.view.state !== "SENDING") return; // 확인하는 동안 환자가 직원 호출·그만하기를 눌렀다
      // 서버가 문진을 끝냈다(FrontendInput에는 완료 필드가 없어 정지 확인용 상태 조회의 ENDED를 쓴다). 마지막 안내 문장을 종료 화면에 보이고 종료 요청은 보내지 않는다.
      if (st === "ENDED") { this.sessionId = null; return this.set({ state: "ENDED", text: resp.response_text }); }
      this.handle(resp);
    } catch (e) {
      if (isAborted(e)) return;
      this.inflight = null;
      this.fail(e, "RETRY_EXHAUSTED");
    }
  }

  private needsStateCheck(r: FrontendInput): boolean {
    const sig = r.turn_failure_signal;
    return !(sig?.staff_alert === "DELIVERED" || sig?.staff_alert === "DELIVERY_FAILED" || sig?.write_committed === "NOT_COMMITTED");
  }
  /** 정지 여부를 상태 조회로 확인한다. 조회에 실패하면 정지가 아닌 것으로 보고 진행한다(조회 실패가 환자 턴을 막지 않게). */
  private async sessionStateOf(ctl: AbortController): Promise<string | null> {
    try {
      const s = await this.api.getSessionState(this.sessionId!, { signal: ctl.signal });
      this.lastPause = s.state === "PAUSED_RISK" ? normalizePauseReason(s.pause_reason) : undefined;
      return s.state;
    } catch { return null; }
  }

  /** 다시 말하기 화면. 연달아 MAX_REPEAT를 넘으면 직원 호출 안내로 넘긴다(무한 반복 방지). */
  private repeat(v: KioskView): void {
    if (++this.repeatStreak > MAX_REPEAT) return this.set({ state: "CALL_STAFF", text: null, callStaffReason: "REPEAT_LIMIT" });
    this.set(v);
  }

  /** 마이크 거부·STT 오류: 화면 입력으로 대체한다(같은 상한을 센다). */
  sttError(kind: SttErrorKind): void {
    const s = this.view.state;
    if (s !== "LISTENING" && s !== "REPEAT_PROMPT") return;
    if (kind === "BLOCKED") this.micBlocked = true;
    this.repeat({ state: "REPEAT_PROMPT", text: null, repeatReason: "EMPTY_STT" });
  }

  async end(): Promise<void> {
    if (this.view.state === "IDLE" || this.view.state === "ENDED") return;
    if (!this.sessionId) {
      // 시작 요청이 아직 응답을 못 받았다(재시도 중): 서버가 준 ID를 모르므로 종료 요청을 보낼 수 없다. 요청을 끊고 종료 화면으로 간다.
      // 서버에 이미 만들어졌을 수 있는 세션은 유휴 만료가 정리한다(런북).
      if (this.view.state !== "STARTING") return;
      this.inflight?.abort(); this.inflight = null;
      return this.set({ state: "ENDED", text: null });
    }
    this.inflight?.abort(); this.inflight = null; // 재시도 중인 요청이 있으면 끊는다(보낸 발화는 서버가 같은 turn_id로 멱등 처리)
    this.set({ state: "ENDING", text: null });
    let endFailed = false;
    try { await this.api.endSession(this.sessionId); } catch (e) { endFailed = !statusIs(e, 404, 409); } // 이미 끝난/없는 세션은 실패가 아니다
    this.sessionId = null; this.pendingTurnId = this.pendingUtterance = null;
    this.set(endFailed ? { state: "ENDED", text: null, endFailed: true } : { state: "ENDED", text: null });
  }

  /** 환자가 대기(재시도) 중에 직원 호출을 눌렀다. 진행 중 요청을 끊고 직원 호출 화면으로 간다. */
  callStaff(): void {
    if (this.view.state === "IDLE" || this.view.state === "ENDED") return;
    this.inflight?.abort(); this.inflight = null;
    this.set({ state: "CALL_STAFF", text: null, callStaffReason: "STAFF_REQUESTED" });
  }

  /**
   * CALL_STAFF 화면의 '처음으로'(3차 점검 K-a, K-b).
   * - DELIVERY_FAILED: 직원 알림이 닿지 않은 상태다. 서버 세션(위험 정지 등)이 그 사실의 유일한 흔적이므로 세션을 끝내지 않고 남긴다
   *   (끝내면 직원 콘솔에서 사라진다). 환자가 실수로 떠나지 않게 한 번 더 확인한다(첫 번째 누름은 확인 단계로만 간다).
   * - 그 밖: 서버 세션을 끝내 다음 사람에게 열린 세션이 남지 않게 한다. 실패하면 한 번 더 시도하고, 그래도 실패해도 화면은 처음으로 간다
   *   (직원 호출 화면에 환자를 가두지 않는다. 남은 세션은 서버 유휴 만료가 정리한다 — 런북).
   */
  async leaveCallStaff(): Promise<void> {
    if (this.view.state !== "CALL_STAFF") return;
    if (this.view.callStaffReason === "DELIVERY_FAILED") {
      if (this.view.busy) return; // report 진행 중의 두 번째 누름은 무시한다(같은 보고를 한 번만 보낸다)
      if (!this.view.confirmLeave) return this.patch({ confirmLeave: true });
      this.patch({ busy: true });
      await this.report("STAFF_NOTIFIED_MANUALLY"); // 서버에 남기는 것은 최선 노력: 실패해도 환자를 화면에 가두지 않는다
      return this.reset();
    }
    const id = this.sessionId;
    if (id) {
      this.inflight?.abort(); this.inflight = null;
      for (let i = 0; i < 2; i++) {
        try { await this.api.endSession(id); break; }
        catch (e) { if (statusIs(e, 404, 409)) break; /* 이미 끝났거나 없다 */ }
      }
    }
    if (this.view.state === "CALL_STAFF") this.reset();
  }
  /** 확인 단계에서 취소한다. */
  cancelLeave(): void {
    if (this.view.state !== "CALL_STAFF" || !this.view.confirmLeave || this.view.busy) return;
    this.patch({ confirmLeave: false, busy: true });
    void this.report("NOT_NOTIFIED").then(() => { if (this.view.state === "CALL_STAFF") this.patch({ busy: false }); });
  }

  /**
   * 환자의 '직접 알렸다/못 알렸다'를 서버에 남긴다(CR-H001). 보고 한 건은 turn_id 하나: 응답을 못 받았으면(네트워크·시간 초과·502/503/504)
   * 같은 turn_id로 REPORT_ATTEMPTS번까지 다시 보낸다(서버 멱등이라 중복 기록이 없다, L-2). 다음 보고는 새 turn_id
   * (같은 turn_id에 다른 outcome은 409이기 때문이다).
   */
  private async report(outcome: StaffCallOutcome): Promise<void> {
    const id = this.sessionId;
    if (!id || !this.staffCallSupported) return;
    const turnId = this.newTurnId();
    for (let i = 0; i < REPORT_ATTEMPTS; i++) {
      try { await this.api.staffCallReport(id, outcome, turnId); return; }
      catch (e) {
        if (statusIs(e, 404, 405)) { this.staffCallSupported = false; return; } // 옛 서버: 기존 동작
        if (asApi(e) && !this.isOutcomeUnknown(asApi(e)!.status)) break; // 서버가 답했다: 같은 요청을 되풀이하지 않는다
      }
    }
    if (this.view.state === "CALL_STAFF" && this.view.staffCall) this.patch({ staffCall: { ...this.view.staffCall, notice: "REPORT_FAILED" } });
  }

  /**
   * '다시 부르기'(CR-H001). 서버가 준 retry_after_s 동안 버튼을 비활성(카운트다운)으로 둔다.
   * 성공(DELIVERED)이면 대기 화면으로 가서 상태 폴링을 이어 간다. 여전히 실패면 화면에 남아 다시 센다.
   */
  async retryStaffCall(): Promise<void> {
    const v = this.view, sc = v.staffCall, id = this.sessionId;
    if (v.state !== "CALL_STAFF" || !sc || !id || sc.sending || sc.waitS > 0 || !sc.canRetry) return;
    this.retryTurnId ??= this.newTurnId();
    this.patch({ staffCall: { ...sc, sending: true, notice: undefined } });
    const turnId = this.retryTurnId;
    try {
      const r = await this.api.staffCallRetry(id, turnId);
      this.retryTurnId = null;
      if (this.view.state !== "CALL_STAFF") return; // 보내는 동안 환자가 화면을 떠났다
      if (r.staff_alert === "DELIVERED") return this.waitForStaff(v.text);
      this.startCountdown({ canRetry: true, sending: false, waitS: r.retry_after_s, attempts: r.delivery_attempts, notice: "STILL_FAILED" });
    } catch (e) {
      if (this.view.state !== "CALL_STAFF") return;
      const cur = this.view.staffCall ?? sc;
      const ae = asApi(e);
      if (ae && !this.isOutcomeUnknown(ae.status)) {
        this.retryTurnId = null; // 서버가 답했다(200/409/429/404/405/401/403 등): 다음 눌림은 새 요청
        const off = (notice: NonNullable<StaffCallView["notice"]>) => this.patch({ staffCall: { ...cur, sending: false, canRetry: false, notice } });
        // 404/405: 옛 서버이거나 세션이 없거나 다른 기기의 세션이다. 키오스크는 구분할 수 없으므로 '쓸 수 없음'까지만 말하고 직접 안내를 남긴다.
        if (ae.status === 404 || ae.status === 405) { this.staffCallSupported = false; return off("UNSUPPORTED"); }
        const reason = ae.reason;
        // 열린 알림이 없다(409 NO_OPEN_ALERT): 직원이 처리했을 수도, 서버 기록이 어긋났을 수도 있다. 화면을 끝내지 않고 직접 안내를 남긴 채 버튼만 거둔다.
        if (ae.status === 409 && reason === "NO_OPEN_ALERT") return off("NO_ALERT");
        // 그 밖의 409(TURN_IN_PROGRESS 등)는 일시 충돌이다: 잠시 뒤 다시 누를 수 있게 둔다.
        if (ae.status === 409) return this.startCountdown({ ...cur, sending: false, waitS: Math.max(1, Math.ceil((ae.retryAfterMs ?? 2000) / 1000)), notice: "BUSY" });
        if (ae.status === 429) {
          if (reason === "RETRY_LIMIT") return off("LIMIT");
          return this.startCountdown({ ...cur, sending: false, waitS: Math.max(1, Math.ceil((ae.retryAfterMs ?? 1000) / 1000)), notice: "STILL_FAILED" });
        }
        // 401/403: 이 화면(직원 호출·직접 안내·확인 단계)을 AUTH 화면으로 바꾸지 않는다. 안내만 바꾼다(M-2).
        if (ae.auth) return off("AUTH");
      }
      // 네트워크·시간 초과·5xx(502/504 포함): 서버가 처리했는지 모른다. 같은 turn_id를 그대로 두어 다시 누르면 같은 요청이 된다(서버 멱등, M-3).
      this.patch({ staffCall: { ...cur, sending: false, notice: "NETWORK" } });
    }
  }
  private startCountdown(sc: StaffCallView): void {
    this.patch({ staffCall: sc });
    if (sc.waitS <= 0) return;
    const tick = () => {
      const cur = this.view.staffCall;
      if (this.view.state !== "CALL_STAFF" || !cur) return;
      const n = Math.max(0, cur.waitS - 1);
      this.patch({ staffCall: n > 0 ? { ...cur, waitS: n } : { ...cur, waitS: 0, notice: "READY" } }); // 0이 되면 안내(role=status)와 초점 이동이 이어진다(L-4)
      this.callTimer = n > 0 ? this.timers.set(tick, 1000) : null;
    };
    this.callTimer = this.timers.set(tick, 1000);
  }
  private stopCallTimer(): void { if (this.callTimer !== null) { this.timers.clear(this.callTimer); this.callTimer = null; } }

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
      this.retryTurnId = null; this.staffCallSupported = true;
      return this.set({ state: "CALL_STAFF", text: r.response_text, callStaffReason: "DELIVERY_FAILED", staffCall: { canRetry: true, sending: false, waitS: 0, attempts: 0 } });
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
    this.set(this.lastPause ? { state: "WAITING_STAFF", text, pauseReason: this.lastPause } : { state: "WAITING_STAFF", text });
    this.lastPause = undefined;
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
          if (s.state === "ACTIVE") { this.say(s.resume_text, `${id}:resume:${++this.resumeSeq}`); return this.set({ state: "LISTENING", text: s.resume_text }); }
          if (s.state === "ENDED") { this.sessionId = null; return this.set({ state: "ENDED", text: null }); }
          // PAUSED_RISK 또는 모르는 값: 계속 기다린다. 정지 사유는 폴링 응답으로 갱신한다(없으면 미상으로 둔다).
          const pr = s.state === "PAUSED_RISK" ? normalizePauseReason(s.pause_reason) : undefined;
          if (pr !== this.view.pauseReason) this.patch({ pauseReason: pr });
        } catch (e) {
          if (this.gen !== g) return;
          if (statusIs(e, 404)) { this.sessionId = null; return this.set({ state: "IDLE", text: null }); }
          if (asApi(e)?.auth) return this.set({ state: "CALL_STAFF", text: null, callStaffReason: "AUTH" });
          // 그 밖의 오류(재시도 소진 포함)는 계속 폴링하되, 환자에게 상태를 확인하지 못하고 있음을 알리고 직원을 부르도록 안내한다.
          this.patch({ waitNotice: "SERVER_UNREACHABLE" });
        }
      }
    })();
  }

  private fail(e: unknown, dflt: CallStaffReason): void {
    if (statusIs(e, 409)) return this.waitForStaff(null); // 위험 정지 중이거나 순서 어긋남: 상태를 폴링해 확인
    if (statusIs(e, 404)) { this.sessionId = null; return this.set({ state: "IDLE", text: null }); } // 세션 만료
    if (asApi(e)?.auth) return this.set({ state: "CALL_STAFF", text: null, callStaffReason: "AUTH" });
    this.set({ state: "CALL_STAFF", text: null, callStaffReason: dflt }); // 재시도 소진(CallStaffError)과 그 밖의 오류는 같은 직원 호출
  }
}
