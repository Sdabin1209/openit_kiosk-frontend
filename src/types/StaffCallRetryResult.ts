/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: boundary-contracts StaffCallRetryResult (패키지 버전 3.1.1) */


/**
 * 재알림 응답(2.1.0, CR-H001). 같은 alert_id로 다시 전달한 결과.
 */
export interface StaffCallRetryResult {
alert_id: string
staff_alert: ("DELIVERED" | "DELIVERY_FAILED")
delivery_attempts: number
/**
 * 이 초가 지나기 전의 재알림은 429. 값은 서비스 설정이며 계약이 아니다.
 */
retry_after_s: number
}
