import { PublicApiClient } from "../../api/client.ts";
import { createStartHolder, loadKioskStart } from "../../api/device.ts";
import { KioskFlow, type KioskView } from "./flow.ts";
import { SttError, WebSpeechStt } from "./stt.ts";
import { ChatLog } from "./chat.ts";
import { renderChat } from "./chatview.ts";
import { MSG, fill } from "./messages.ts";
import { DELIVERY_FAILED_DIRECT_NOTICE, ENDED_RESET_MS, MAX_INPUT_CHARS, NO_STT_NOTICE, REASK_LIMIT_WAIT_NOTICE, REMOTE_STT_NOTICE, RETRY_BUTTON_LABEL, STAFF_CALL_NOTICES } from "./clinical.ts";

// 기기 토큰과 환자 참조는 메모리에만 둔다(주소창 조각은 읽자마자 지운다). 환자 참조는 한 번 쓰면 비운다(다음 환자에게 재사용하지 않는다).
const holder = createStartHolder(() => loadKioskStart(window));
const api = new PublicApiClient({ baseUrl: "/v1", deviceToken: () => holder.deviceToken() });
const flow = new KioskFlow(api, { startValues: () => holder.take() });
const chat = new ChatLog(); // 현재 세션의 대화(메모리에만, 세션이 끝나면 지운다: ADR 0015)
flow.subscribeConversation((e) => chat.accept(e));
const stt = new WebSpeechStt(); // 기본: 기기 안 인식만(D88 U3). 외부 허용은 기기 설정 allow_remote_stt에서만.
void holder.loaded.then((c) => { stt.setAllowRemote(c.allowRemoteStt); return stt.init(); }).then(() => render(flow.current));
const $ = (id: string) => document.getElementById(id) as HTMLElement;
const title = $("title"), text = $("text"), action = $("action") as HTMLButtonElement;
const extendBtn = $("extend") as HTMLButtonElement, secondary = $("secondary") as HTMLButtonElement, staffBtn = $("staffcall") as HTMLButtonElement, notice = $("notice"), manual = $("manual"), countdown = $("countdown"), input = $("manual-input") as HTMLInputElement;

let onAction: () => void = () => {};
let onSecondary: (() => void) | null = null;
let idleTimer: number | undefined;
$("manual-label").textContent = MSG.LABEL_MANUAL_INPUT.text; $("chat").setAttribute("aria-label", MSG.LABEL_CHAT.text); // 정적 HTML에는 환자 노출 문구를 두지 않는다(messages.ts)
input.maxLength = MAX_INPUT_CHARS; // 화면 쪽 제한(임시, clinical.ts)

