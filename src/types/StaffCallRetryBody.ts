/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/StaffCallRetryBody.json */


/**
 * 직원 호출 재알림 응답을 받아들이는 조건. retry_after_s가 없으면 버튼 비활성 시간을 지어내야 하므로 성공으로 보지 않는다.
 */
export interface StaffCallRetryBody {
alert_id: string
staff_alert: ("DELIVERED" | "DELIVERY_FAILED")
delivery_attempts: number
retry_after_s: number
}
