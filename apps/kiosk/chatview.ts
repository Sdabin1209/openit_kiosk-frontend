import { MSG } from "./messages.ts";
// ChatView를 DOM에 그린다. 글자는 textContent로만 넣는다(발화의 HTML이 해석되지 않게 한다).
// 스레드는 대화 목록(말풍선)에 현재 화면 문구(status)를 마지막 시스템 말풍선으로 잇는다(ADR 0023).
// status가 마지막 시스템 말풍선과 같은 글이면 그 말풍선이 현재 질문이다(같은 글을 두 번 그리지 않는다).
// 현재 질문의 글 요소에 id="text"를 단다. 왜 다시 그리지 않고 덧붙이나: role=log 영역을 통째로 바꾸면 낭독기가 지난 말까지 다시 읽는다.
type Bubble = { id?: string; speaker: "patient" | "system"; text: string };

function item(doc: Document, speaker: "patient" | "system", text: string, cls = ""): HTMLLIElement {
  const li = doc.createElement("li");
  li.className = (speaker + " " + cls).trim();
  const who = doc.createElement("span");
  who.className = "who";
  who.textContent = speaker === "patient" ? MSG.CHAT_PATIENT.text : MSG.CHAT_SYSTEM.text; // 임시 UI 문구(messages.ts)
  const msg = doc.createElement("span");
  msg.className = "msg";
  msg.textContent = text;
  li.append(who, msg);
  return li;
}

export function renderChat(doc: Document, list: HTMLElement, v: { bubbles: ReadonlyArray<Bubble> }, status: string | null = null): void {
  const rows = [...list.children].filter((e) => !(e as HTMLElement).dataset.status) as HTMLElement[];
  const same = rows.length <= v.bubbles.length && rows.every((r, i) => r.dataset.id === (v.bubbles[i].id ?? String(i)));
  if (!same) { list.replaceChildren(); rows.length = 0; }
  const have = same ? rows.length : 0;
  const old = list.querySelector<HTMLElement>("[data-status]");
  old?.remove(); // 상태 말풍선은 항상 맨 끝이다: 새 말풍선이 그 앞에 들어가도록 먼저 뗀다
  for (let i = have; i < v.bubbles.length; i++) {
    const b = v.bubbles[i];
    const li = item(doc, b.speaker, b.text);
    li.dataset.id = b.id ?? String(i);
    list.append(li);
  }
  const lastSys = [...v.bubbles].reverse().find((b) => b.speaker === "system");
  const dup = status !== null && lastSys !== undefined && lastSys.text === status;
  let current: HTMLElement | null = null;
  if (status !== null && !dup) {
    const li = item(doc, "system", status, "status");
    li.dataset.status = "1";
    list.append(li);
    current = li;
  } else if (dup) {
    const rowsNow = [...list.children] as HTMLElement[];
    for (let i = v.bubbles.length - 1; i >= 0; i--) if (v.bubbles[i] === lastSys) { current = rowsNow[i]; break; }
  } else if (lastSys) {
    const rowsNow = [...list.children] as HTMLElement[];
    for (let i = v.bubbles.length - 1; i >= 0; i--) if (v.bubbles[i] === lastSys) { current = rowsNow[i]; break; }
  }
  for (const e of list.querySelectorAll("[id=text]")) e.removeAttribute("id");
  current?.querySelector(".msg")?.setAttribute("id", "text");
  list.hidden = list.children.length === 0;
  list.scrollTop = list.scrollHeight; // 가장 최근 말이 보이게 아래로
}
