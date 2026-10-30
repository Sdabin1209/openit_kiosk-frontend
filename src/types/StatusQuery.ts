/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/StatusQuery.json */


/**
 * 응답 상태 분류 입력: HTTP 상태와 오류 본문 details.reason(없으면 null).
 */
export interface StatusQuery {
status: number
reason: (string | null)
}
