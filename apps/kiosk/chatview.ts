import { MSG } from "./messages.ts";
// ChatView를 DOM에 그린다. 글자는 textContent로만 넣는다(발화의 HTML이 해석되지 않게 한다).
export function renderChat(doc: Document, list: HTMLElement, v: { bubbles: ReadonlyArray<{ speaker: "patient" | "system"; text: string }> }): void {
  list.replaceChildren();
  for (const b of v.bubbles) {
    const li = doc.createElement("li");
    li.className = b.speaker;
    const who = doc.createElement("span");
    who.className = "who";
    who.textContent = b.speaker === "patient" ? MSG.CHAT_PATIENT.text : MSG.CHAT_SYSTEM.text; // 임시 UI 문구(messages.ts)
    const msg = doc.createElement("span");
    msg.className = "msg";
    msg.textContent = b.text;
    li.append(who, msg);
    list.append(li);
  }
  list.hidden = v.bubbles.length === 0;
  list.scrollTop = list.scrollHeight; // 가장 최근 말이 보이게
}
