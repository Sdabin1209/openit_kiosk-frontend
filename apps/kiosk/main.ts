import { PublicApiClient } from "../../api/client.ts";
import { createStartHolder, loadKioskStart } from "../../api/device.ts";
import { KioskFlow, type KioskView } from "./flow.ts";
import { WebSpeechStt } from "./stt.ts";
import { ENDED_RESET_MS, MAX_INPUT_CHARS, NO_STT_NOTICE, REMOTE_STT_NOTICE } from "./clinical.ts";

// 기기 토큰과 환자 참조는 메모리에만 둔다(주소창 조각은 읽자마자 지운다). 환자 참조는 한 번 쓰면 비운다(다음 환자에게 재사용하지 않는다).
const holder = createStartHolder(() => loadKioskStart(window));
const api = new PublicApiClient({ baseUrl: "/v1", deviceToken: () => holder.deviceToken() });
const flow = new KioskFlow(api, { startValues: () => holder.take() });
const stt = new WebSpeechStt(); // 기본: 기기 안 인식만(D88 U3). 외부 허용은 기기 설정 allow_remote_stt에서만.
void holder.loaded.then((c) => { stt.setAllowRemote(c.allowRemoteStt); return stt.init(); }).then(() => render(flow.current));
const $ = (id: string) => document.getElementById(id) as HTMLElement;
const title = $("title"), text = $("text"), action = $("action") as HTMLButtonElement;
const secondary = $("secondary") as HTMLButtonElement, staffBtn = $("staffcall") as HTMLButtonElement, notice = $("notice"), manual = $("manual"), input = $("manual-input") as HTMLInputElement;

let onAction: () => void = () => {};
let onSecondary: (() => void) | null = null;
let idleTimer: number | undefined;
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
  action.disabled = true; action.textContent = "듣고 있어요…";
  try { await flow.hear(await stt.listen()); }
  catch (e) { flow.sttError(e instanceof Error ? e.message : null); } // 거부·오류면 화면 입력으로 대체하고 상한까지만 다시 묻는다
}

/** 일시 장애로 다시 보내는 중이면 환자가 직원을 부르거나 그만둘 수 있게 한다. (문구는 임상 문구가 아니며 임시 UI 문구다.) */
function waitingButtons(v: KioskView) {
  if (!v.retrying) return;
  text.textContent = "연결이 느려 다시 시도하고 있어요. 기다리기 어려우시면 아래 버튼을 눌러 주세요.";
  action.hidden = false; action.textContent = "직원 부르기"; onAction = () => flow.callStaff();
  secondary.hidden = false; secondary.textContent = "그만하기"; onSecondary = () => void flow.end();
}

