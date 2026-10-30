/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/StaffAlertBody.json */


/**
 * 직원 호출 보고 응답을 받아들이는 조건(알림 식별자만 본다).
 */
export interface StaffAlertBody {
alert_id: string
session_id: string
}
