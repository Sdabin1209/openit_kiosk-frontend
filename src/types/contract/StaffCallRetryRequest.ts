/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: boundary-contracts StaffCallRetryRequest (패키지 버전 5.0.0) */


/**
 * POST /v1/sessions/{id}/staff-call/retry 본문(2.1.0, CR-H001). 환자 발화·자유 문장 필드는 없다.
 */
export interface StaffCallRetryRequest {
/**
 * 턴 ID(공개 입구 turn_id 와 같은 Id). 5.0.0: 64자 상한 사본을 Id(128) 참조로 바꿨다(D117).
 */
turn_id: string
}
