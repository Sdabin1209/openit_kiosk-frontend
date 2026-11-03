/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/QuestionSetListBody.json */


/**
 * GET /v1/question-sets 응답 본문(PUBLIC_API.md I10, 계약 3.3.0): 활성 릴리스의 문진표 목록. 받는 쪽 관대한 읽기 스키마라 모르는 키는 허용한다(ADR 0005). 항목이 비면 문진표가 준비되지 않은 것이다.
 */
export interface QuestionSetListBody {
items: {
/**
 * 3.3.0: 이 기기에 배치된 문진표 ID(ReleaseManifest.question_sets[].id). 배치한 사람(운영자, deploy 기기 설정)이 정한다. 시작 URL 조각의 question_set_id가 있으면 그것이 먼저다. 없고 활성 문진표가 둘 이상이면 키오스크가 선택 화면을 보인다(PUBLIC_API I10). 왜: 표준 임상 흐름에서 어떤 문진을 받을지는 진료 측이 정한다.
 */
question_set_id: string
title: string
version: string
}[]
}
