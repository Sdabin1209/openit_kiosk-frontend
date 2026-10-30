// 대화 목록 컴포넌트. 입력: ConversationEvent(schemas/ConversationEvent.json). 출력: ChatView(schemas/ChatView.json, 뷰 모델). 상태 기계·API·DOM을 모른다.
// 환자 발화와 시스템 응답을 시간순으로 메모리에만 둔다. 저장소·쿠키·콘솔에 쓰지 않는다(영역 원칙, ADR 0015).
import { ChatView as vChatView, ConversationEvent as vEvent } from "../types/validators.gen.cjs";
import type { ChatBubble } from "../types/ChatBubble.ts";
import type { ChatView } from "../types/ChatView.ts";
import type { ConversationEvent } from "../types/ConversationEvent.ts";

export type { ChatBubble, ChatView, ConversationEvent };

/** 화면에 남기는 말풍선 수의 상한. 왜: 한 세션이 길어져도 메모리가 무한히 커지지 않게 하는 안전 상한이다. 값 100은 임의(측정 안 함), 넘으면 가장 오래된 것부터 버린다(ADR 0015). */
export const MAX_BUBBLES = 100; // schemas/ChatView.json의 maxItems와 같은 값(스키마가 정본)

export class ChatLog {
  private bubbles: ChatBubble[] = [];
  private listeners = new Set<(v: ChatView) => void>();

  get current(): ChatView { return { bubbles: this.bubbles.slice() }; }
  subscribe(fn: (v: ChatView) => void): () => void {
    this.listeners.add(fn); fn(this.current);
    return () => this.listeners.delete(fn);
  }

  accept(e: ConversationEvent): void {
    if (!vEvent(e)) return; // 빈 말·모르는 이벤트는 말풍선이 아니다(스키마가 받아들이는 조건의 전부)
    if (e.type === "CLEAR") {
      if (this.bubbles.length === 0) return;
      this.bubbles = [];
    } else {
      if (this.bubbles.some((b) => b.id === e.id)) return;
      this.bubbles.push({ id: e.id, speaker: e.type === "PATIENT" ? "patient" : "system", text: e.text });
      if (this.bubbles.length > MAX_BUBBLES) this.bubbles.splice(0, this.bubbles.length - MAX_BUBBLES);
    }
    const v = this.current;
    if (!vChatView(v)) throw new Error("ChatView schema violation"); // 내는 쪽이 검증한다
    for (const l of this.listeners) l(v);
  }
}
