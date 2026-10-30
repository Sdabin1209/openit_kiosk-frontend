# 컴포넌트 분해 (U400, D117)

정본 규칙: `head/docs/DESIGN.md`. 입력은 계약(boundary-contracts, 고정 태그는 `Dockerfile`의 `ARG BOUNDARY_CONTRACT`)과 `docs/brief.md`다. 기존 코드는 정의의 근거가 아니라 빠진 업무 규칙·거부 조건을 찾는 대조 자료로만 썼다(대조 결과: `schemas/README.md`).

## 업무 단계 (브리프 1절·4절에서)

키오스크: 시작 값 정하기 -> 세션 시작 -> 음성 듣기 -> 쓸 수 있는 발화인지 가리기 -> 발화 보내기 -> 응답 처리(직원 호출 실패·저장 실패·위험 정지) -> 정지 대기 폴링 -> 직원 다시 부르기 -> 종료·유휴 초기화 -> 대화 목록 -> 화면 문구. 직원 콘솔: 알림 목록 동기화(스트림 + 목록 보충) -> 알림 보조 정보 -> 개입 결정(확인, 중복 방지) -> 푸시 구독·알림 문구. 공통: 재시도 판단, 공개 API 보내기.

## 컴포넌트 표 (`src/components/`)

| 컴포넌트 | 파일 | 입력 타입 | 출력 타입 | 하는 일 |
|---|---|---|---|---|
| 공개 API 보내기 (링크, 보내는 쪽) | `link_public_api_send.ts` | `StartRequest`, `UtteranceRequest`, `SessionRequest`, `StaffCallRetryInput`, `StaffCallReportInput`, `InterventionRequest` (+ 직원 REST 호출) | 계약 `FrontendInput`, `SessionState`, `StaffCallRetryResult`, `StaffAlertPage`, `StaffSessionView`, `PushConfig`, 실패는 `ApiFailure` | 공개 API(`/v1`)를 부른다. 세션별 순서 큐, 10초 타임아웃, 응답 본문 수용 검사(`FrontendBody` 등), 상태 코드 해석(401·403 = `auth`, `BoundaryError` -> `code`·`reason`)을 이 한 곳에서만 한다 |
| 직원 스트림 받기 (링크, 받는 쪽) | `link_staff_stream_receive.ts` | 스트림 주소, 재연결·하트비트 판단 함수 | 계약 `StaffAlert` 이벤트, 연결 상태 | SSE(`GET /v1/staff/alerts/stream`)를 직접 재연결하며 받는다. 하트비트 무음 감시, resync |
| 기기 설정 받기 (링크, 받는 쪽) | `link_device_config_receive.ts` | 창(location·history) | 조각 문자열, `/config.json` 본문 또는 null (`StartInput`의 두 칸) | 시작 URL 조각을 읽고 주소창에서 지운다. `/config.json`을 읽는다. 값 해석은 하지 않는다 |
| 재시도 정책 | `retry_policy.ts` | `RetryPolicy`(만들 때), `RetryQuery`, `StatusQuery` | `RetryDecision`, `StatusClass` | 대기 시간(지수 백오프 + 지터, Retry-After 하한), 예산 초과 판단, 재시도 가능·처리 여부 불명 분류 |
| 시작 값 | `start_values.ts` | `StartInput` | `KioskStart` | 조각 + 기기 설정을 계약 `DeviceConfig`·`KioskStartFragment`로 검증해 기기 토큰·환자 참조·외부 STT 허용을 정한다. 환자 참조는 한 번 쓰면 비우는 보관소 |
| 키오스크 상태 기계 | `kiosk_flow.ts` | 환자 조작, `UsableTranscript`, 공개 API 포트(주입) | `KioskView`, `ConversationEvent` | 위의 키오스크 업무 단계 전부의 상태 전이. 유휴 경고·만료, 다시 말하기 상한, 직원 호출·재알림, 위험 정지 폴링 |
| 음성 인식 | `stt_adapter.ts` | 마이크(`listen`) | `SttResult`, 실패는 `SttErrorKind` | 브라우저 Web Speech API(ko-KR), 기기 안 인식만 기본(D88 U3) |
| 대화 목록 | `chat_log.ts` | `ConversationEvent` | `ChatView` | 말풍선을 메모리에만 두고 같은 id는 한 번만 만든다, 최대 100개 |
| 환자 문구 | `patient_copy.ts` | 문구 키 | 문구 `{text, reviewed}` | 환자에게 보이는 글의 유일한 자리(D89 임상 문구 통제) |
| 개입 결정 | `intervention_decision.ts` | `DecisionRequest` | 서버 응답 또는 null(취소) | 확인을 받고, 같은 알림·같은 결정은 같은 `turn_id`로 한 번만 보낸다 |
| 알림 동기화 | `alert_sync.ts` | 알림 목록·스트림 포트(주입) | `SyncStatus`, 알림 맵 | 스트림 + 목록 보충, 재전달(`delivery_attempts` 증가) 판정, 조용히 빈 화면 금지 |
| 알림 보조 정보 | `alert_info.ts` | `AlertInfoInput` | `PauseLabel`, 문자열 줄 | 정지 사유·전달 상태를 글자 접두로 바꾼다 |
| 푸시 구독 | `push_subscription.ts` | 공개키를 얻는 함수, 등록 함수(주입) | 구독 등록·해지 | 브라우저 PushManager(바깥 자원)를 다룬다 |
| 푸시 알림 문구 | `push_notification.ts` | 푸시 본문(`StaffPushPayload`) | `PushNotification` | 계약을 어긴 본문은 일반 문구와 고정 tag |

## 컴포넌트가 아닌 것

| 위치 | 역할 |
|---|---|
| `src/types/` | `schemas/`와 계약·문진 스키마에서 생성(손대지 않음). 검증기 `validators.gen.cjs` 포함 |
| `src/wiring/` | `public_api.ts`(링크에 재시도 정책·턴 ID 주입, 직원 서버 면 묶기), `kiosk.ts`(시작 값 읽기 -> 결정, 상태 기계에 주입), `staff.ts`(개입 결정·동기화 조립), `ids.ts`(턴 ID 발급) |
| `src/ui/` | 화면 부품(DOM): `kiosk_screen.ts`, `chat_view.ts`, `record_view.ts`. DESIGN.md 3절의 뜻(TypeScript 화면 리포) |
| `src/kiosk/main.ts`, `src/staff/main.ts`, `src/staff/sw/index.ts` | 진입점(조립 호출만). `index.html`, 스타일 |
| `src/config.ts` | 설정 값(재시도·유휴·재질문 상한 등)과 근거. 업무 규칙을 두지 않는다 |
| `mock-server/` | 공개 API의 대역(이웃의 메모리 구현에 해당). 컴포넌트가 아니다 |

## 컴포넌트 사이 규칙 확인

- 컴포넌트끼리 import하지 않는다. 필요한 다른 컴포넌트의 기능은 함수 모양 포트로 wiring이 주입한다. 이 규칙은 `test/test_structure.test.ts`가 강제한다.
- HTTP(`fetch`, `EventSource`)는 `link_*`에만 있다(같은 시험).
- 컴포넌트 사이 타입은 `schemas/`에 한 번, 영역 사이 타입은 계약(고정 태그)·문진 스키마에서 생성한다.
