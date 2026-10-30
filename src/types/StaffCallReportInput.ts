/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/StaffCallReportInput.json */


/**
 * 환자의 직접 통지 보고 입력.
 */
export interface StaffCallReportInput {
session_id: string
outcome: ("STAFF_NOTIFIED_MANUALLY" | "NOT_NOTIFIED")
turn_id: string
}
