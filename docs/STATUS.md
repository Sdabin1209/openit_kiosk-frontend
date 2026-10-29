# STATUS

## U49: 승격된 스키마 사본 정리 (2026-10-30, 브랜치 wo-49)
- `docs/change-requests/schemas/`, `contract-ready/` 삭제(파일 45개). 분류 표는 CR-005 끝. 남긴 스키마 파일 없음.

## U47: 노출 선언 라벨 (2026-10-30, 브랜치 wo-47, ADR 0029)
- `deploy-exposure.json`(계약 Exposure)을 `build-image.sh`가 라벨 `io.openit.exposure`로 단다. StaticImageInterface와의 겹침·차이는 ADR 0029에 정리했다(헤드 결정 대기).

## U43: setup-env 보고 + 계약 v2.6.0 (2026-10-30, 브랜치 wo-43, ADR 0028)
- `scripts/setup-env.sh`가 마지막 줄에 SetupEnvReport를 낸다(진행 기록은 표준 오류). 이미 준비돼 있으면 설치를 건너뛴다. 계약 핀 v2.6.0(Dockerfile ARG, 생성 검증기, 모의 서버 pipeline_schema_version 2.6).

## 계약을 고정 태그에서 읽는다 (2026-10-30, ADR 0027)
- 시험과 `check-schema`, `gen-validators`가 옆 폴더 `../boundary-contracts`의 작업 트리가 아니라 Dockerfile이 고정한 태그의 내용을 `git show`로 읽는다. 옆 폴더가 앞서 가도 통과한다. 남은 것: 문진 스키마(`../survey-service/schema`)는 아직 옆 폴더의 현재 내용을 읽는다(정확한 고정 태그가 없다).

## U42: 영역 빌드 진입점 + 계약 진입점 2.5.0, 핀 v2.5.1 (2026-10-30, 브랜치 wo-42, ADR 0026)
- `bash scripts/build-image.sh <요청 JSON>` 추가(계약 BuildImageRequest/Result). 계약 핀 v2.5.1(Dockerfile ARG, 생성 검증기, 모의 서버 pipeline_schema_version 2.5). 옛 deploy 빌드(`REVISION`, `BOUNDARY_CONTRACT`, `SURVEY_SCHEMA`)와 같은 인자·같은 라벨이다. 같은 요청의 image_id는 빌드마다 다르다(재현 빌드 아님).

## 계약 v2.4.1 핀 (2026-10-30, 브랜치 wo-24, D115)
- Dockerfile ARG, 생성 검증기 헤더, 모의 서버 `pipeline_schema_version` "2.4". 이 영역이 쓰는 세 스키마(DeviceConfig, KioskStartFragment, StaffPushPayload)는 2.3.0과 같아 생성 검증기는 헤더 줄만 바뀌었다. 동작 변화 없음.

## CR-D29 (2026-10-29, 브랜치 wo-cr29, ADR 0025)
- 이미지 라벨 `io.openit.app-version`은 Dockerfile `ARG APP_VERSION` 기본값이고, `package.json` version과 같음을 `npm test`(`test/image-contract.test.ts`)와 `npm run smoke`(이미지 라벨 대조)가 강제한다. 버전을 올릴 때는 두 곳을 함께 고친다.

## 단위 4b: 기기 인증 mTLS (계약 v2.3.0, 2026-10-29, 브랜치 wo-u4b, ADR 0024)
- 기기 토큰이 없어도 앱이 동작한다(설정 필요 화면 `NO_DEVICE_TOKEN` 삭제). 토큰이 있으면 2.x 호환으로 Bearer. 모의 서버에 `gatewayDevice` 모드(`X-Openit-Device`). 생성 검증기와 Dockerfile 핀 v2.3.0, 모의 서버 pipeline_schema_version 2.3.
- 확인하지 못한 것: 실제 mTLS 게이트웨이, 인증서가 TLS 단계에서 거부될 때의 화면(네트워크 오류로 재시도 뒤 직원 호출 화면일 것으로 추정).

## 대화형 UI 다듬기 (2026-10-29)
- 서버가 문진을 끝내면(응답 뒤 상태 조회가 ENDED) 종료 화면으로 간다(제목 "수고하셨습니다", 마무리 안내만). 입력·버튼이 없으면 아래 영역을 감춘다. 실제 서버의 완료 시 상태 값은 확인하지 못했다(ADR 0023 보강).

## 전송 계층 한도 413/414/431 (계약 2.2.2 CONVENTIONS 9절)
- 확인: 413·414·431은 재시도 대상(429·502·503·504)이 아니라서 text/plain 본문이어도 재시도 0회로 `ApiError`가 되고 환자에게는 기존 직원 호출 화면이 나간다(이 동작은 수정 전에도 같았다). 고친 것은 `ApiError.code`: 이 세 상태는 본문과 무관하게 `INVALID_RECORD`로 읽는다(`test/transport-limits.test.ts`).

