# 구조 규칙 R1~R7 전수 점검 보고서: kiosk-frontend (2026-10-28)

기준서: `../head/docs/audit/structure-rules-audit-spec.md` (D104). 점검 대상 리포 HEAD: `6b84c64`. 코드·설정·시험은 고치지 않았다(이 파일만 추가).
이웃 참조(읽기 전용): `../boundary-contracts`(PUBLIC_API.md, HTTP.md, INTERFACES.md 해당 절, schemas/, conformance/servers.py 일부; 작업 트리는 `v2.1.1-1-gf984b3c`), `../survey-service/schema/schemas`(FrontendInput, StaffSessionView), `../head/shared/areas.json`.

표기: 읽고 확인한 것 = "확인", 실행해 본 것 = "실행", 읽지 못했거나 하지 않은 것은 마지막 절에 둔다.

## 0. 요약

| 심각도 | 개수 | ID |
|---|---|---|
| P1 | 1 | KF-01 |
| P2 | 12 | KF-02 ~ KF-13 |
| P3 | 7 | KF-14 ~ KF-20 |

실행으로 확인한 것(이 PC 한 환경, Node 24): `npx tsc --noEmit` 출력 없음(오류 없음). `node scripts/check-schema.mjs`: "StaffSessionView: 모의 서버 응답이 서버 스키마와 일치(PASS)", "스키마 열거값 일치, 계약 v2.1.1(pipeline 2.1) 표기 일치". `node --test test/*.test.ts`: 181개 통과, 실패 0(`dist/`가 이미 있는 상태에서 build 없이 실행). Docker가 필요한 smoke, test:dom, test:e2e는 실행하지 않았다.

사용자 질문 (5) 현재 상태(코드 읽기로 확인, 브라우저 실행은 안 함):
- 키오스크는 **서버가 준 응답 문장 `response_text` 한 개만** 화면에 보인다(`apps/kiosk/main.ts:58` `text.textContent = v.text ?? ""`). 환자 발화(utterance)는 화면에 되돌려 보이지 않고(`input.value`는 전송 뒤 비운다, main.ts:55, :72), 대화 이력 목록도 없다. 즉 "대화 내용"(환자와 시스템의 주고받은 기록)은 보이지 않는다.
- 직원 콘솔은 알림의 '기록 보기'에서 **세션 대화 전체를 보인다**: `utterance`("환자"), `response_text`("시스템"), `action`(시스템 줄 끝 `[action]`), `at` 시각을 시간순 목록으로 그린다(`apps/staff/record.ts:94-96`, `:91`). 저장된 값, 환자 참조(`subject_ref`), 세션 알림도 함께 보인다(`record.ts:75`, `:105`, `:112`). 데이터 원천은 `GET /v1/staff/sessions/{id}`(PUBLIC_API.md C절)이다.

## A. 컴포넌트 목록

이 영역은 "컴포넌트"라는 단위를 코드에 선언하지 않는다(레지스트리, 디렉터리 규약 없음). 아래는 파일 경계로 읽어 낸 작업 단위다. 입력/출력 스키마의 정의 위치는 C절.

| ID | 이름 | 파일 | 입력 스키마 | 출력 스키마 | 업무 |
|---|---|---|---|---|---|
| K-API | 공개 API 클라이언트 | `api/client.ts`, `errors.ts`, `ids.ts`, `retry.ts`, `validate.ts` | `ClientOptions`, `CallOptions`(client.ts:8,23), 호출 인자 | `FrontendInput`, `SessionState`, `StaffAlert`, `StaffCallRetryResult`(types.ts) 또는 `ApiError`/`CallStaffError`/`AbortedError`/`BadBodyError` | I10 호출, 세션별 직렬화, 10초 타임아웃, 재시도, 본문 검사 |
| K-TYPES | 선(wire) 타입 | `api/types.ts` | (정의만) | 인터페이스·열거 상수 | I10 응답 타입 |
| K-STAFFAPI | 직원 API + SSE | `api/staff.ts` | `StaffApiOptions`, 콜백 | `StaffAlertPage`, `StaffSessionView`, SSE 콜백(`StaffAlert`, 연결 상태) | 알림 목록, 세션 기록, 푸시 등록, SSE 재연결·하트비트 감시 |
| K-START | 키오스크 시작 값 | `api/device.ts` | `window.location.hash`, `GET /config.json` | `KioskStart`(device.ts:144) | 기기 토큰·환자 참조·`allow_remote_stt` 읽기, 환자 참조 일회용 보관 |
| K-FLOW | 키오스크 상태 기계 | `apps/kiosk/flow.ts` | `PublicApiClient`, `SttResult`, `KioskStart` | `KioskView`(flow.ts:17) 구독 | 화면 상태, 응답 처리, 위험 정지 폴링, 직원 호출·재알림·보고, 유휴 초기화 |
| K-STT | 음성 어댑터 | `apps/kiosk/stt.ts` | 마이크(Web Speech API) | `SttResult`(stt.ts:2) / reject(Error) | 기기 안 한국어 인식, 사용 가능 여부, 신뢰도 판정 `isUsableTranscript` |
| K-CLIN | 임상·운영 값과 문구 | `apps/kiosk/clinical.ts` | - | 상수·문구 | 한도·시간·임시 문구 한 곳 |
| K-VIEW | 키오스크 화면 | `apps/kiosk/main.ts`, `index.html`, `kiosk.css` | `KioskView` | DOM, 사용자 동작 -> flow 호출 | 렌더, TTS(`speak`), 버튼 연결 |
| S-SYNC | 알림 동기화 | `apps/staff/sync.ts` | `Pick<StaffApi,"listAlerts"\|"stream">` | `onChange`/`onNew`/`onRedelivery`/`onStatus`(`SyncStatus`) | 스트림+목록 보충, 재전달 판정 |
| S-DECIDE | 개입 결정 | `apps/staff/decide.ts` | 전송 함수, 확인 함수 | `FrontendInput\|null` | 확인 후 전송, 알림별 turn_id 고정 |
| S-PUSH | 푸시 구독 | `apps/staff/push.ts` | 키 조회·등록 함수 | void/boolean | 서비스 워커 등록, 구독·해지 |
| S-SW | 서비스 워커 | `apps/staff/sw.ts` | 푸시 본문 JSON(`session_id`,`kind`,`alert_id`) | 브라우저 알림 | 푸시 표시 |
| S-INFO | 알림 보조 문구 | `apps/staff/alertinfo.ts` | `StaffAlert` 일부 필드 | 문자열 | 정지 사유·전달 상태 글자 |
| S-RECORD | 세션 기록 보기 | `apps/staff/record.ts` | `StaffSessionView`, `RecordViewerDeps` | DOM | 대화·값·알림 읽기 전용 표시 |
| S-VIEW | 직원 콘솔 화면 | `apps/staff/main.ts`, `index.html`, `staff.css` | 위 컴포넌트 | DOM | 목록 렌더, 배너, 버튼 연결 |
| MOCK | 공개 API 모의 서버 | `mock-server/app.ts`(`createMock`), `main.ts` | HTTP 요청, `Scenario`(app.ts:5) | I10 응답 형식, SSE 프레임, `/__mock/*` | 시나리오로 I10 서버 대역 |
| STATIC | 정적 서버 | `server/static.mjs` (`makeStaticHandler`) | `STATIC_DIR`,`PORT`,`CONFIG_FILE` | 정적 파일, `/healthz`,`/readyz`,`/config.json` | 빌드 산출물 서빙 |

