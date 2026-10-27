# 경계 문서: kiosk-frontend

- 소유 저장소: 없음. 환자 발화를 저장하지 않는다(브라우저 메모리에서만 다룬다).
- 제공하는 SDK: 없음. 제공하는 서비스 API: 없음(정적 파일, `/healthz`, `/readyz`).
- 이 영역이 제공하는 대역: `mock-server/`(공개 API의 모의 서버, 시나리오: normal, risk_stop, delivery_failed, not_committed, delay, hang, error). 제어 경로 `/__mock/*`는 계약 밖이다.
- 소비하는 계약: I10 공개 API(`PUBLIC_API.md`, 헤드의 제안 계약 v1). 문진 스키마 `FrontendInput`, `TurnFailureSignal`(열거값을 `scripts/check-schema.mjs`로 대조). 지원 버전: boundary-contracts v2.0.2 기준(D66에서 반영한 상태 코드 표, SessionState, push-config, StaffAlert 스키마는 v2에서 바뀌지 않았다. v2의 변경은 모델·절차 계약이라 이 영역의 화면·타입·모의 서버에는 영향이 없고, 모의 서버의 오류 본문 `pipeline_schema_version`만 "2.0"으로 맞췄다. `scripts/check-schema.mjs`가 계약 패키지 버전, Dockerfile ARG, 모의 서버 표기를 대조한다)(이미지 라벨 `io.openit.contracts.boundary`), survey-schema 1.
- 장애 영향: 서버 장애 시 키오스크는 3회 재시도 뒤 직원 호출 화면을 보인다. 이 영역이 죽어도 서버와 다른 영역은 영향이 없다. 직원 콘솔이 죽으면 푸시 알림은 서비스 워커가 브라우저에서 계속 받는다(브라우저 정책에 따름, 확인하지 못함).
- 분리: 이 리포지토리를 통째로 다른 구현으로 바꿔도 된다. 대체 구현은 `docs/design.md` 4절의 대응표와 `test/`의 규칙을 시험으로 쓸 수 있다.
