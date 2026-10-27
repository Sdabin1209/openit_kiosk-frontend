# STATUS

## 한 일
- 설계서 `design.md`, 경계 문서 `boundary.md`, 변경 요청 CR-001~003.
- `api/`(클라이언트: 재시도, 순서, 타임아웃), `mock-server/`, 키오스크 앱, 직원 콘솔(SSE, 푸시 구독 서비스 워커, 개입 결정), 정적 서버, Dockerfile, 스모크 스크립트.
- 시험: `npm test`, `npm run test:dom`(jsdom, 컨테이너), `npm run typecheck`, `npm run check-schema`, `npm run smoke`, `npm run test:e2e`.
- 직원 콘솔 세션 기록 보기: 알림의 '기록 보기'로 대화·저장된 값·세션 알림(규칙 id)을 읽기 전용으로 본다. 같은 화면에서 이어서 진행/종료(확인 단계 유지). 환자 발화는 메모리·DOM에만 두고 닫으면 지운다. `GET /v1/staff/sessions/{id}`(StaffSessionView)는 모의 서버에만 있고 실제 survey-service 구현은 확인하지 못했다.

## 계약 v2.0.2 정렬
Dockerfile `BOUNDARY_CONTRACT=v2.0.2`, 모의 서버 오류 본문 `pipeline_schema_version` "2.0"(이전 "1.0"은 어떤 계약 버전과도 맞지 않던 값). `check-schema`가 계약 버전 표기를 대조하도록 확장했다. 공개 API 응답 모양 변화는 SSE `id:` 설명(이벤트 순번) 한 줄뿐이며 모의 서버는 이미 그렇게 동작한다. 이 영역은 토큰·비밀을 갖지 않는다(VAPID는 공개키만).

## 남은 일 / 막힌 것
- 실제 survey-service와 연동하지 못했다(모의 서버만). 계약 어긋남은 CR-002, 003.
- 헤드리스 Chromium 시험(`npm run test:e2e`)으로 화면 흐름·서비스 워커·푸시 핸들러를 확인했다(`npm run test:e2e`: Playwright 공식 Docker 이미지 안에서 실행, 이 PC에서 우회 없이 통과, 한글 글꼴 표시 확인). 마이크·한국어 STT·푸시 구독/실제 푸시 전달·단말 한글 글꼴은 사람 확인 필요(`docs/runbook.md` 체크리스트).
- 한국어 STT 정확도, 오프라인 글꼴 파일 포함(라이선스), TTS 품질은 미정.
- 의존 버전은 `package-lock.json`으로 고정했다. 이미지 CI 게시(D24)는 deploy와 협의.

## 실행
`npm ci && npm run build && STATIC_DIR=dist MOCK_SCENARIO=risk_stop PORT=8099 node mock-server/main.ts` 로 시연(PORT를 비우면 빈 포트).

## D66 회신 반영 (boundary-contracts v1.3.2)
turn_id 봉투 처리, 상태 코드/Retry-After, 새 스키마 4종, SSE 이벤트 이름·ping, 위험 정지 상태 폴링, push-config. CR-002, CR-003은 회신으로 해소되었다(헤드 확인). 임시 방식(환자가 다시 말해 보기)은 폴링으로 대체했다.

## 세션 기록 보기와 스키마 대기
`check-schema`는 `../survey-service/schema/schemas/StaffSessionView.json`이 생기면 모의 서버 응답을 그 스키마로 검증하고, 없으면 "대상 아님(서버 스키마 대기)"을 출력한다(PASS로 세지 않음). 지금은 대조되지 않은 상태다: 타입(`api/types.ts`)은 요청서의 모양을 그대로 따른 것이다. jsdom 시험은 호스트에 jsdom이 없으면 건너뛰므로(`npm test`의 skipped) `npm run test:dom`으로 컨테이너에서 확인한다.
