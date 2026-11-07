/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/SessionStartBody.json */


export interface SessionStartBody {
kind: "SESSION_START"
/**
 * 새 세션의 첫 턴 ID로 기록한다. 예약 값 start·end·idle-expire도 허용. 세션 시작은 멱등이 아니며 이 값으로 재전송을 판별하지 않는다(PUBLIC_API 세션 시작, 4.0.1)
 */
turn_id?: string
/**
 * 병원이 정한 불투명 환자·방문 참조
 */
subject_ref?: string
/**
 * 문진할 문진표 ID(FrontendMessage SESSION_START와 같다). 활성 문진표가 하나면 생략할 수 있고 둘 이상이면 필수(검사는 서비스).
 */
question_set_id?: string
}
