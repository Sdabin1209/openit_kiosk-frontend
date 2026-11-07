/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: boundary-contracts StaffCallRetryRequest (패키지 버전 4.0.0) */


/**
 * POST /v1/sessions/{id}/staff-call/retry 본문(2.1.0, CR-H001). 환자 발화·자유 문장 필드는 없다.
 */
export interface StaffCallRetryRequest {
/**
 * 키오스크가 만든 고유 문자열. 같은 값을 다시 보내면 같은 응답(멱등) 근거: 상한 64 는 PUBLIC_API.md 세션·턴 ID 형식과 같다
 */
turn_id: string
}