## 대화형 UI (2026-10-29, 브랜치 wo-u4, ADR 0023)
- 키오스크 화면을 대화 스레드 중심으로 바꿨다(위 제목, 가운데 스레드, 아래 고정 입력 영역). 현재 질문은 마지막 시스템 말풍선, 안내·위험 정지·실패 문구는 스레드 끝의 상태 말풍선이다. 상태 기계와 문구는 그대로.
- 시험: `test/kiosk-app.test.ts`에 스레드 시험 추가(수정 전 실패 확인), 브라우저 시험 2개 추가. 이 변경으로 `test:e2e`의 22개 실패(말풍선과 본문이 같은 글을 두 번 담던 strict mode 위반)가 사라졌고 34개 모두 통과한다.
- 실기기(해상도, 터치, 낭독기)는 확인하지 못했다.

## 단위 4a (2026-10-29, 브랜치 wo-u4)
- 정적 서버 `server/static.mjs`를 Caddy file_server 이미지로 대체했다(ADR 0022, 0010 대체). 계약 핀 v2.2.2. 동작 차이 5가지는 ADR 0022 결과 절.
- 성질 시험 `npm run test:image`(14개)를 교체 전 Node 이미지에 먼저 돌려 13개 통과를 확인했고(그때 시험 13개) Caddy 이미지에서 같은 시험이 통과한다(400 보안 헤더 한 항목만 알려진 차이로 바꿨다).
- `npm run test:e2e`는 이번에 돌려 보니 32개 중 22개가 실패한다: 대화 말풍선(chat) 추가 뒤 `getByText('어디가 불편하신가요?')`가 두 요소에 걸려 strict mode 위반이 난다. 정적 서빙과 무관한 시험 로케이터 문제이고 이번에 고치지 않았다. 또한 `test-e2e/Dockerfile`이 `assets/`를 복사하지 않아 빌드가 깨져 있던 것을 고쳤다(그 전에는 아예 실행되지 않았다).

## 단위 3 (2026-10-29, 브랜치 wo-u3)
- 계약 핀 v2.2.1(Dockerfile ARG). 이 영역은 turn-engine·model-runtime을 쓰지 않는다. 문진 스키마 패키지를 설치하지 않는다(라벨 `survey-schema`는 주 버전 `1`).
- 손으로 쓴 형식 검사를 계약 스키마의 검증기로 바꿨다(ADR 0021): `/config.json`(DeviceConfig), 시작 URL 조각(KioskStartFragment), 서비스 워커 푸시 본문(StaffPushPayload). 모르는 키가 있으면 그 출처를 쓰지 않는다(예전에는 무시). `docs/image-interface.json`(StaticImageInterface 선언)과 이미지 라벨(ImageLabels)은 `test/image-contract.test.ts`가 검사한다. `ARG REVISION` 기본값은 `n/a`.
- 정적 서버: 잘못된 퍼센트 인코딩(`/%zz`)은 보안 헤더가 붙은 400(전에는 헤더 없는 500).
- 확인 못 한 것: deploy·병원 접수·survey-service가 실제로 이 모양을 만드는지(MANIFEST note), 실기기.

## 한 일
- 설계서 `design.md`, 경계 문서 `boundary.md`, 변경 요청 CR-001~003.
- `api/`(클라이언트: 재시도, 순서, 타임아웃), `mock-server/`, 키오스크 앱, 직원 콘솔(SSE, 푸시 구독 서비스 워커, 개입 결정), 정적 서버, Dockerfile, 스모크 스크립트.
- 시험: `npm test`, `npm run test:dom`(jsdom, 컨테이너), `npm run typecheck`, `npm run check-schema`, `npm run smoke`, `npm run test:e2e`.
- 직원 콘솔 세션 기록 보기: 알림의 '기록 보기'로 대화·저장된 값·세션 알림(규칙 id)을 읽기 전용으로 본다. 같은 화면에서 이어서 진행/종료(확인 단계 유지). 환자 발화는 메모리·DOM에만 두고 닫으면 지운다. `GET /v1/staff/sessions/{id}`(StaffSessionView)는 모의 서버에만 있고 실제 survey-service 구현은 확인하지 못했다.

