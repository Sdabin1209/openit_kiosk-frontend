/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/StatusClass.json */


/**
 * 응답 상태 분류 출력. retryable = 같은 요청을 자동으로 다시 보내도 된다. outcomeUnknown = 서버가 처리했는지 모른다(5xx).
 */
export interface StatusClass {
retryable: boolean
outcomeUnknown: boolean
}