접착 코드(어느 컴포넌트에도 속하지 않음): `scripts/build.mjs`, `scripts/check-schema.mjs`, `scripts/doctor.mjs`, `scripts/setup-env.sh`, `scripts/smoke.sh`, `scripts/e2e-docker.sh`, `scripts/dom-docker.sh`, `Dockerfile`, `test/helpers.ts`, `test/*.test.ts`, `test-e2e/*`. 진입점 접착: `apps/kiosk/main.ts`(K-VIEW가 조립도 겸함), `apps/staff/main.ts`(S-VIEW가 조립도 겸함), `mock-server/main.ts`.

경계가 없는 덩어리:
- `KioskFlow`(flow.ts, 약 400줄 한 클래스): 화면 상태 전이, 위험 정지 폴링, 직원 재알림 카운트다운, 보고 재시도, 유휴 타이머를 한 클래스가 갖는다. 선언된 하위 컴포넌트 경계 없음.
- `createMock`(mock-server/app.ts, 한 함수): 라우팅, 세션 상태, 멱등 캐시, SSE 브로커, 시나리오 제어, `StaffSessionView` 조립이 한 클로저 안에 있다.

## B. R3·R4 컴포넌트 독립과 자기 I/O

### KF-14 (R3, P3) 한 클래스가 키오스크와 직원 콘솔 일을 모두 하고, 역할 구분이 경로 정규식이다
- 위치: `api/client.ts:183`, `:108`, `:103`
- 인용: `const token = /^\/sessions(\/|$)/.test(path) ? this.deviceToken() : null;`
- 이유: `PublicApiClient`가 키오스크 호출(`startSession`, `sendUtterance`, `staffCallRetry`)과 직원 호출(`intervene`, `getPushConfig`, 일반 `request`)을 함께 가지며, 기기 토큰을 붙일지는 경로 문자열 정규식으로 정한다. 이 정규식은 직원 경로 `/sessions/{id}/intervention`(PUBLIC_API.md E절)도 포함한다. 모의 서버는 이를 알고 `/intervention`을 제외한다(`mock-server/app.ts` 143행 근처 `!path.endsWith("/intervention")`). 직원 앱이 `deviceToken`을 주지 않아(`apps/staff/main.ts:10`) 지금은 안 붙지만, 토큰을 주면 붙는 구조다.
- 최소 수정: 토큰을 붙일 호출을 메서드 단위 옵션으로 명시하거나 키오스크용·직원용 클라이언트를 나눈다.

### KF-09 (R3·R4·R7, P2) 키오스크 상태 기계가 선(wire) 오류 모양을 직접 읽고, 재시도 분류를 클라이언트와 따로 한 벌 더 갖는다
- 위치: `apps/kiosk/flow.ts:54`, `:56`, `:261-265`, `:290`, `:295-301`
- 인용: `const NO_RESPONSE_STATUS: ReadonlySet<number> = new Set([500, 502, 503, 504]);` / `const reason = (e.body?.details as { reason?: unknown } | undefined)?.reason;`
- 이유: (a) flow가 `ApiError.body.details.reason`(BoundaryError의 계약 모양)을 직접 해석한다(`NO_OPEN_ALERT`, `RETRY_LIMIT`). API 컴포넌트가 내보내는 값이 오류 종류 열거가 아니라 원본 본문이다. (b) 재시도 대상 상태를 `api/retry.ts:31` `RETRYABLE_STATUS`(429·502·503·504, 500 제외)와 별도로 flow가 `NO_RESPONSE_STATUS`(500 포함)로 다시 정하고, `report()`는 최대 2회 자체 재시도를 한다(`REPORT_ATTEMPTS`, flow.ts:56). 같은 "재시도 여부" 규칙이 두 컴포넌트에 있고 값도 다르다(500). R7: API 컴포넌트가 이미 재시도 정책을 책임지는데 상태 기계가 `single:true`로 그것을 끄고 재구현한다. 근거는 "재알림은 429 의미를 호출자가 다뤄야 함"(client.ts:25)이다.
- 최소 수정: `ApiError`에 `reason` 같은 해석된 필드(또는 `kind` 열거)를 API 쪽에서 채워 내보내고, "응답을 못 받음(처리 여부 불명)" 판정과 보고 재시도를 `api/`의 한 함수로 옮긴다.

### KF-10 (R4·R5, P2) STT 어댑터 -> 상태 기계 오류 전달이 에러 메시지 문자열이다
- 위치: `apps/kiosk/stt.ts:83`, `apps/kiosk/main.ts:38`, `apps/kiosk/flow.ts:195-198`
- 인용: `reject(new Error("STT 사용 불가"))` / `flow.sttError(e instanceof Error ? e.message : null)` / `code === "not-allowed" || ... || code === "STT 사용 불가"`
- 이유: 어댑터의 출력 스키마는 `SttResult`뿐 선언되어 있고(`SttAdapter.listen(): Promise<SttResult>`, "실패하면 reject"), 오류 값의 형식은 선언이 없다. 상태 기계가 브라우저 오류 코드 문자열(`not-allowed` 등)과 한국어 메시지 하나를 "마이크 차단" 판정에 쓴다. 한국어 문구를 바꾸면 조용히 판정이 깨진다. 이 둘은 컴포넌트 사이의 암묵 스키마다.
- 최소 수정: `SttError { kind: "BLOCKED"\|"NO_SPEECH"\|"OTHER" }` 같은 타입을 stt.ts에 정의해 어댑터가 낸다.

