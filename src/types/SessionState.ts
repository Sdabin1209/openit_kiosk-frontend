/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: boundary-contracts SessionState (패키지 버전 3.1.2) */


/**
 * 키오스크가 폴링하는 세션 상태(D66). 위험 정지가 풀렸는지와 이어서 할 안내 문장을 알린다.
 */
export interface SessionState {
session_id: string
state: ("ACTIVE" | "PAUSED_RISK" | "ENDED")
/**
 * 직원 재개 뒤 이어서 할 안내 문장. 다음 발화 턴이 접수되면 null이 된다
 */
resume_text: (string | null)
/**
 * state가 PAUSED_RISK일 때 정지 사유(2.1.0, CR-H002). 그 밖의 상태에서는 null 또는 생략. 읽는 쪽은 모르는 값을 OTHER로 취급한다.
 */
pause_reason?: ("RISK" | "REASK_LIMIT" | "OTHER" | null)
}
