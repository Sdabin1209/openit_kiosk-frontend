/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/SessionStartBody.json */


export interface SessionStartBody {
kind: "SESSION_START"
/**
 * 예약 값 start·end·idle-expire도 허용
 */
turn_id?: string
subject_ref?: (string | null)
/**
 * 문진할 문진표 ID(FrontendMessage SESSION_START와 같다). 활성 문진표가 하나면 생략할 수 있고 둘 이상이면 필수(검사는 서비스).
 */
question_set_id?: string
}