function render(v: KioskView) {
  document.body.classList.toggle("warn", v.state === "CALL_STAFF");
  const listening = v.state === "LISTENING" || v.state === "REPEAT_PROMPT";
  manual.hidden = !listening || (stt.available() && !v.textFallback);
  if (!listening) { input.value = ""; stt.cancel(); } // 미전송 입력을 남기지 않고, 듣고 있던 마이크도 멈춘다
  action.hidden = false;
  staffBtn.hidden = !listening; // 말하기 대기·다시 말하기에서도 언제든 직원을 부를 수 있다
  secondary.hidden = true; onSecondary = null; action.disabled = false; text.textContent = v.text ?? "";
  const notes: string[] = [];
  if (v.startNotice === "NO_SUBJECT_REF") notes.push("접수 정보 없이 시작했습니다. 직원에게 알려 주세요.");
  if (listening && stt.remote) notes.push(REMOTE_STT_NOTICE); // 외부 인식 허용 설정을 켠 기기에서만
  if (listening && !stt.available() && !stt.remote) notes.push(NO_STT_NOTICE);
  notice.textContent = notes.join(" ");
  clearTimeout(idleTimer);
  switch (v.state) {
    case "IDLE": void stt.recheck().then((did) => { if (did && flow.current.state === "IDLE") render(flow.current); }); // 언어 팩 설치 시간 초과였으면 새로고침 없이 다시 확인
      title.textContent = "문진을 시작합니다"; action.textContent = "시작하기"; onAction = () => void flow.start(); break;
    case "STARTING": title.textContent = "잠시만 기다려 주세요"; action.hidden = true; waitingButtons(v); break;
    case "LISTENING":
      if (!v.text) text.textContent = "계속 말씀해 주세요."; // 응답 문장이 없는 정상 응답에서 빈 화면을 막는다
      title.textContent = "말씀해 주세요"; action.hidden = false; action.textContent = "말하기";
      onAction = () => (useStt() ? void listenOnce() : void flow.hear({ text: input.value, confidence: null }).then(() => { input.value = ""; }));
      secondary.hidden = false; secondary.textContent = "그만하기"; onSecondary = () => void flow.end(); break;
    case "REPEAT_PROMPT":
      title.textContent = "다시 말씀해 주세요"; action.hidden = false; action.textContent = "말하기";
      onAction = () => (useStt() ? void listenOnce() : void flow.hear({ text: input.value, confidence: null }).then(() => { input.value = ""; }));
      secondary.hidden = false; secondary.textContent = "그만하기"; onSecondary = () => void flow.end(); break;
    case "SENDING": title.textContent = v.retrying ? "잠시만 기다려 주세요" : "확인하고 있어요"; action.hidden = true; waitingButtons(v); break;
    case "WAITING_STAFF":
      title.textContent = "직원이 곧 도와드립니다"; action.hidden = true;
      if (!v.text) text.textContent = "그대로 기다려 주세요. 직원이 오면 이어서 안내해 드립니다.";
      if (v.waitNotice === "SERVER_UNREACHABLE") text.textContent = "상태를 확인하지 못하고 있어요. 가까이 있는 직원에게 알려 주세요."; // 임시 UI 문구
      else if (v.waitNotice === "LONG_WAIT") text.textContent = `${text.textContent} 오래 걸리면 가까이 있는 직원에게 알려 주세요.`;
      break;
    case "CALL_STAFF":
      title.textContent = "직원을 불러 주세요";
      text.textContent = v.callStaffReason === "NO_DEVICE_TOKEN" ? "이 기기는 설정이 필요합니다. 가까이 있는 직원에게 알려 주세요."
        : v.callStaffReason === "AUTH" ? "이 기기의 인증이 거부되었습니다. 가까이 있는 직원에게 알려 주세요."
        : v.callStaffReason === "BAD_SUBJECT_REF" ? "접수 정보를 확인할 수 없습니다. 가까이 있는 직원에게 알려 주세요."
        : v.callStaffReason === "REPEAT_LIMIT" ? "여러 번 알아듣지 못했어요. 가까이 있는 직원에게 알려 주세요."
        : "가까이 있는 직원에게 알려 주세요."; action.hidden = false; action.textContent = "처음으로";
      onAction = () => void flow.leaveCallStaff();
      if (v.callStaffReason === "DELIVERY_FAILED") {
        // 직원 알림이 닿지 않았다: 직접 직원에게 알리는 것이 우선이고, 처음으로는 한 번 더 확인한다.
        text.textContent = "직원에게 알림이 닿지 않았을 수 있어요. 가까이 있는 직원에게 직접 알려 주세요.";
        if (v.confirmLeave) {
          text.textContent = "직원에게 직접 알리셨나요? 알리지 않았다면 취소를 눌러 직원을 찾아 주세요.";
          action.textContent = "직접 알렸어요, 처음으로";
          secondary.hidden = false; secondary.textContent = "취소"; onSecondary = () => flow.cancelLeave();
        }
      }
      break;
    case "ENDING": title.textContent = "마무리하고 있어요"; action.hidden = true; break;
    case "ENDED":
      title.textContent = v.endFailed ? "종료를 서버에 알리지 못했습니다" : "수고하셨습니다";
      if (v.endFailed) text.textContent = "가까이 있는 직원에게 알려 주세요."; // 종료 실패를 숨기지 않는다(임시 UI 문구)
      // 종료 실패 안내는 자동으로 사라지지 않는다: 직원이 확인하고 "처음으로"를 누를 때까지 유지한다(재점검 K-1).
      if (v.endFailed) { action.hidden = false; action.textContent = "처음으로"; onAction = () => flow.reset(); }
      else { action.hidden = true; idleTimer = window.setTimeout(() => flow.reset(), ENDED_RESET_MS); }
      break;
  }
  if (v.state === "IDLE") action.hidden = false;
  if (v.state === "REPEAT_PROMPT" && v.repeatReason === "NOT_COMMITTED") text.textContent = v.text ?? "저장하지 못했어요. 다시 말씀해 주세요.";
  if (v.state === "LISTENING" || v.state === "REPEAT_PROMPT") speak(text.textContent);
  if (v.state === "CALL_STAFF") (action as HTMLElement).focus();
}
action.addEventListener("click", () => { flow.touch(); onAction(); });
staffBtn.addEventListener("click", () => flow.callStaff());
input.addEventListener("input", () => flow.touch());
secondary.addEventListener("click", () => { flow.touch(); onSecondary?.(); });
input.addEventListener("keydown", (e) => { if (e.key === "Enter") onAction(); });
flow.subscribe(render);
