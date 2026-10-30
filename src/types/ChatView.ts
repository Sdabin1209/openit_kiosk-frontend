/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/ChatView.json */


/**
 * 대화 목록의 출력(뷰 모델). 최대 100개(임의 값, 측정 안 함, ADR 0015).
 */
export interface ChatView {
/**
 * @maxItems 100
 */
bubbles: ChatBubble[]
}
/**
 * 말풍선 하나.
 */
export interface ChatBubble {
id: string
speaker: ("patient" | "system")
text: string
}
