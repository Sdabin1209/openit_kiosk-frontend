/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/StaffCallRetryInput.json */


/**
 * 직원 호출 재알림 요청 입력. 같은 turn_id의 재전송은 서버가 같은 응답을 준다(멱등).
 */
export interface StaffCallRetryInput {
/**
 * 근거: 1~64자(PUBLIC_API.md 세션 ID 형식)
 */
session_id: string
/**
 * 근거: 상한 64 는 PUBLIC_API.md 세션·턴 ID 형식과 같다
 */
turn_id: string
}
