/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/KioskView.json */


/**
 * 키오스크 상태 기계의 출력(화면이 그리는 값). 환자 발화는 담지 않는다(text는 서버 응답 문장).
 */
export type KioskView = {
state: ("IDLE" | "STARTING" | "LISTENING" | "REPEAT_PROMPT" | "SENDING" | "WAITING_STAFF" | "CALL_STAFF" | "ENDING" | "ENDED")
text: (string | null)
callStaffReason?: ("RETRY_EXHAUSTED" | "DELIVERY_FAILED" | "AUTH" | "START_FAILED" | "STAFF_REQUESTED" | "BAD_SUBJECT_REF" | "REPEAT_LIMIT")
repeatReason?: ("EMPTY_STT" | "NOT_COMMITTED")
retrying?: boolean
/**
 * 유휴 만료 경고 중: 만료까지 남은 초(WCAG 2.2.1)
 */
idleWarnS?: number
textFallback?: boolean
startNotice?: "NO_SUBJECT_REF"
waitNotice?: ("SERVER_UNREACHABLE" | "LONG_WAIT")
endFailed?: boolean
confirmLeave?: boolean
pauseReason?: ("RISK" | "REASK_LIMIT" | "OTHER")
staffCall?: StaffCallView
busy?: boolean
}

/**
 * 직원 호출 화면의 '다시 부르기' 상태. 없으면(옛 서버) 기능 없음.
 */
export interface StaffCallView {
canRetry: boolean
sending: boolean
/**
 * 서버가 준 retry_after_s로만 정한다
 */
waitS: number
attempts: number
notice?: ("NO_ALERT" | "STILL_FAILED" | "NETWORK" | "LIMIT" | "UNSUPPORTED" | "REPORT_FAILED" | "AUTH" | "BUSY" | "READY")
}
