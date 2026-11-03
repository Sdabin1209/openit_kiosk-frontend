/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/KioskView.json */


/**
 * 키오스크 상태 기계의 출력(화면이 그리는 값). 환자 발화는 담지 않는다(text는 서버 응답 문장).
 */
export type KioskView = {
state: ("IDLE" | "CHOOSING" | "NOT_OPEN" | "STARTING" | "LISTENING" | "REPEAT_PROMPT" | "SENDING" | "WAITING_STAFF" | "CALL_STAFF" | "ENDING" | "ENDED")
text: (string | null)
callStaffReason?: ("RETRY_EXHAUSTED" | "DELIVERY_FAILED" | "AUTH" | "START_FAILED" | "STAFF_REQUESTED" | "BAD_SUBJECT_REF" | "REPEAT_LIMIT")
repeatReason?: "EMPTY_STT"
retrying?: boolean
/**
 * SENDING 대기 중 화면 피드백 단계(D125, Nielsen): 1초 뒤 THINKING(진행 표시), 10초 뒤 PLEASE_WAIT(안내 문구). 없으면 아직 1초 전
 */
waitHint?: ("THINKING" | "PLEASE_WAIT")
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
/**
 * CHOOSING에서 고를 문진표(활성 목록의 ID·제목)
 * 
 * @minItems 1
 */
choices?: [{
/**
 * 3.3.0: 이 기기에 배치된 문진표 ID(ReleaseManifest.question_sets[].id). 배치한 사람(운영자, deploy 기기 설정)이 정한다. 시작 URL 조각의 question_set_id가 있으면 그것이 먼저다. 없고 활성 문진표가 둘 이상이면 키오스크가 선택 화면을 보인다(PUBLIC_API I10). 왜: 표준 임상 흐름에서 어떤 문진을 받을지는 진료 측이 정한다.
 */
id: string
title: string
}, ...({
/**
 * 3.3.0: 이 기기에 배치된 문진표 ID(ReleaseManifest.question_sets[].id). 배치한 사람(운영자, deploy 기기 설정)이 정한다. 시작 URL 조각의 question_set_id가 있으면 그것이 먼저다. 없고 활성 문진표가 둘 이상이면 키오스크가 선택 화면을 보인다(PUBLIC_API I10). 왜: 표준 임상 흐름에서 어떤 문진을 받을지는 진료 측이 정한다.
 */
id: string
title: string
})[]]
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
