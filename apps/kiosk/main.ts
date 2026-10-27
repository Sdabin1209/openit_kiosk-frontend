import { PublicApiClient } from "../../api/client.ts";
import { loadKioskStart, type KioskStart } from "../../api/device.ts";
import { KioskFlow, type KioskView } from "./flow.ts";
import { WebSpeechStt } from "./stt.ts";

// 기기 토큰과 환자 참조는 메모리에만 둔다(주소창 조각은 읽자마자 지운다).
const held: KioskStart = { deviceToken: null, subjectRef: null, subjectInvalid: false };
const ready = loadKioskStart(window).then((s) => { Object.assign(held, s); return held; });
const api = new PublicApiClient({ baseUrl: "/v1", deviceToken: () => held.deviceToken });
const flow = new KioskFlow(api, { startValues: () => ready });
const stt = new WebSpeechStt();
const $ = (id: string) => document.getElementById(id) as HTMLElement;
const title = $("title"), text = $("text"), action = $("action") as HTMLButtonElement;
const secondary = $("secondary") as HTMLButtonElement, manual = $("manual"), input = $("manual-input") as HTMLInputElement;

let onAction: () => void = () => {};
let onSecondary: (() => void) | null = null;
let idleTimer: number | undefined;

function speak(t: string | null) {
  try { if (t && "speechSynthesis" in window) { const u = new SpeechSynthesisUtterance(t); u.lang = "ko-KR"; speechSynthesis.cancel(); speechSynthesis.speak(u); } } catch { /* 선택 기능 */ }
}

async function listenOnce() {
  if (!stt.available()) { input.focus(); return; }
  action.disabled = true; action.textContent = "듣고 있어요…";
  try { await flow.hear(await stt.listen()); }
  catch { await flow.hear(null); }
}

function render(v: KioskView) {
  document.body.classList.toggle("warn", v.state === "CALL_STAFF");
  manual.hidden = !(v.state === "LISTENING" || v.state === "REPEAT_PROMPT") || stt.available();
  action.hidden = false;
  secondary.hidden = true; onSecondary = null; action.disabled = false; text.textContent = v.text ?? "";
  clearTimeout(idleTimer);
  switch (v.state) {
    case "IDLE": title.textContent = "문진을 시작합니다"; action.textContent = "시작하기"; onAction = () => void flow.start(); break;
    case "STARTING": title.textContent = "잠시만 기다려 주세요"; action.hidden = true; break;
    case "LISTENING":
      title.textContent = "말씀해 주세요"; action.hidden = false; action.textContent = "말하기";
      onAction = () => (stt.available() ? void listenOnce() : void flow.hear({ text: input.value, confidence: null }).then(() => { input.value = ""; }));
      secondary.hidden = false; secondary.textContent = "그만하기"; onSecondary = () => void flow.end(); break;
    case "REPEAT_PROMPT":
      title.textContent = "다시 말씀해 주세요"; action.hidden = false; action.textContent = "말하기";
      onAction = () => (stt.available() ? void listenOnce() : void flow.hear({ text: input.value, confidence: null }).then(() => { input.value = ""; })); break;
    case "SENDING": title.textContent = "확인하고 있어요"; action.hidden = true; break;
    case "WAITING_STAFF":
      title.textContent = "직원이 곧 도와드립니다"; action.hidden = true;
      if (!v.text) text.textContent = "그대로 기다려 주세요. 직원이 오면 이어서 안내해 드립니다."; break;
    case "CALL_STAFF":
      title.textContent = "직원을 불러 주세요";
      text.textContent = v.callStaffReason === "NO_DEVICE_TOKEN" ? "이 기기는 설정이 필요합니다. 가까이 있는 직원에게 알려 주세요."
        : v.callStaffReason === "AUTH" ? "이 기기의 인증이 거부되었습니다. 가까이 있는 직원에게 알려 주세요."
        : v.callStaffReason === "BAD_SUBJECT_REF" ? "접수 정보를 확인할 수 없습니다. 가까이 있는 직원에게 알려 주세요."
        : "가까이 있는 직원에게 알려 주세요."; action.hidden = false; action.textContent = "처음으로";
      onAction = () => flow.reset(); break;
    case "ENDING": title.textContent = "마무리하고 있어요"; action.hidden = true; break;
    case "ENDED": title.textContent = "수고하셨습니다"; action.hidden = true; idleTimer = window.setTimeout(() => flow.reset(), 8000); break;
  }
  if (v.state === "IDLE") action.hidden = false;
  if (v.state === "REPEAT_PROMPT" && v.repeatReason === "NOT_COMMITTED") text.textContent = v.text ?? "저장하지 못했어요. 다시 말씀해 주세요.";
  if (v.state === "LISTENING" || v.state === "REPEAT_PROMPT") speak(text.textContent);
  if (v.state === "CALL_STAFF") (action as HTMLElement).focus();
}
action.addEventListener("click", () => onAction());
secondary.addEventListener("click", () => onSecondary?.());
input.addEventListener("keydown", (e) => { if (e.key === "Enter") onAction(); });
flow.subscribe(render);
