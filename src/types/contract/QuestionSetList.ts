/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: boundary-contracts QuestionSetList (패키지 버전 5.0.1) */


/**
 * 3.4.18: GET /v1/question-sets(공개 API) 응답. 활성 릴리스의 문진표 전부(PUBLIC_API.md 24행). 1개 이상이다.
 */
export interface QuestionSetList {
/**
 * @minItems 1
 */
items: [{
/**
 * 근거: 길이 상한 128 은 설계 상한(CONVENTIONS 2절, 측정 안 함)
 */
question_set_id: string
title: string
version: string
}, ...({
/**
 * 근거: 길이 상한 128 은 설계 상한(CONVENTIONS 2절, 측정 안 함)
 */
question_set_id: string
title: string
version: string
})[]]
}
