/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/SessionStateBody.json */


/**
 * 세션 상태 응답을 받아들이는 조건. state의 모르는 값도 받는다(계속 기다린다, 관대하게 읽기).
 */
export interface SessionStateBody {
state: string
resume_text: (string | null)
pause_reason?: (string | null)
}
