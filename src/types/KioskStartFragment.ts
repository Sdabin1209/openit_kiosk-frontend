/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: boundary-contracts KioskStartFragment (패키지 버전 3.4.7) */


/**
 * 키오스크 시작 URL의 조각(`#device=...&subject_ref=...&question_set_id=...`)을 `key=value`로 풀어 만든 객체. 쓰는 쪽: 병원 접수(또는 시연 스크립트). 읽는 쪽: kiosk-frontend(api/device.ts parseFragment). 문법: `#` 뒤 `&`로 나눈 `key=value`, 첫 `=`에서만 나누고 값은 percent-decoding(`+`는 공백이 아니다). 쿼리 문자열(`?`)은 서버 로그에 남으므로 쓰지 않는다. 앱은 읽는 즉시 주소창과 기록에서 지운다. 조각이 DeviceConfig보다 먼저다. [3.4.4 검토 B-28-9: 기기 인증은 mTLS 가 기본이고(PUBLIC_API F절) 기기 토큰 필드는 F-1 호환용으로 남긴다. 제거는 다음 MAJOR 4.0.0.]
 */
export interface KioskStartFragment {
/**
 * @deprecated
 * (폐기 예정, 2.3.0) 기기 토큰. 2.3.0부터 키오스크 기기 인증은 게이트웨이의 클라이언트 인증서(mTLS, ADR 0012)라 이 값이 필요 없다. 2.x 호환으로만 남고 3.0.0에서 없어진다. 있으면 /v1/sessions* 요청에 `Authorization: Bearer`로 실린다. 비밀 값.
 */
device?: string
/**
 * 병원 접수가 넘긴 환자 참조(PUBLIC_API.md 추가 인터페이스 A의 형식). 기기당 고정 참조인지 환자마다 새 값인지는 미정(사용자 확인 대기). 시작 URL 조각의 subject_ref가 있으면 그것이 먼저다.
 */
subject_ref?: string
/**
 * 3.3.0: 이 기기에 배치된 문진표 ID(ReleaseManifest.question_sets[].id). 배치한 사람(운영자, deploy 기기 설정)이 정한다. 시작 URL 조각의 question_set_id가 있으면 그것이 먼저다. 없고 활성 문진표가 둘 이상이면 키오스크가 선택 화면을 보인다(PUBLIC_API I10). 왜: 표준 임상 흐름에서 어떤 문진을 받을지는 진료 측이 정한다.
 */
question_set_id?: string
}
