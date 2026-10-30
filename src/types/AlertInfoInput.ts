/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/AlertInfoInput.json */


/**
 * 알림 보조 정보 입력: 계약 StaffAlert의 2.1.0 선택 필드만 읽는다. 모르는 값도 그대로 보인다(관대하게 읽기).
 */
export interface AlertInfoInput {
delivery_attempts?: number
last_delivery_status?: string
manual_notice_outcome?: (string | null)
manual_notice_reported_at?: (string | null)
pause_reason?: (string | null)
}
