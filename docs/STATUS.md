# STATUS

## 한 일
- 설계서 `design.md`, 경계 문서 `boundary.md`, 변경 요청 CR-001~003.
- `api/`(클라이언트: 재시도, 순서, 타임아웃), `mock-server/`, 키오스크 앱, 직원 콘솔(SSE, 푸시 구독 서비스 워커, 개입 결정), 정적 서버, Dockerfile, 스모크 스크립트.
- 시험: `npm test`, `npm run test:dom`(jsdom, 컨테이너), `npm run typecheck`, `npm run check-schema`, `npm run smoke`, `npm run test:e2e`.
- 직원 콘솔 세션 기록 보기: 알림의 '기록 보기'로 대화·저장된 값·세션 알림(규칙 id)을 읽기 전용으로 본다. 같은 화면에서 이어서 진행/종료(확인 단계 유지). 환자 발화는 메모리·DOM에만 두고 닫으면 지운다. `GET /v1/staff/sessions/{id}`(StaffSessionView)는 모의 서버에만 있고 실제 survey-service 구현은 확인하지 못했다.

## 계약 v2.0.2 정렬
Dockerfile `BOUNDARY_CONTRACT=v2.0.2`, 모의 서버 오류 본문 `pipeline_schema_version` "2.0"(이전 "1.0"은 어떤 계약 버전과도 맞지 않던 값). `check-schema`가 계약 버전 표기를 대조하도록 확장했다. 공개 API 응답 모양 변화는 SSE `id:` 설명(이벤트 순번) 한 줄뿐이며 모의 서버는 이미 그렇게 동작한다. 이미지·리포지토리에 비밀은 없다(VAPID는 공개키만).

## D85 반영 (PUBLIC_API.md 추가 인터페이스 A·C·E·F)
- 환자 참조(A): 키오스크가 시작 URL 조각 `#subject_ref=...` 또는 `/config.json`의 `subject_ref`를 읽어 세션 시작 본문에 넣는다. 값이 없으면 필드를 생략하고, 형식(1~128자 `[A-Za-z0-9._:/#=+-]`)이 틀리면 보내지 않고 직원 호출 화면을 띄운다. 서버가 필수로 해 400이면 직원 호출 화면이다. 쿼리 문자열은 쓰지 않는다.
- 기기 인증(F): 토큰을 `#device=...` 조각(읽은 즉시 `history.replaceState`로 주소창에서 제거) 또는 `/config.json`의 `device_token`에서 받아 메모리에만 두고, `/v1/sessions*` 요청에만 `Authorization: Bearer`로 보낸다. 토큰이 없으면 요청 없이 "설정이 필요합니다" 화면, 서버 401·403이면 "인증이 거부" 화면(둘 다 직원 호출). 직원 콘솔 요청에는 붙이지 않는다.
- 직원 콘솔(C, E): 기록 보기에 `subject_ref`(없으면 '(없음)')와 알림 표의 '해결한 직원'(`resolved_by`, 없으면 '(없음)')을 보인다. 개입 결정 본문에는 직원 ID를 넣지 않는다(게이트웨이 헤더 `X-Openit-User`).
- 모의 서버: 시나리오 값 `deviceToken`(켜면 `/v1/sessions*`에 Bearer가 없거나 다르면 401; `MOCK_DEVICE_TOKEN` 환경 변수로도 켠다), `requireSubjectRef`(`MOCK_REQUIRE_SUBJECT_REF=1`), `subject_ref` 형식 400, StaffSessionView의 `subject_ref`·`resolved_by`(개입 요청의 `X-Openit-User` 헤더 값, 본문 값은 받지 않음). 기본은 토큰 검증 꺼짐(기존 시험용). 개입 결정은 기기 토큰이 아니라 직원 인증 몫이라 토큰 검사에서 뺐고, 헤더가 없으면 401 대신 `resolved_by`가 null이다(모의 서버 단순화, 실제 서비스는 401).
- `check-schema`: 서버 스키마(`StaffSessionView.json`)가 `subject_ref`·`resolved_by`를 갖게 된 것을 확인했고(survey-service 갱신), 모의 응답(열린 알림, 해결된 알림, subject_ref 없음)이 PASS로 대조된다. 이 과정에서 모의 응답이 스키마와 어긋나 있던 곳(시각 밀리초, 상태 값 ACTIVE/ENDED, 값 상태·정확도 표기)을 스키마에 맞췄다.
- 시험: `test/d85.test.ts`(조각·설정 파싱, 시작 본문, 헤더 범위, 흐름, 모의 규칙, 콘솔·로그 누출 없음), `test/staffview.test.ts`(DOM, 새 필드), 브라우저 시험 2건 추가(요청 본문·헤더·조각 제거·저장소·콘솔·기록 화면 표시, 토큰 없음·틀림·형식 오류 화면). `test/static.test.ts`는 `Authorization`/`Bearer` 문자열을 `api/client.ts`에만 허용하도록 바꿨고, 빌드 산출물에는 토큰 값이 박혀 있지 않음을 확인한다.
- 확인 못 한 것: 실제 게이트웨이·survey-service와 연동하지 못했다(모의 서버만). 시작 요청의 `subject_ref`는 `FrontendMessage.json` 스키마에 아직 없다(봉투 필드로 보고 시험에서 `turn_id`처럼 떼어 낸다). 필요하면 헤드에게 변경 요청.

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
`check-schema`는 `../survey-service/schema/schemas/StaffSessionView.json`이 있으면 모의 서버 응답을 그 스키마로 검증해 PASS로 세고, 없으면 "대상 아님(서버 스키마 대기)"을 출력한다(PASS로 세지 않음). 서버 스키마가 생겼으므로 지금은 대조된다. jsdom 시험은 호스트에 jsdom이 없으면 건너뛰므로(`npm test`의 skipped) `npm run test:dom`으로 컨테이너에서 확인한다.