### KF-15 (R3·R4, P3) 시작 값 모듈이 `api/`에 있고 이웃 컴포넌트가 이를 직접 import한다. 판정 정책 위치도 어긋난다
- 위치: `api/client.ts:3`, `apps/kiosk/flow.ts:6-7`, `apps/kiosk/stt.ts:11-12`
- 인용: `import { isValidSubjectRef } from "./device.ts";` / `import { isUsableTranscript, type SttResult } from "./stt.ts";`
- 이유: `api/device.ts`는 URL 조각·`/config.json`을 읽는 키오스크 부팅 로직이라 "공개 API 클라이언트, UI를 모른다"(README 구조표)와 맞지 않는데, API 클라이언트가 그 모듈의 검증 함수를 가져다 쓴다. 또 flow는 STT 컴포넌트가 가진 "쓸 만한 전사인가" 정책 함수(`isUsableTranscript`, 임계값 `MIN_CONFIDENCE`)를 값으로 import해 호출한다(어댑터 출력을 해석하는 일이 어댑터 모듈에 있다).
- 최소 수정: `subject_ref` 정규식은 `api/`(K-TYPES) 쪽으로, `isUsableTranscript`는 flow 또는 clinical로 옮긴다.

### KF-16 (R3, P3) 모의 서버 진입점이 모의 서버 내부(리스너 순서)와 정적 서버 모듈에 기댄다
- 위치: `mock-server/main.ts:9-12`
- 인용: `const api = server.listeners("request")[0] as (...a: any[]) => void; server.removeAllListeners("request");`
- 이유: `createMock`이 내보내는 것은 `Server`인데 main이 "첫 번째 request 리스너가 API 핸들러"라는 내부 구성 순서에 기대고, `server/static.mjs`(STATIC 컴포넌트)를 가져와 한 프로세스에 합친다. 모의 서버와 정적 서버가 서로의 구조를 안다.
- 최소 수정: `createMock`이 `handler`를 직접 내보낸다.

### KF-20 (R3, P3) 화면 컴포넌트의 모듈 전역 변경 상태와 숨은 시험 접점
- 위치: `apps/kiosk/main.ts:17-19`, `:52`, `:138`
- 인용: `if (v.state === "WAITING_STAFF" && v.pauseReason) document.body.dataset.pauseReason = v.pauseReason;`
- 이유: `onAction`, `onSecondary`, `lastState`, `lastWaitS` 모듈 전역 가변 상태와, 시험이 읽는 `document.body.dataset.pauseReason`(주석에 "시험·접근성 도구용")이 `KioskView` 밖의 암묵 인터페이스다. 영향은 화면 컴포넌트 안에 머문다.
- 최소 수정: 시험 접점을 `docs`에 선언하거나 `KioskView`에 대응하는 DOM 속성으로 명시한다.

## C. R5 영역 안 컴포넌트 사이 스키마

정의된 곳(타입 있음, 한 곳):
- 선(wire) 타입: `api/types.ts`(열거 상수 + 인터페이스). 열거값은 `scripts/check-schema.mjs`가 계약·문진 스키마와 대조한다(types.ts의 5개 배열만, `check-schema.mjs:20-24`).
- 화면 상태 모델: `KioskView`/`StaffCallView`(`apps/kiosk/flow.ts:17,40`).
- STT 결과: `SttResult`/`SttAdapter`(`apps/kiosk/stt.ts:2-12`).
- 시작 값: `KioskStart`(`api/device.ts:144`).
- 직원 동기화: `SyncDeps`/`SyncStatus`(`apps/staff/sync.ts`), `RecordViewerDeps`(record.ts:25).
- 재시도 정책: `RetryPolicy`(`api/retry.ts`).

기계가 읽는 형태가 없거나 암묵인 곳:
- KF-10(STT 오류 문자열).
- `/config.json` 본문: `c as Record<string, unknown>`로 읽고 키 이름을 코드에 박았다(`api/device.ts:50-54`). 정의 위치 없음(KF-01).
- 푸시 본문: `sw.ts`가 `any`로 `session_id`,`kind`,`alert_id`를 읽는다(KF-03).
- 시험 접점: `document.body.dataset.pauseReason`(KF-20).
- `StaffSessionView` 등 읽기 타입은 손으로 쓴 인터페이스(types.ts:76-117)이며 서버 스키마와는 모의 서버 응답을 통한 간접 대조뿐이다(KF-13).

### KF-08 (R5·R7, P2) 응답 검사의 열거값이 `types.ts`와 따로 있고, 대조 스크립트는 그중 한쪽만 본다
- 위치: `api/validate.ts:11`, `api/types.ts:3-4`, `scripts/check-schema.mjs:20-24`
- 인용: `const WRITE = ["COMMITTED", "NOT_COMMITTED"], ALERT = ["NONE", "DELIVERED", "DELIVERY_FAILED"];` / `export const WRITE_COMMITTED = ["COMMITTED", "NOT_COMMITTED"] as const;`
- 이유: 같은 열거가 영역 안에 두 번 정의되고, `check-schema`는 `types.ts`의 배열만 정규식으로 뽑아 대조한다. 실제 응답을 거르는 `validate.ts` 쪽은 대조되지 않아, 서버에 열거값이 추가되면 대조는 통과하는데 런타임 검사가 거부할 수 있다(KF-07과 이어짐).
- 최소 수정: `validate.ts`가 `types.ts`의 상수를 import한다.

## D. R1 이웃 구조에 기대는 곳

허용 범위 안의 참조(읽기 전용): `../../survey-service/schema/schemas/`와 `../../boundary-contracts/schemas/`를 읽는 곳: `scripts/check-schema.mjs:1-18`, `test/mock.test.ts:11,32`, `test/staffcall.test.ts:168`, `test/audit.test.ts:134`. 코드(api, apps, mock-server, server)는 이웃 경로를 참조하지 않는다(grep 결과 `../../(survey-service|boundary-contracts|head|deploy)` 일치는 위 시험·스크립트뿐). 이웃 패키지 import 없음(`package.json`은 devDependencies만, 런타임 의존 없음). `scripts/check-schema.mjs`, 시험은 워크스페이스 구조에서만 통과한다(README가 밝힘). 이는 규칙이 허용한 읽기 전용 참조 범위이므로 위반으로 세지 않는다. 허용 범위 안에서 확인한 약한 점은 아래 둘이다.

