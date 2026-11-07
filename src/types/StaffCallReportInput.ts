/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/StaffCallReportInput.json */


/**
 * 환자의 직접 통지 보고 입력.
 */
export interface StaffCallReportInput {
/**
 * 근거: 1~64자(PUBLIC_API.md 세션 ID 형식)
 */
session_id: string
outcome: ("STAFF_NOTIFIED_MANUALLY" | "NOT_NOTIFIED")
/**
 * 근거: 상한 64 는 PUBLIC_API.md 세션·턴 ID 형식과 같다
 */
turn_id: string
}
