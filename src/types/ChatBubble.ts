/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/ChatBubble.json */


/**
 * 말풍선 하나.
 */
export interface ChatBubble {
id: string
speaker: ("patient" | "system")
text: string
}