### KF-05 (R1, P2) `check-schema.mjs`가 계약 패키지의 Python 소스 파일을 정규식으로 읽는다
- 위치: `scripts/check-schema.mjs:27-29`
- 인용: `bc("boundary_contracts/schemas_api.py").match(/PIPELINE_SCHEMA_VERSION\s*=\s*"([^"]+)"/)` / `bc("pyproject.toml").match(/^version\s*=\s*"([^"]+)"/m)`
- 이유: 허용된 것은 계약의 문서·스키마다. 이 스크립트는 계약 패키지의 **구현 파일**(Python 모듈의 상수 선언, 빌드 메타데이터)의 파일 배치와 서식에 기댄다. 계약 쪽이 상수 위치·서식을 바꾸면 이 영역의 검사가 깨진다. 계약이 노출하는 버전 정보(태그, `CHANGELOG.md`, 스키마의 `pipeline_schema_version` 규칙)는 따로 쓰지 않았다.
- 최소 수정: 버전은 Dockerfile ARG와 계약 태그 이름만 대조하거나, 계약에 읽기 전용 버전 선언 파일(예: JSON)을 요청한다(변경 요청).

### KF-06 (R1·F, P2) 시험·대조가 고정 태그가 아니라 이웃 작업 트리의 현재 상태를 읽는다
- 위치: `Dockerfile:13`(`ARG BOUNDARY_CONTRACT=v2.1.1`), `scripts/check-schema.mjs:30-32`, `test/*.test.ts`(위 경로)
- 인용: `if (docker !== \`v${ver}\`) {...}` (ver는 `../../boundary-contracts/pyproject.toml`의 현재 값)
- 이유: 워크스페이스 규칙은 계약을 태그로 고정해 설치하라고 한다. 이 영역은 Node라 설치 대신 작업 트리를 읽는데, 읽는 대상이 태그 `v2.1.1`이 아니라 그 위로 커밋 1개가 더 있는 `v2.1.1-1-gf984b3c`다(`git describe`로 확인). `pyproject.toml` 버전 문자열이 같으면 통과하므로, 이미지 라벨이 주장하는 계약 버전과 시험이 대조한 스키마가 같다는 보증이 없다.
- 최소 수정: check-schema가 계약 작업 트리의 `git describe --exact-match`가 ARG와 같은지 확인하거나, 고정 태그 체크아웃을 읽게 한다.

### KF-19 (R1, P3) 이웃 사실이 이 영역 문서·주석에 복사되어 있고 일부는 낡았다
- 위치: `docs/boundary.md:6`, `docs/design.md:37`, `README.md:86`, `mock-server/app.ts:63`
- 인용: boundary.md: "지원 버전: boundary-contracts v2.1.0 기준(작업 트리 스펙 86da3bf 기준으로 구현, 태그 수신 전 ...)" / design.md: "survey-service 757351e, 이 영역은 그 리포지토리를 읽지 않아 직접 확인하지 못했다" / README 열린 항목 표 U07: "실제 LLM 데모에서 키오스크 발화 14턴이 모두 `NOT_COMMITTED`로 끝났다" / app.ts:63 "boundary-contracts v2.0.2의 PIPELINE_SCHEMA_VERSION"
- 이유: 워크스페이스 규칙(이웃의 사실을 복사하지 않고 링크)에 어긋난다. 그리고 현재 Dockerfile 기준은 `v2.1.1`이라 boundary.md의 "v2.1.0 기준, 태그 수신 전", app.ts 주석의 "v2.0.2"는 낡았다(버전 기준표는 `deploy/scripts/lib.sh`가 정본이라고 워크스페이스 규칙에 있고, 나는 그 파일을 읽지 않았다).
- 최소 수정: 이웃 커밋 해시·데모 결과는 지우고 링크만 남기며, 버전 표기는 Dockerfile ARG를 가리킨다.

## E. R6 영역 사이 스키마: 계약에 있는 것, 없는 것

### 계약에 스키마가 있는 소비 인터페이스
- I10: `FrontendInput`, `FrontendMessage`, `InterventionDecision`, `TurnFailureSignal`(문진 스키마), `SessionState`, `StaffAlert`, `StaffAlertPage`, `PushConfig`, `StaffCallRetryRequest/Result`, `StaffCallReport`, `BoundaryError`(boundary-contracts/schemas), `StaffSessionView`(survey-service/schema). 이 영역이 제공하는 서비스 API는 없다(정적 파일 제외).

### 영역 경계를 넘는데 계약에 없는 형식

### KF-01 (R6, P1) 기기 설정 `/config.json`, 시작 URL 조각, `CONFIG_FILE`은 영역 경계를 넘는데 계약에 형식이 없고, 개인정보·음성 전송 여부를 좌우한다
- 위치: `api/device.ts:44-54`, `server/static.mjs:25-28`, `server/static.mjs:43`
- 인용: `let device: string | undefined = frag.device; let subject: string | undefined = frag.subject_ref;` / `if (c?.allow_remote_stt === true) allowRemote = true;`
- 이유: 값을 쓰는 쪽은 deploy(운영이 마운트하는 `CONFIG_FILE`)와 병원 접수(시작 URL을 띄우는 쪽)이고 읽는 쪽이 이 영역이다. 필요한 합의: 파일 JSON 키 `device_token`, `subject_ref`, `allow_remote_stt`, URL 조각 키 `device`, `subject_ref`, 환경 변수 `CONFIG_FILE`. 계약 쪽에는 PUBLIC_API.md F절 문장 "시작 때 URL 조각(`#`)이나 기기 설정으로 한 번 받아"만 있고 키 이름·형식·파일 위치는 없다(`allow_remote_stt|device_token|CONFIG_FILE` 문자열을 boundary-contracts의 md/json/py에서 검색해 일치 없음; 일치는 `deploy/` 쪽 문서에서만 나온다고 파일 이름 목록으로 보았고 내용은 읽지 않았다). 형식은 이 영역의 runbook.md 62-64행, ADR 0006에만 있다. 특히 `allow_remote_stt`는 환자 음성을 외부 제공자로 보내도 되는지를 정하는 값이라 영역 경계 계약이어야 한다. 또 `subject_ref`는 PUBLIC_API.md A절이 값 형식을 정했지만 "접수가 키오스크를 띄울 때 넘긴다"는 전달 수단은 계약에 없다.
- 최소 수정: 헤드에게 변경 요청: `DeviceConfig`(JSON Schema)와 시작 URL 조각 키를 boundary-contracts에 올리고, 이 영역은 그 스키마로 `loadKioskStart`를 검증한다.

