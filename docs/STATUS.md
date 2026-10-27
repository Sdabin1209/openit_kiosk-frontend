# STATUS

## 한 일
- 설계서 `design.md`, 경계 문서 `boundary.md`, 변경 요청 CR-001~003.
- `api/`(클라이언트: 재시도, 순서, 타임아웃), `mock-server/`, 키오스크 앱, 직원 콘솔(SSE, 푸시 구독 서비스 워커, 개입 결정), 정적 서버, Dockerfile, 스모크 스크립트.
- 시험: `npm test`(43개), `npm run typecheck`, `npm run check-schema`, `npm run smoke`.

## 남은 일 / 막힌 것
- 실제 survey-service와 연동하지 못했다(모의 서버만). 계약 어긋남은 CR-002, 003.
- 헤드리스 Chromium 시험(`npm run test:e2e`, 9개)으로 화면 흐름·서비스 워커·푸시 핸들러를 확인했다(단, 9/9는 sudo 없이 deb을 풀어 LD_LIBRARY_PATH로 가린 우회 환경의 결과이며 표준 전제를 갖춘 깨끗한 환경에서는 아직 못 돌렸다. 전제는 `npm run doctor`가 점검한다). 마이크·한국어 STT·푸시 구독/실제 푸시 전달·단말 한글 글꼴은 사람 확인 필요(`docs/runbook.md` 체크리스트).
- 한국어 STT 정확도, 오프라인 글꼴 파일 포함(라이선스), TTS 품질은 미정.
- 의존 버전은 `package-lock.json`으로 고정했다. 이미지 CI 게시(D24)는 deploy와 협의.

## 실행
`npm ci && npm run build && STATIC_DIR=dist MOCK_SCENARIO=risk_stop PORT=8099 node mock-server/main.ts` 로 시연(PORT를 비우면 빈 포트).

## D66 회신 반영 (boundary-contracts v1.3.2)
turn_id 봉투 처리, 상태 코드/Retry-After, 새 스키마 4종, SSE 이벤트 이름·ping, 위험 정지 상태 폴링, push-config. CR-002, CR-003은 회신으로 해소되었다(헤드 확인). 임시 방식(환자가 다시 말해 보기)은 폴링으로 대체했다.