## 계약 v2.1.0 (CR-H001·CR-H002, ADR 0014)
- 작업 트리 스펙(boundary-contracts 86da3bf) 기준으로 구현했다. 태그 v2.1.0은 아직 받지 못했다: 받으면 `npm run check-schema`·`npm test`·`npm run test:e2e`를 다시 돌린다(Dockerfile `BOUNDARY_CONTRACT`는 이미 v2.1.0, 모의 서버 pipeline_schema_version "2.1").
- 키오스크: DELIVERY_FAILED에서 '직원 다시 부르기'(retry_after_s 카운트다운), report 연결, 기능 감지, 정지 사유(pause_reason) 구분. 직원 콘솔: 전달 시도·직접 통지 보고·정지 사유 글자 표시.
- StaffAlertPage 스키마 결함은 계약 2ec2849에서 고쳐졌고, `test/mock.test.ts`는 새 필드 포함 목록 전체를 StaffAlertPage로 검증한다.
- 문구는 모두 provisional(임상 검토 전). 실제 survey-service 연동은 하지 못했다.

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
`bash scripts/setup-env.sh && npm run build && STATIC_DIR=dist MOCK_SCENARIO=risk_stop PORT=8099 node mock-server/main.ts` 로 시연(PORT를 비우면 빈 포트).

## D66 회신 반영 (boundary-contracts v1.3.2)
turn_id 봉투 처리, 상태 코드/Retry-After, 새 스키마 4종, SSE 이벤트 이름·ping, 위험 정지 상태 폴링, push-config. CR-002, CR-003은 회신으로 해소되었다(헤드 확인). 임시 방식(환자가 다시 말해 보기)은 폴링으로 대체했다.

## 세션 기록 보기와 스키마 대기
`check-schema`는 `../survey-service/schema/schemas/StaffSessionView.json`이 있으면 모의 서버 응답을 그 스키마로 검증해 PASS로 세고, 없으면 "대상 아님(서버 스키마 대기)"을 출력한다(PASS로 세지 않음). 서버 스키마가 생겼으므로 지금은 대조된다. jsdom 시험은 호스트에 jsdom이 없으면 건너뛰므로(`npm test`의 skipped) `npm run test:dom`으로 컨테이너에서 확인한다.

## 하트비트·resync (D87)
- 변경: 직원 콘솔이 `event: heartbeat`를 첫 수신 연결부터 감시(2x주기+지터 무음이면 닫고 재연결, `#conn` 끊김)하고 `event: resync`에 목록을 즉시 다시 읽는다. 구버전 서버(하트비트 없음)에서는 감시를 켜지 않고 15초 목록 재읽기만 안전망. 모의 서버에 하트비트·resync·발행 막기 추가.
- 시험: `test/sync.test.ts`(하트비트 감시·resync 4건), `test/mock.test.ts`(하트비트 형식), 브라우저 시험 2건.
- 확인하지 못한 것: 실제 survey-service의 하트비트(읽지 않음), 30~35초 값의 적절성(실측 없음).

## 간헐 실패 조사
`npm test`의 간헐 실패 원인과 수정은 커밋 8688bdf(실제 타이머 의존 제거). 요약: `test/flow.test.ts` 폴링 시험(실제 2ms 타이머 + 30ms 대기), `test/mock.test.ts` hang 시험(실제 HTTP에 30~50ms 클라이언트 타임아웃), `test/retry.test.ts`의 10ms 대기 가정 등.

## 깨진 응답·정적 서버 장애 (원칙 10, A1·A2 F6, A3)
- 변경: `api/validate.ts`로 FrontendInput·SessionState 응답 모양을 검사하고 어긋나면 재시도 대상 실패로 처리(빈 본문 200이 재시도 없이 직원 호출이 되던 틈을 닫음). 시험 `test/retry.test.ts` 추가분, 브라우저 시험(정적 서버 503 중에도 세션 진행).
- 시험 변경: `test/client.test.ts`의 상태 조회 경로 시험은 응답이 `{}`였는데 검사를 통과하도록 올바른 SessionState로 바꿨다(단언은 그대로).
- 확인하지 못한 것: 실제 gateway가 주는 깨진 본문 모양, 새로고침/최초 로드 실패 화면(오프라인 캐시 없음), 실제 survey와 키오스크를 잇는 E2E.

## 직원 콘솔 연결 복구 (FAULT_MATRIX A10·A9, FAULT_POLICY 7·12)
- 변경: 스트림 재연결을 직접 구현(지수 백오프+지터, 예산 없음), 붙을 때마다·15초마다 목록 재읽기(catch-up), 연결 끊김·목록 실패 상태를 명시적으로 표시, 푸시 구독 실패는 알림 배너와 분리. 코드 `api/staff.ts`, `apps/staff/sync.ts`, `main.ts`. 이전에는 EventSource 자동 재연결만 믿었고, 502·503·504로 거절되면 브라우저가 재연결을 포기해 화면이 "연결 끊김"인 채 영원히 복구되지 않을 수 있었다(브라우저 사양에 따른 추정이며 실제 Chromium으로 재현 확인은 하지 않았다).
- 시험: `test/sync.test.ts`(가짜 EventSource, 가짜 타이머), 브라우저 시험 3건(스트림 503 거절 후 복구, 끊긴 사이 알림 보충, 목록 실패 표시와 복구), 모의 서버에 스트림 거절·연결 끊기 추가.
- 확인하지 못한 것: 실제 gateway·survey-service 재시작 중 SSE 동작(Caddy의 502/503/504와 하트비트 형식), 푸시 구독 실패 화면의 브라우저 시험(헤드리스는 VAPID·권한이 없다), 정적 화면 장애(A3)의 키오스크 최초 로드 실패 화면. CR-004 참조.

