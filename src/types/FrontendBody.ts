/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/FrontendBody.json */


/**
 * 턴·종료·개입 응답 본문을 받아들이는 조건(문진 스키마 FrontendInput의 읽는 쪽 부분집합, 모르는 키 허용). 어기면 성공으로 취급하지 않고 재시도한다(FAULT_POLICY 원칙 10).
 */
export interface FrontendBody {
response_text: (string | null)
turn_failure_signal: (null | {
session_id: string
write_committed: ("COMMITTED" | "NOT_COMMITTED")
staff_alert: ("NONE" | "DELIVERED" | "DELIVERY_FAILED")
})
}