/** 읽어 주기는 기기 안 한국어 음성(localService)만 쓴다. 없으면 읽지 않고 화면 글자만 보인다(원격 음성은 문장을 외부로 보낼 수 있다). */
function speak(t: string | null) {
  try {
    if (!t || !("speechSynthesis" in window)) return;
    const v = speechSynthesis.getVoices().find((x) => x.localService && x.lang.toLowerCase().startsWith("ko"));
    if (!v) return;
    const u = new SpeechSynthesisUtterance(t); u.lang = "ko-KR"; u.voice = v; speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch { /* 선택 기능 */ }
}

const useStt = () => stt.available() && !flow.current.textFallback;

async function listenOnce() {
  if (!useStt()) { input.focus(); return; }
  action.disabled = true; action.textContent = MSG.BTN_LISTENING.text;
  try { await flow.hear(await stt.listen()); }
  catch (e) { flow.sttError(e instanceof SttError ? e.kind : "OTHER"); } // 거부·오류면 화면 입력으로 대체하고 상한까지만 다시 묻는다
}

/** 일시 장애로 다시 보내는 중이면 환자가 직원을 부르거나 그만둘 수 있게 한다. (문구는 임상 문구가 아니며 임시 UI 문구다.) */
function waitingButtons(v: KioskView) {
  if (!v.retrying) return;
  text.textContent = MSG.BODY_RETRYING.text;
  action.hidden = false; action.textContent = MSG.BTN_CALL_STAFF.text; onAction = () => flow.callStaff();
  secondary.hidden = false; secondary.textContent = MSG.BTN_STOP.text; onSecondary = () => void flow.end();
}

function render(v: KioskView) {
  document.body.classList.toggle("warn", v.state === "CALL_STAFF");
  // 정지 사유는 글자와 data 속성으로 구분한다(색에 의존하지 않는다). 시험·접근성 도구용.
  if (v.state === "WAITING_STAFF" && v.pauseReason) document.body.dataset.pauseReason = v.pauseReason; else delete document.body.dataset.pauseReason;
  const listening = v.state === "LISTENING" || v.state === "REPEAT_PROMPT";
  manual.hidden = !listening || (stt.available() && !v.textFallback);
  if (!listening) { input.value = ""; stt.cancel(); } // 미전송 입력을 남기지 않고, 듣고 있던 마이크도 멈춘다
  action.hidden = false;
  staffBtn.hidden = !listening; staffBtn.disabled = false; staffBtn.textContent = MSG.BTN_CALL_STAFF.text; // 말하기 대기·다시 말하기에서도 언제든 직원을 부를 수 있다
  secondary.hidden = true; onSecondary = null; action.disabled = false; text.textContent = v.text ?? "";
  const notes: string[] = [];
  if (v.startNotice === "NO_SUBJECT_REF") notes.push(MSG.NOTICE_NO_SUBJECT_REF.text);
  if (listening && stt.remote) notes.push(REMOTE_STT_NOTICE); // 외부 인식 허용 설정을 켠 기기에서만
  if (listening && !stt.available() && !stt.remote) notes.push(NO_STT_NOTICE);
  // 유휴 만료 경고(WCAG 2.2.1): 안내(role=status)와 연장 버튼. 초점을 버튼으로 옮겨 키보드·스위치 사용자가 바로 누를 수 있게 한다.
  const warning = v.idleWarnS !== undefined && listening;
  if (warning) notes.push(fill(MSG.IDLE_WARNING, { n: v.idleWarnS! }));
  extendBtn.hidden = !warning; extendBtn.textContent = MSG.BTN_IDLE_EXTEND.text;
  if (warning && !wasWarning) extendBtn.focus();
  if (!warning && wasWarning && listening) (action as HTMLElement).focus(); // 연장한 뒤 초점이 사라진 버튼에 남지 않게
  wasWarning = warning;
  let noticeText = notes.join(" ");
  clearTimeout(idleTimer);
  switch (v.state) {
    case "IDLE": void stt.recheck().then((did) => { if (did && flow.current.state === "IDLE") render(flow.current); }); // 언어 팩 설치 시간 초과였으면 새로고침 없이 다시 확인
      title.textContent = MSG.TITLE_IDLE.text; action.textContent = MSG.BTN_START.text; onAction = () => void flow.start(); break;
    case "STARTING": title.textContent = MSG.TITLE_WAIT.text; action.hidden = true; waitingButtons(v); break;
    case "LISTENING":
      if (!v.text) text.textContent = MSG.BODY_KEEP_TALKING.text; // 응답 문장이 없는 정상 응답에서 빈 화면을 막는다
      title.textContent = MSG.TITLE_LISTENING.text; action.hidden = false; action.textContent = MSG.BTN_SPEAK.text;
      onAction = () => (useStt() ? void listenOnce() : void flow.hear({ text: input.value, confidence: null }).then(() => { input.value = ""; }));
      secondary.hidden = false; secondary.textContent = MSG.BTN_STOP.text; onSecondary = () => void flow.end(); break;
    case "REPEAT_PROMPT":
      title.textContent = MSG.TITLE_REPEAT.text; action.hidden = false; action.textContent = MSG.BTN_SPEAK.text;
      onAction = () => (useStt() ? void listenOnce() : void flow.hear({ text: input.value, confidence: null }).then(() => { input.value = ""; }));
      secondary.hidden = false; secondary.textContent = MSG.BTN_STOP.text; onSecondary = () => void flow.end(); break;
    case "SENDING": title.textContent = v.retrying ? MSG.TITLE_WAIT.text : MSG.TITLE_SENDING.text; action.hidden = true; waitingButtons(v); break;
    case "WAITING_STAFF":
      title.textContent = MSG.TITLE_WAITING_STAFF.text; action.hidden = true;
      // 서버 고정 문장(v.text)이 있으면 항상 그것을 쓴다. 없을 때만 사유별 기본 안내(REASK_LIMIT 문구는 임상 검토 필요, ADR 0014).
      if (!v.text) text.textContent = v.pauseReason === "REASK_LIMIT" ? REASK_LIMIT_WAIT_NOTICE : MSG.BODY_WAIT_DEFAULT.text;
      if (v.waitNotice === "SERVER_UNREACHABLE") text.textContent = MSG.BODY_STATE_UNREACHABLE.text; // 임시 UI 문구
      else if (v.waitNotice === "LONG_WAIT") text.textContent = `${text.textContent} ${MSG.BODY_LONG_WAIT_SUFFIX.text}`;
      break;
    case "CALL_STAFF":
      title.textContent = MSG.TITLE_CALL_STAFF.text;
      text.textContent = v.callStaffReason === "NO_DEVICE_TOKEN" ? MSG.BODY_NO_DEVICE_TOKEN.text
        : v.callStaffReason === "AUTH" ? MSG.BODY_AUTH_DENIED.text
        : v.callStaffReason === "BAD_SUBJECT_REF" ? MSG.BODY_BAD_SUBJECT_REF.text
        : v.callStaffReason === "REPEAT_LIMIT" ? MSG.BODY_REPEAT_LIMIT.text
        : MSG.BODY_CALL_STAFF_DEFAULT.text; action.hidden = false; action.textContent = MSG.BTN_HOME.text;
      onAction = () => void flow.leaveCallStaff();
      if (v.callStaffReason === "DELIVERY_FAILED") {
        // 직원 알림이 닿지 않았다: 직접 직원에게 알리는 것이 우선이고, 처음으로는 한 번 더 확인한다.
        text.textContent = DELIVERY_FAILED_DIRECT_NOTICE; // provisional(임상 검토 전)
        const sc = v.staffCall;
        if (sc && !v.confirmLeave) {
          // 다시 부르기(CR-H001). 카운트다운은 버튼 글자로만 보이고(1초마다 읽어 주지 않게 live 영역을 쓰지 않는다), 안내 문장은 시간 제한 없이 남는다.
          if (sc.canRetry) {
            staffBtn.hidden = false;
            staffBtn.disabled = sc.sending || sc.waitS > 0;
            staffBtn.textContent = sc.sending ? MSG.BTN_SENDING.text : RETRY_BUTTON_LABEL; // 카운트다운은 별도 요소(live 영역 밖 취급)에 둔다
          }
          if (sc.notice) noticeText = STAFF_CALL_NOTICES[sc.notice];
          // 카운트다운이 끝나 버튼이 켜지는 순간: 안내(role=status)를 알리고 키보드 초점을 버튼으로 돌려준다(L-4).
          if (sc.canRetry && sc.waitS === 0 && lastWaitS > 0 && !v.confirmLeave) setTimeout(() => staffBtn.focus(), 0);
          lastWaitS = sc.waitS;
          countdown.hidden = !(sc.canRetry && sc.waitS > 0); countdown.textContent = fill(MSG.COUNTDOWN, { n: sc.waitS });
        }
        if (v.confirmLeave) {
          text.textContent = MSG.BODY_CONFIRM_LEAVE.text;
          action.textContent = MSG.BTN_TOLD_STAFF_HOME.text;
          secondary.hidden = false; secondary.textContent = MSG.BTN_CANCEL.text; onSecondary = () => flow.cancelLeave();
        }
      }
      break;
    case "ENDING": title.textContent = MSG.TITLE_ENDING.text; action.hidden = true; break;
    case "ENDED":
      title.textContent = v.endFailed ? MSG.TITLE_END_FAILED.text : MSG.TITLE_ENDED.text;
      if (v.endFailed) text.textContent = MSG.BODY_END_FAILED.text; // 종료 실패를 숨기지 않는다(임시 UI 문구)
      // 종료 실패 안내는 자동으로 사라지지 않는다: 직원이 확인하고 "처음으로"를 누를 때까지 유지한다(재점검 K-1).
      if (v.endFailed) { action.hidden = false; action.textContent = MSG.BTN_HOME.text; onAction = () => flow.reset(); }
      else { action.hidden = true; idleTimer = window.setTimeout(() => flow.reset(), ENDED_RESET_MS); }
      break;
  }
  if (v.state === "IDLE") action.hidden = false;
  if (v.state === "REPEAT_PROMPT" && v.repeatReason === "NOT_COMMITTED") text.textContent = v.text ?? MSG.BODY_NOT_COMMITTED.text;
  if (v.state === "LISTENING" || v.state === "REPEAT_PROMPT") speak(text.textContent);
  if (v.state !== "CALL_STAFF" || !v.staffCall) lastWaitS = 0;
  if (v.state === "CALL_STAFF" && v.busy) { action.disabled = true; secondary.disabled = true; } else secondary.disabled = false; // report 진행 중 잠금(L-1)
  if (notice.textContent !== noticeText) notice.textContent = noticeText; // 같은 글자를 다시 쓰면 낭독기가 되풀이해 읽을 수 있다
  if (countdown.hidden === false && !(v.state === "CALL_STAFF" && v.staffCall && v.staffCall.waitS > 0)) countdown.hidden = true;
  // 초점은 CALL_STAFF에 처음 들어올 때만 옮긴다(재알림 뒤 다시 그려질 때 환자가 누르던 버튼에서 초점을 빼앗지 않는다).
  if (v.state === "CALL_STAFF" && lastState !== "CALL_STAFF") (action as HTMLElement).focus();
  lastState = v.state;
}
let wasWarning = false;
let lastState: string | null = null, lastWaitS = 0;
let prev: KioskView | null = null;
/** 카운트다운 1초 변화만이면 숫자 한 곳만 바꾼다: 화면 전체를 다시 그리면 aria-live 영역이 1초마다 낭독되고 글자가 깜빡인다. */
function onView(v: KioskView) {
  const p = prev; prev = v;
  const a = p?.staffCall, b = v.staffCall;
  if (p && p.state === "CALL_STAFF" && v.state === "CALL_STAFF" && a && b && a.waitS > 0 && b.waitS > 0 && a.waitS !== b.waitS && a.sending === b.sending && a.notice === b.notice && p.confirmLeave === v.confirmLeave) {
    countdown.textContent = fill(MSG.COUNTDOWN, { n: b.waitS }); return;
  }
  render(v);
}
action.addEventListener("click", () => { flow.touch(); onAction(); });
extendBtn.addEventListener("click", () => flow.touch()); // 연장: 간단한 동작 한 번(WCAG 2.2.1), 몇 번이든 되풀이할 수 있다
staffBtn.addEventListener("click", () => { if (flow.current.state === "CALL_STAFF") void flow.retryStaffCall(); else flow.callStaff(); });
input.addEventListener("input", () => flow.touch());
secondary.addEventListener("click", () => { flow.touch(); onSecondary?.(); });
input.addEventListener("keydown", (e) => { if (e.key === "Enter") onAction(); });
chat.subscribe((v) => renderChat(document, $("chat"), v));
flow.subscribe(onView);
