/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/ConversationEvent.json */


/**
 * 대화 목록의 입력 이벤트. id는 같은 말풍선을 두 번 만들지 않기 위한 키(같은 turn_id의 재전송).
 */
export type ConversationEvent = ({
type: ("PATIENT" | "SYSTEM")
id: string
text: string
} | {
type: "CLEAR"
})
