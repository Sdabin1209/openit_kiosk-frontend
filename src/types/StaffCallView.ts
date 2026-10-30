/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/StaffCallView.json */


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
