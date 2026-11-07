/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/InterventionRequest.json */


/**
 * 직원의 개입 결정 전송 입력.
 */
export interface InterventionRequest {
/**
 * 근거: 1~64자(PUBLIC_API.md 세션 ID 형식)
 */
session_id: string
decision: ("RESUME" | "END")
/**
 * 근거: 상한 64 는 PUBLIC_API.md 세션·턴 ID 형식과 같다
 */
turn_id: string
}
