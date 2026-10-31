/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: boundary-contracts BoundaryError (패키지 버전 3.1.2) */


/**
 * 경계 호출(SDK·서비스 API)의 모든 실패는 이 형식이다. 호출자는 code와 retryable만으로 다음 행동을 정할 수 있어야 한다.
 */
export interface BoundaryError {
pipeline_schema_version: string
code: ("NOT_FOUND" | "INVALID_RECORD" | "UNSUPPORTED_VERSION" | "CONFLICT" | "INTEGRITY_ERROR" | "FAILED_PRECONDITION" | "PERMISSION_DENIED" | "UNAVAILABLE")
message: string
retryable: boolean
details?: {

}
/**
 * 영역이 계약을 바꾸지 않고 덧붙이는 부가 정보. 키는 영역 이름(예: 'model-lab')이고 값은 그 영역이 정한다. 다른 영역은 이해하지 못해도 보존하고 전달해야 하며, 판단에 쓰지 않는다. 여러 영역이 필요로 하게 되면 정식 필드로 올린다.
 */
ext?: {

}
}