### KF-02 (R6, P2) 이미지의 배포 인터페이스(경로·포트·환경 변수)가 변경 요청 문서에만 있다
- 위치: `Dockerfile:17-24`, `server/static.mjs:20-27`, `docs/change-requests/CR-001-deploy-gateway-static-proxy.md`
- 인용: `ENV NODE_ENV=production PORT=8080 STATIC_DIR=/app/dist` / `HEALTHCHECK ... http://127.0.0.1:8080/healthz`
- 이유: deploy(게이트웨이)가 의존하는 것: 포트 8080, 경로 `/`, `/staff/`, `/staff/sw.js`, `/config.json`, `/healthz`, `/readyz`, 환경 변수 `PORT`, `STATIC_DIR`, `CONFIG_FILE`, 그리고 `/v1`을 이 이미지가 처리하지 않는다는 규칙, SSE 버퍼링 끔. 이 중 계약 문서에 있는 것은 없다(CR-001은 요청서). 이미지 라벨 키(`io.openit.*`)는 워크스페이스 규칙(D50)에 있다. 라벨 `io.openit.app-version`은 D50의 여섯 키 밖의 추가 키이며 브리프가 허용한 "앱 버전"이다.
- 최소 수정: 정적 이미지의 서빙 경로·환경 변수를 헤드가 계약(또는 deploy와 맺는 별도 문서)으로 올린다.

### KF-03 (R6, P2) 웹 푸시 본문 모양이 계약에 없는데 서비스 워커가 필드를 읽는다
- 위치: `apps/staff/sw.ts:6`, `:8`
- 인용: `const body = d.session_id ? \`세션 ${d.session_id} (${d.kind ?? "알림"})\` ...` / `tag: d.alert_id ?? "staff-alert"`
- 이유: PUBLIC_API.md 52행은 "푸시 본문에는 세션 ID와 종류만 넣는다"만 정한다. 키 이름(`session_id`, `kind`)과 재알림 합치기에 쓰는 `alert_id`는 계약에 없고 서비스 워커가 `any`로 읽는다. 서버(survey-service)가 보내는 쪽이므로 두 영역 사이 형식이다. 서버 구현은 읽지 않았다(이웃 리포 읽기 금지).
- 최소 수정: `PushPayload` 스키마를 계약에 올린다.

### KF-04 (R6·F, P2) "위험 정지가 성공하면 `turn_failure_signal`이 null"이라는 서버 동작에 의존하는데 계약 산문에 없다
- 위치: `apps/kiosk/flow.ts:165`, `:175-188`, `test/audit.test.ts` H-2 시험 주석
- 인용: `if (this.needsStateCheck(resp) && (await this.pausedByState(ctl))) return this.waitForStaff(resp.response_text);`
- 이유: 신호가 없어도 정지일 수 있다고 보고 모든 일반 응답마다 `GET /state`를 한 번 더 부른다(요청 수 2배). 그 근거는 시험 주석의 "위험 정지 성공 때 survey는 turn_failure_signal=null을 주고"뿐이다. PUBLIC_API.md 34행은 "null이 아니면 문제가 있었다"만 말하고 정지 시 신호 값을 정하지 않았다. `conformance/servers.py` `_fi`(약 598행)는 `committed`일 때 신호를 null로 만드는 것만 읽었고 정지 시의 모사 여부는 읽지 못했다. 이웃 서버의 비문서화 동작이 이 영역 흐름(요청 수, 화면 전환)을 정한다.
- 최소 수정: 계약에 "위험 정지 턴의 `turn_failure_signal`/`staff_alert` 값"을 명시해 달라고 요청하고 그에 맞춰 `/state` 추가 호출을 없앤다.

### KF-18 (R6, P3) `TurnFailureSignal.pause_reason`을 타입이 모르고 쓰지도 않는다
- 위치: `api/types.ts:11-15`, `survey-service/schema/schemas/FrontendInput.json` (`TurnFailureSignal.properties.pause_reason`)
- 인용: `export interface TurnFailureSignal { session_id: string; write_committed: WriteCommitted; staff_alert: StaffAlertState; }`
- 이유: PUBLIC_API.md H절은 `TurnFailureSignal`에도 `pause_reason`(optional)이 붙는다고 한다. 타입에 없고, `DELIVERED` 신호로 대기 화면에 들어갈 때는 `lastPause`가 비어(`needsStateCheck`가 false라 `/state`를 안 부름) 첫 폴링(2초 뒤)이 오기 전까지 정지 사유를 알 수 없다. check-schema는 이 필드를 대조하지 않는다.
- 최소 수정: 타입에 `pause_reason?` 추가, 신호에서 먼저 읽는다.

### KF-13 (R6, P2) 모의 서버가 서버 형식을 직접 만들어 쓰고, 일부만 계약 스키마로 검증된다
모의 서버(`mock-server/app.ts`)가 손으로 만드는 서버 쪽 형식과 검증 상태(확인):

| 형식 | 만드는 곳 | 계약 스키마 검증 |
|---|---|---|
| `FrontendInput`(+`TurnFailureSignal`) | `input()` (app.ts 104행 근처) | 있음: `test/mock.test.ts` 첫 시험(survey `FrontendInput.json`) |
| `BoundaryError`(`pipeline_schema_version` 포함) | `berr()` (app.ts:65) | **400 한 경로만**(`mock.test.ts` "봉투 밖의 필드"). 404/409(`details.reason`)/429/503 본문은 미검증 |
| `SessionState` | `/state` 핸들러(app.ts 167행) | 있음(mock.test, staffcall.test, audit.test) |
| `StaffAlert`, `StaffAlertPage` | `state.alerts`, `/staff/alerts` | 있음(mock.test) |
| `PushConfig` | `/staff/push-config` | 있음 |
| `StaffCallRetryResult`, `StaffCallReport` 응답 | `scm` 핸들러(app.ts 170-202행) | 있음(staffcall.test). 429 `details.reason`(`INTERVAL`/`RETRY_LIMIT`), `Retry-After` 유무는 동작 시험만 있고 스키마 대조는 아님 |
| `StaffSessionView` | `sessionView()` (app.ts:106-116) | 있음(check-schema, survey `StaffSessionView.json`). 알림 `kind`를 `RISK_STOP`->`RISK`로 바꾸는 규칙을 모의가 가진다(app.ts:115) |
| SSE 프레임(`id:`,`event:`,`data:`, `heartbeat`, `resync`, `: ping`) | `publish`, 스트림 핸들러 | 스키마 없음(PUBLIC_API.md 산문 대조만, 이 영역 시험은 클라이언트가 파싱하는지만 봄) |
| 푸시 구독 응답 201/204 | app.ts 286-292 | 대조 대상 계약 스키마 없음 |

