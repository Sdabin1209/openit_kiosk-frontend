/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/InterventionRequest.json */


/**
 * 직원의 개입 결정 전송 입력.
 */
export interface InterventionRequest {
session_id: string
decision: ("RESUME" | "END")
turn_id: string
}