## 직원 콘솔 연결 복구 (FAULT_MATRIX A10·A9, FAULT_POLICY 7·12)
- 변경: 스트림 재연결을 직접 구현(지수 백오프+지터, 예산 없음), 붙을 때마다·15초마다 목록 재읽기(catch-up), 연결 끊김·목록 실패 상태를 명시적으로 표시, 푸시 구독 실패는 알림 배너와 분리. 코드 `api/staff.ts`, `apps/staff/sync.ts`, `main.ts`. 이전에는 EventSource 자동 재연결만 믿었고, 502·503·504로 거절되면 브라우저가 재연결을 포기해 화면이 "연결 끊김"인 채 영원히 복구되지 않을 수 있었다(브라우저 사양에 따른 추정이며 실제 Chromium으로 재현 확인은 하지 않았다).
- 시험: `test/sync.test.ts`(가짜 EventSource, 가짜 타이머), 브라우저 시험 3건(스트림 503 거절 후 복구, 끊긴 사이 알림 보충, 목록 실패 표시와 복구), 모의 서버에 스트림 거절·연결 끊기 추가.
- 확인하지 못한 것: 실제 gateway·survey-service 재시작 중 SSE 동작(Caddy의 502/503/504와 하트비트 형식), 푸시 구독 실패 화면의 브라우저 시험(헤드리스는 VAPID·권한이 없다), 정적 화면 장애(A3)의 키오스크 최초 로드 실패 화면. CR-004 참조.

## 재시도 정책 (FAULT_POLICY 원칙 2·3·7)
- 변경: 502·503·504·429·네트워크 오류·무응답은 같은 `turn_id`로 지수 백오프(지터) 재시도, 총 예산 20초 뒤 직원 호출. 409 `CONFLICT` + `details.reason = TURN_IN_PROGRESS`는 `Retry-After` 이상 기다린 뒤 같은 `turn_id` 재시도(reason이 없거나 다른 409는 기존대로 위험 정지 폴링). 500·4xx(429 제외)는 재시도 없음. 재시도 중 직원 부르기·그만하기 버튼. 이전의 "3회 시도" 상한은 없어졌다(`retry.maxAttempts`로 시험에서만 둘 수 있다).
- 시험 변경: 기존 시험 중 "시도 3회"에 의존한 곳은 `retry: { maxAttempts: 3 }`를 명시하게 했고, Retry-After 없을 때 1초라는 단언은 백오프 값(지터 0 기준 250/500ms)으로 바꿨다. 새 시험은 `test/retry.test.ts`.
- 확인하지 못한 것: 실제 gateway·survey-service에서 재시작 중 동작(모의 서버만), 실제 survey-service의 `409 TURN_IN_PROGRESS` 응답(형식은 계약으로 확정, 모의 서버 시나리오 `turn_in_progress`로만 시험), 20초 예산이 임상 흐름에 맞는지(사용자 결정 대기), 실기기 화면.