- 이유: 모의가 계약 모양에서 벗어나도 `berr` 계열과 SSE는 시험이 못 잡는다. 또 알림 `kind`가 목록(`RISK_STOP`)과 세션 보기(`RISK`)에서 다른 것은 모의가 만든 규칙이 아니라 PUBLIC_API.md 48행(`kind`: `RISK_STOP` 등)과 D절(`kind` = severity `RISK`/`CALL_STAFF`) 및 survey 스키마 `AlertKind`(`RISK|CALL_STAFF|USER_CALLED_STAFF`)의 어긋남을 모의가 둘 다 재현한 것이다. 계약이 어느 쪽이 정본인지 정하지 않았다.
- 최소 수정: 모든 오류 경로의 본문을 `BoundaryError.schema.json`으로 검증하는 시험을 더하고, `kind` 값 정본을 헤드에게 묻는다(변경 요청).

### 모의 전용 제어 경로
`/__mock/scenario|config|stream|heartbeat|drop-sse|state`는 영역 안 시험과 시연(e2e)만 쓴다. 이 영역 문서가 "계약 밖"으로 밝혔다(boundary.md 4행). 다른 영역이 이 경로를 쓰는지는 확인하지 못했다. 쓰이지 않는다면 경계를 넘지 않는다.

## F. 계약 준수: PUBLIC_API.md 대조

대조 방법: PUBLIC_API.md(133줄 전체)를 한 줄씩 읽고 `api/client.ts`, `api/staff.ts`, `api/retry.ts`, `api/validate.ts`, `apps/kiosk/flow.ts`, `apps/staff/*`, 모의 서버, 시험 이름을 대조했다. 계약 패키지의 적합성 시험(`boundary-contracts/conformance/`)은 Python 클라이언트(`HttpPublicApi`, `HttpStaffCall`)와 Python 참조 서버용이라 이 Node 클라이언트에 그대로 돌릴 수 없어 **돌리지 않았다**(참조 서버를 띄워 Node 클라이언트를 붙이는 시험은 만들지 않음).

표(PUBLIC_API.md 절 -> 구현 -> 판정):

| 계약 항목 | 구현 | 판정 |
|---|---|---|
| 원칙: session_id 프론트 발급, 1~64자 `[A-Za-z0-9_-]` | `api/ids.ts` `SESSION_ID_RE`, `client.ts:122` `check()` | 일치 |
| 원칙: Bearer 기기 토큰 | `client.ts:183-184`(`/sessions*`만) | 일치(KF-14 참고) |
| 상태 코드 표 400/401/403/404 재시도 안 함 | `retry.ts:31` `RETRYABLE_STATUS`는 429·502·503·504만. 400/401/403/404는 즉시 던짐(`client.ts:155`) | 일치 |
| 409 재시도 안 함. 단 `details.reason=TURN_IN_PROGRESS`는 같은 turn_id로 `Retry-After` 뒤 | `client.ts:155`, `waitMs`(retry.ts)가 `Retry-After` 이상 대기 | 일치 |
| 429: 재시도, `Retry-After`(정수 초) 준수 | `client.ts:196-197` 정수 아니면 null, `waitMs`가 이상 대기 | 일치 |
| 503: `Retry-After`가 있으면 따르고 없으면 1초 | 없으면 `backoffMs`(첫 시도 기준 500ms x 지터 50~100% = 250~500ms, `retry.ts:22`) | **어긋남 KF-17** |
| 세션 시작/발화/종료 본문, `kind` 값 | `client.ts:54-83` | 일치(시험이 `FrontendMessage`/`InterventionDecision`에서 `turn_id`를 뗀 나머지를 검증: `mock.test.ts`) |
| 세션 시작은 `turn_id` 없음 | `client.ts:56` | 일치(스키마상 선택) |
| `GET /sessions/{id}/state`, 2초 폴링, `resume_text`, `ENDED` | `client.ts:86`, `flow.ts` `pollMs ?? 2000`, `waitForStaff` | 일치 |
| 같은 turn_id 재전송 = 같은 응답(멱등), 응답을 못 받은 경우만 같은 id 재사용 | `flow.ts` `pendingTurnId/pendingUtterance`, `client` 재시도는 같은 body | 일치 |
| NOT_COMMITTED 턴은 같은 turn_id 재전송이 다시 처리됨 | `flow.ts:hear`는 NOT_COMMITTED를 "다시 말씀해 주세요"로 보내 새 turn_id를 씀 | 허용(계약은 재전송을 허용만 함) |
| `FrontendInput`: `response_text` null 가능, 신호 처리, `DELIVERY_FAILED` -> 직원 호출 화면 | `flow.ts` `handle` | 일치 |
| 요청 타임아웃 10초, 총 재시도 예산 약 20초(잠정), 예산 넘으면 직원 호출 | `client.ts` `timeoutMs ?? 10_000`, `retry.ts` `budgetMs: 20_000`, `CallStaffError` | 일치 |
| 한 세션 요청은 하나씩 | `client.ts` `serial()` | 일치 |
| STT 빈/불신 결과는 보내지 않음 | `flow.ts` `isUsableTranscript` | 일치 |
| 직원 콘솔: 알림 목록 `status/limit/cursor` | `staff.ts` `listAlerts`(limit 50, 커서 따라 최대 20쪽) | 일치 |
| SSE: 이벤트 `alert`/`resolved`, `heartbeat`, `resync` | `staff.ts` 구독 | 일치 |
| SSE: "끊기면 `Last-Event-ID`로 이어 받는다" | 오류 시 직접 닫고 새 `EventSource`를 열어 `Last-Event-ID`를 보내지 못함 | **어긋남 KF-12**(영역이 설계서에 밝힘) |
| 푸시 설정 null이면 SSE만 | `apps/staff/main.ts` 버튼 숨김 | 일치 |
| 푸시 구독 등록(멱등)·해지 `DELETE ?endpoint=` | `staff.ts` | 일치 |
| 개입 결정 본문, turn_id 규칙, 멈추지 않은 세션 409 | `decide.ts`, `client.ts` `intervene` | 일치 |
| A: `subject_ref` 형식 `[A-Za-z0-9._:/#=+-]{1,128}`, 선택 필드, 로그에 넣지 않음 | `device.ts` `SUBJECT_REF_RE`, `client.ts:57-59` | 일치 |
| C: 직원 세션 조회 | `staff.ts` `getSession` | 일치(`record.ts`가 표시) |
| E: `X-Openit-User`는 게이트웨이가 붙임 | 클라이언트는 보내지 않음 | 일치 |
| F: 기기 토큰 URL 쿼리 금지, 메모리만 | `device.ts` 조각 읽은 뒤 `replaceState`, 쿼리 사용 안 함, 저장소·쿠키·console 사용 없음(grep) | 일치 |
| G: 재알림 `POST .../staff-call/retry` `{turn_id}`, 응답 필드, 429 `INTERVAL`/`RETRY_LIMIT`, 409 `NO_OPEN_ALERT`, 멱등 | `client.ts:94-96`, `validate.ts:19-23`, `flow.ts:290-304` | 일치 |
| G: `report` `{outcome, turn_id}` -> `StaffAlert` | `client.ts:99-101`, `flow.ts report` | 일치(응답 검사는 `alert_id`,`session_id`만) |
| G: 5xx·시간 초과는 같은 turn_id 유지, 응답 뒤 새 호출은 새 turn_id | `flow.ts` `retryTurnId`, `report`의 `turnId` | 일치 |
| G: 호환(옛 서버 404/405 -> 기능 감지) | `flow.ts` `staffCallSupported` | 일치 |
| G: 직원 콘솔은 같은 `alert_id`를 합치고 `delivery_attempts`가 커졌을 때만 재알림 | `sync.ts` `isRedelivery`, `stale` 가드 | 일치 |
| G: 키오스크 안전 규칙(권고): `NOT_NOTIFIED`/상한/`NO_OPEN_ALERT`에도 직원 호출 화면 유지, 환자가 세션을 임의로 끝낼 수 없음 | `flow.ts:226-233` | **일부 어긋남 KF-11** |
| H: `pause_reason` 읽기, 모르는 값 OTHER, 없으면 미상 | `types.ts` `normalizePauseReason`, `flow.ts`, `alertinfo.ts` | 일치(`TurnFailureSignal` 쪽은 KF-18) |
| 읽기 모드: 모르는 열거값은 받아들임(HTTP.md 공통, CONVENTIONS 1절) | `validate.ts:13-19`는 `FrontendInput`의 열거값을 닫힌 집합으로 검사 | **어긋남 KF-07** |

