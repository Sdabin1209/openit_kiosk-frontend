/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/DecisionRequest.json */


/**
 * 직원의 개입 결정 입력(확인 단계를 거친다). 같은 알림·같은 결정은 같은 turn_id로 간다.
 */
export interface DecisionRequest {
alert_id: string
session_id: string
decision: ("RESUME" | "END")
}
