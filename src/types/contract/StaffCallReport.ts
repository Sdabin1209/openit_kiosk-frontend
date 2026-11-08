/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: boundary-contracts StaffCallReport (패키지 버전 5.0.1) */


/**
 * POST /v1/sessions/{id}/staff-call/report 본문(2.1.0, CR-H001). 키오스크의 '직접 알리셨나요?' 응답을 서버에 남긴다.
 */
export interface StaffCallReport {
outcome: ("STAFF_NOTIFIED_MANUALLY" | "NOT_NOTIFIED")
/**
 * 턴 ID(공개 입구 turn_id 와 같은 Id). 5.0.0: 64자 상한 사본을 Id(128) 참조로 바꿨다(D117).
 */
turn_id: string
}