### KF-07 (F, P2) 응답 검사가 모르는 열거값을 거부해 5xx처럼 재시도한 뒤 직원 호출로 보낸다
- 위치: `api/validate.ts:11,13-19`, `api/client.ts:150-152`
- 인용: `!WRITE.includes(s.write_committed as string) || !ALERT.includes(s.staff_alert as string)) throw new BadBodyError("turn_failure_signal");`
- 이유: HTTP.md 공통 절은 클라이언트가 응답을 "읽기 모드"로 검증해 같은 MAJOR의 모르는 필드·열거값은 받아들이라고 한다(INTEGRITY_ERROR는 필수 필드·타입·패턴 위반만). 이 영역은 새 `staff_alert` 값(예: 추가 열거)이 오면 `BadBodyError`로 보고 같은 turn_id를 최대 20초 재시도한 뒤 직원 호출 화면에 간다. design.md 3절이 "의도한 보수적 동작"이라 밝혔고 ADR 0005가 근거를 적었다. 계약이 정한 읽기 규칙과는 다르다. 같은 응답을 되풀이해 받을 뿐이어서 재시도는 결정적으로 실패한다.
- 최소 수정: 열거 검사는 "모르는 값은 안전한 쪽(직원 호출)으로 처리"하되 재시도 없이 즉시 처리하도록 분리하거나, 알려진 값만 분기하고 나머지는 무시한다.

### KF-11 (F, P2, 안전 관련) DELIVERY_FAILED 직원 호출 화면의 "직접 알렸어요, 처음으로"가 세션을 정지 상태로 두고 화면을 떠난다. 설계서와 코드가 서로 반대로 쓰여 있다
- 위치: `apps/kiosk/flow.ts:226-233`, `docs/design.md`("직원 호출 재알림·정지 사유" 절)
- 인용: 코드: `await this.report("STAFF_NOTIFIED_MANUALLY"); ... return this.reset();` / 설계서: "어느 경우에도 화면은 끝나지 않고 환자가 세션을 끝내지 못한다."
- 이유: PUBLIC_API.md G절 126행(권고)은 직원 호출 화면을 끝내지 않고 환자가 세션을 임의로 끝낼 수 없다고 한다. 구현은 첫 번째 누름에서 확인을 묻고, 두 번째 누름에서 보고 후 IDLE로 가서 새 세션을 시작할 수 있다. 서버 세션은 PAUSED_RISK로 남는다(직원 콘솔에서 보임). 확인 단계 + 보고라는 완화 장치가 있고 "권고" 수준이므로 P2로 둔다. 어느 쪽이 의도인지 문서끼리 어긋나 있다.
- 최소 수정: 설계서 문장을 현재 동작에 맞추거나(헤드에게 권고 해석 확인), 구현을 권고대로 바꾼다.

### KF-12 (F, P2) 알림 스트림 재연결이 `Last-Event-ID`를 보내지 않는다
- 위치: `api/staff.ts:40-42`, `:64`
- 인용: `새 EventSource는 Last-Event-ID를 보내지 않으므로 ... 놓친 알림은 호출자가 onState(true) 때 목록 API로 보충해야 한다.`
- 이유: PUBLIC_API.md 43행 "끊기면 `Last-Event-ID`로 이어 받는다". 재연결마다 서버는 이어 받을 수 없다고 보고 `resync`를 보낼 수 있다. 이 영역은 연결마다 알림 목록을 다시 읽는 보충으로 메우고(`sync.ts:206`) 이를 문서화했다(CR-004). 동작은 안전하지만 계약 문장대로는 아니다.
- 최소 수정: 마지막으로 받은 `id`를 보관해 `EventSource` 대신 `fetch` 스트림으로 `Last-Event-ID`를 보내거나, 계약이 "목록 보충이 정본"이라고 고치게 요청한다.

### KF-17 (F, P3) 503에 `Retry-After`가 없을 때 계약의 기본 1초보다 일찍 재시도한다
- 위치: `api/retry.ts:22`, `:31`, `api/client.ts:157`
- 인용: `baseMs: 500,` / `const wait = waitMs(i, e instanceof ApiError ? e.retryAfterMs : null, p, this.rand);`
- 이유: PUBLIC_API.md 19행 "`Retry-After`가 있으면 따르고 없으면 1초". 구현은 첫 재시도를 지터 포함 250~500ms에 한다. 전체 예산(20초) 안이라 영향은 작다. 기준 0.5초가 FAULT_POLICY와 ADR 0004의 임의 값이라는 점은 문서화되어 있다.
- 최소 수정: 503에서 `Retry-After`가 없으면 하한 1초로 한다.

