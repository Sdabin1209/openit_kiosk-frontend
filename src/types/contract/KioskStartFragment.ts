/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: boundary-contracts KioskStartFragment (패키지 버전 4.0.0) */


/**
 * 키오스크 시작 URL의 조각(`#subject_ref=...&question_set_id=...`)을 `key=value`로 풀어 만든 객체. 쓰는 쪽: 병원 접수(또는 시연 스크립트). 읽는 쪽: kiosk-frontend(api/device.ts parseFragment). 문법: `#` 뒤 `&`로 나눈 `key=value`, 첫 `=`에서만 나누고 값은 percent-decoding(`+`는 공백이 아니다). 쿼리 문자열(`?`)은 서버 로그에 남으므로 쓰지 않는다. 앱은 읽는 즉시 주소창과 기록에서 지운다. 조각이 DeviceConfig보다 먼저다. 4.0.0: device(기기 토큰)를 없앴다 — 기기 인증은 mTLS(D136).
 */
export interface KioskStartFragment {
/**
 * 병원 접수가 넘긴 환자 참조(PUBLIC_API.md 추가 인터페이스 A의 형식). 시작 URL 조각의 subject_ref가 있으면 그것이 먼저다. 키오스크는 이 값을 페이지를 연 뒤 서버가 접수한 첫 세션 시작 한 번에만 쓰고 비운다(다음 환자에게 이전 참조가 붙지 않게, kiosk-frontend start_values.ts createStartHolder). 그래서 이 파일에 고정 값을 두면 페이지를 새로 열 때마다 첫 세션에만 붙는다. 접수 연동이 기기당 고정 참조를 쓸지 환자마다 새 URL 을 쓸지는 설치처 결정이다(head OPEN_GAPS G-SUBJ-1).
 */
subject_ref?: string
/**
 * 3.3.0: 이 기기에 배치된 문진표 ID(ReleaseManifest.question_sets[].id). 배치한 사람(운영자, deploy 기기 설정)이 정한다. 시작 URL 조각의 question_set_id가 있으면 그것이 먼저다. 없고 활성 문진표가 둘 이상이면 키오스크가 선택 화면을 보인다(PUBLIC_API I10). 왜: 표준 임상 흐름에서 어떤 문진을 받을지는 진료 측이 정한다.
 */
question_set_id?: string
}
