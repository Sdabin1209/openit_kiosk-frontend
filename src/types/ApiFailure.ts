/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/ApiFailure.json */


/**
 * 링크가 던지는 오류의 데이터 모양. 업무 컴포넌트는 클래스를 가져오지 않고 name과 이 필드만 읽는다.
 */
export type ApiFailure = {
name: ("ApiError" | "CallStaffError" | "AbortedError" | "BadBodyError")
/**
 * ApiError만
 */
status?: number
/**
 * ApiError: 오류 본문 code. 413·414·431은 INVALID_RECORD
 */
code?: (string | null)
/**
 * ApiError: 본문 details.reason
 */
reason?: (string | null)
retryAfterMs?: (number | null)
/**
 * CallStaffError만
 */
attempts?: number
}