## G. R7 이중 검증·재시도·재구현

- KF-09: 재시도 판정이 `api/retry.ts`와 `flow.ts`에 두 번(500 취급이 서로 다름).
- KF-08: 열거 검사의 열거가 `validate.ts`와 `types.ts`에 두 번.
- KF-04: 응답 신호가 이미 정지 여부를 알려 주는데 모든 일반 응답마다 상태를 다시 조회한다(신호가 null일 수 있다는 가정 때문. 서버 쪽 규칙을 클라이언트가 재확인).
- 확인했으나 위반으로 세지 않은 것: `apps/staff/decide.ts`의 turn_id 고정 + `client`의 재시도는 서로 다른 층(알림당 결정의 멱등 vs 전송 재시도)이고 같은 turn_id를 공유한다. 영역 바깥의 믿을 수 없는 입력(서버 응답)을 `validate.ts`로 거르는 것은 R7 비해당이다(서버는 다른 영역). 서버 응답 검증 자체의 계약 일치는 KF-07.

## 5. 요청받은 개별 확인 (요약)

1. 컴포넌트 목록: A절. 컴포넌트 사이 스키마(이벤트·뷰 모델)는 `KioskView`(flow.ts), `SyncStatus`/`SyncDeps`(sync.ts), `SttResult`, `KioskStart`, `ConnState`, `RecordViewerDeps`이며 타입 있는 정의다. 예외: STT 오류(KF-10).
2. `check-schema.mjs` 등 이웃 읽기: 허용된 읽기 전용 참조 범위 안이다. 다만 계약의 Python 소스 파일을 읽는 부분(KF-05)과 고정 태그가 아닌 작업 트리를 읽는 점(KF-06)을 발견으로 올렸다. 시험 3개와 스크립트 1개가 이웃을 읽고, 이웃이 없으면 `check-schema`는 이유를 내고 비0 종료(`check-schema.mjs:4-9`).
3. I10 대조: F절 표.
4. 모의 서버가 서버 형식을 만드는 곳: KF-13 표.
5. 대화 내용 표시: 위 0절.
6. 계약에 없는 경계 형식: KF-01(기기 설정, 시작 URL 조각, `CONFIG_FILE`), KF-02(이미지 인터페이스), KF-03(푸시 본문), KF-04(위험 정지 신호), KF-13(알림 `kind` 정본).

## 문제없음으로 확인한 항목 (범위 표시)

- 이웃 코드 import/경로: `grep -rn "\.\./(survey-service|boundary-contracts|head|deploy)"`를 `api/ apps/ mock-server/ server/ scripts/ test/ Dockerfile package.json`에 실행. 코드에는 없고, 스크립트·시험 4곳만 일치(D절).
- 환자 발화 저장·로그: `grep -rn "console\.|localStorage|sessionStorage|document.cookie|indexedDB" api apps mock-server server`: 일치는 정적 서버·모의 서버의 시작/접속 로그(`console.log`, 경로·상태만)뿐이다(`server/static.mjs:45-50`, `mock-server/main.ts:20`). 발화 본문은 모의 서버 요청 로그에도 남기지 않는다(app.ts `log: { method, path }`).
- 비밀: 소스에서 환경 변수로 비밀을 읽는 곳 없음. 기기 토큰은 메모리(`createStartHolder`)와 헤더에만. 이 점검에서 환경 변수·`.env`·`secrets/`를 읽거나 출력하지 않았다.
- 컨테이너 규약(읽기로): `Dockerfile`은 non-root(`USER node`), 라벨 `io.openit.service|revision|contracts.boundary|contracts.survey-schema`, `/healthz` 헬스체크, 로그 표준 출력. `scripts/smoke.sh`는 `-p 127.0.0.1::8080`(고정 포트 없음), 컨테이너·이미지 이름에 리포 이름 포함. 실행은 하지 않았다.
- 정적 서버 보안 헤더·경로 이탈 방지(`static.mjs:14-22`)는 읽었고 R1~R7과 무관해 발견에 올리지 않았다.
- 타입 검사·시험: 위 0절 실행 결과.

## 점검하지 못한 것

- 실행하지 않음: `npm run smoke`, `npm run test:dom`, `npm run test:e2e`(Docker 필요, 브라우저 시험 32개), `npm run build`(dist를 덮어써서 점검 중 쓰지 않았다). 따라서 "키오스크 화면에 대화 내용이 안 보인다"와 "직원 콘솔이 대화를 보인다"는 코드 읽기 결과이고 브라우저에서 확인하지 않았다.
- 계약 패키지의 적합성 시험(`conformance/`)은 Python 용이라 Node 클라이언트에 돌리지 못했다. `conformance/servers.py`는 600행 근처 일부만 읽었다(KF-04의 참조 서버 모사 여부 미확인).
- 읽지 않은 파일: `apps/kiosk/kiosk.css`, `apps/staff/staff.css`, `test-e2e/browser.e2e.test.ts` 본문, `test/` 대부분의 본문(이름·일부 구간만), `docs/adr/*` 본문(0014·0005 일부 외 제목·한두 줄), `docs/runbook.md`(grep한 줄만), `docs/STATUS.md` 일부, `package-lock.json`.
- 이웃 영역 구현(survey-service 서버, deploy 게이트웨이)은 규칙상 읽지 않았다. KF-01의 "deploy 쪽 문서에서 일치"는 `grep -l`이 낸 deploy 파일 이름 목록으로만 보았고 내용은 열지 않았다. 이 `grep -l` 자체가 `../deploy`를 훑은 것이라 워크스페이스의 읽기 허용 범위(문진 스키마, boundary-contracts, areas.json, 그리고 이번 점검 한정 기준서)를 벗어난 접근이었다. 내용을 읽거나 수정하지는 않았음을 밝힌다. `deploy/scripts/lib.sh`의 버전 기준표는 읽지 않아 `v2.1.1`이 현재 기준표와 같은지는 확인하지 못했다.
- 심각도 P1/P2/P3는 기준서 정의를 이 영역 사정에 적용한 판단이다(특히 KF-01을 P1, KF-11을 P2로 둔 것은 헤드가 조정할 수 있다).