## 재시도 정책 (FAULT_POLICY 원칙 2·3·7)
- 변경: 502·503·504·429·네트워크 오류·무응답은 같은 `turn_id`로 지수 백오프(지터) 재시도, 총 예산 20초 뒤 직원 호출. 409 `CONFLICT` + `details.reason = TURN_IN_PROGRESS`는 `Retry-After` 이상 기다린 뒤 같은 `turn_id` 재시도(reason이 없거나 다른 409는 기존대로 위험 정지 폴링). 500·4xx(429 제외)는 재시도 없음. 재시도 중 직원 부르기·그만하기 버튼. 이전의 "3회 시도" 상한은 없어졌다(`retry.maxAttempts`로 시험에서만 둘 수 있다).
- 시험 변경: 기존 시험 중 "시도 3회"에 의존한 곳은 `retry: { maxAttempts: 3 }`를 명시하게 했고, Retry-After 없을 때 1초라는 단언은 백오프 값(지터 0 기준 250/500ms)으로 바꿨다. 새 시험은 `test/retry.test.ts`.
- 확인하지 못한 것: 실제 gateway·survey-service에서 재시작 중 동작(모의 서버만), 실제 survey-service의 `409 TURN_IN_PROGRESS` 응답(형식은 계약으로 확정, 모의 서버 시나리오 `turn_in_progress`로만 시험), 20초 예산이 임상 흐름에 맞는지(사용자 결정 대기), 실기기 화면.

## 전수 점검 반영 (감사 kiosk-frontend.md, D88·D89)
- 고침: P1 환자 참조 일회용(`createStartHolder`), P3 유휴 초기화·입력창 비우기, P4 마이크 거부 대체·직원 부르기·그만하기·다시 말하기 상한 3회(잠정), P5 위험 정지 대기 안내, H-2 정지 상태 확인(신호 null 응답 + `/state` PAUSED_RISK), P9 임상 값 한 곳(`apps/kiosk/clinical.ts`, U10 잠정), P14 낡은 문서, P15 보안 헤더, P16 종료 실패 표시, P17 푸시 해지 UI, P18 입력 길이, P20 응답 null 문구, P22 healthz 로그 제외(회전은 런타임 몫), P23 PORT 검증, P2 로컬 STT 기본(D88 U3), P7 `CONFIG_FILE`→`/config.json`, P11 런북 화면별 대응, ADR 11편.
- 안 함: P6·P12 게이트웨이/계약 결정, P8 이미지 digest·SBOM(deploy CI), P10 실제 gateway·survey E2E, P13 devDependency 취약점(강제 업그레이드 필요), P19 시간 표기, P21 접근성 잔여, P24 해결자 표시.
- 확인 못 함: 실제 기기의 온디바이스 한국어 STT, 서버의 기기별 토큰, 실제 survey의 정지 응답과의 연동.

## 지시서 1·2 (2026-10-28, 브랜치 wo2)
- 데모: 키오스크 화면에 현재 세션 대화(환자 발화, 시스템 응답)를 시간순 말풍선으로 보인다. `apps/kiosk/chat.ts`(이벤트 -> 뷰 모델), `chatview.ts`, 상태 기계의 `subscribeConversation`. 메모리에만 두고 IDLE·ENDED가 되면 지운다. ADR 0015. `/config.json` 경로(조각 없이 기기 토큰으로 `/v1/sessions` 호출)는 `test/kiosk-app.test.ts`로 처음 확인했다(그 전에는 로더 단위 시험과 정적 서버 단위 시험만 있고 앱 전체 흐름 시험은 없었다).
- KF-09: 재시도·처리 여부 불명 분류를 `api/retry.ts`로 모으고 `ApiError.reason`을 추가했다. 재현 시험 `test/kf09.test.ts`. KF-10: STT 오류를 `SttError.kind` 열거로. `test/kf10.test.ts`.
- 경계 형식 스키마 초안: CR-005. 코드는 바꾸지 않았다.
- 하지 않은 것: KF-11(사용자 결정 대기), 직원 콘솔 '기록 보기', 컴포넌트 분리. `npm run test:e2e`, `npm run smoke`는 다시 돌리지 않았다.
