# schemas/ — 이 영역 내부 타입의 JSON Schema (draft 2020-12)

파일 하나 = 타입 하나, 파일 이름 = 타입 이름. 통과·거부 예시는 `examples/<타입>.valid*.json`, `<타입>.invalid*.json`이고 `test/test_structure.test.ts`가 결과를 확인한다. 코드 타입과 검증기는 여기서 생성한다(`npm run gen-types`, 이 리포 README 4절).

영역 사이 타입(`DeviceConfig`, `SessionState`, `StaffCallReport` 등)은 복사하지 않고 `$ref`로 계약을 가리킨다(`<이름>.schema.json#/properties/...`, 고정 태그). 공개 API 본문 타입(`FrontendInput`, `StaffAlert` 등)은 문진 스키마·계약에서 `src/types/`로 직접 생성한다.

## 받는 쪽 관대한 읽기 스키마 (`*Body`)

`FrontendBody`, `StartedBody`, `SessionStateBody`, `StaffCallRetryBody`, `StaffAlertBody`는 계약 응답 스키마의 복사가 아니라 **이 영역이 응답을 성공으로 받아들이는 조건**이다. 계약은 모르는 키를 거부(`additionalProperties: false`)하지만 읽는 쪽은 서버가 필드를 늘려도 환자 턴을 막지 않도록 모르는 키를 허용하고(ADR 0005), `state`의 모르는 값도 받는다. 어기면 성공으로 취급하지 않고 일시 장애처럼 재시도한다(FAULT_POLICY 원칙 10).

## 스키마 밖 조건

기존 코드의 거부 지점(`if` 검사, `throw`, 반환 거부)을 `api/`·`apps/` 전체에서 훑어 옮겼다. 옮기지 못한 것은 아래 표에 있다. 현재 개수: **3건**(전부 입력 값이 아니라 컴포넌트가 가진 상태·시간에 의존하는 조건이라 입력 스키마의 몫이 아니다).

| 조건 | 이유 |
|---|---|
| 상태 기계의 현재 상태 가드(`start`는 IDLE에서만, `hear`는 LISTENING·REPEAT_PROMPT에서만, `leaveCallStaff`는 CALL_STAFF에서만 등 어긋난 호출은 무시) | 입력 스키마는 입력 하나의 모양만 말하고, 이 조건은 입력과 컴포넌트의 현재 상태를 함께 본다. 출력은 `KioskView`의 `if/then`으로 상태별 필수 필드를 검증한다 |
| 같은 알림·같은 결정의 중복 클릭 병합, 같은 발화의 `turn_id` 재사용 | 이전 호출의 기록에 의존한다(멱등 규칙). 입력 하나로 판정할 수 없다 |
| 시간 의존(응답 10초 타임아웃, 총 재시도 예산, 유휴 만료, 재알림 카운트다운) | 시계에 의존한다. 정책 값의 모양은 `RetryPolicy`, 판단 입력은 `RetryQuery`로 스키마에 있고 값은 `config.ts` |

옮긴 거부 지점의 대응(대조 기록):

| 기존 코드의 거부 | 옮긴 곳 |
|---|---|
| 잘못된 session_id(1~64자 영문·숫자·-_) | `SessionRequest`, `UtteranceRequest` 등 (계약 `SessionState.session_id`를 `$ref`) |
| 빈 발화 | `UtteranceRequest.utterance` (`\S` 패턴) |
| 잘못된 subject_ref | `StartRequest` (계약 `DeviceConfig.subject_ref`를 `$ref`) |
| 응답 본문 형식(FrontendInput, 시작 응답 session_id, SessionState, 재알림 결과, 알림 본문) | `FrontendBody`, `StartedBody`, `SessionStateBody`, `StaffCallRetryBody`, `StaffAlertBody` |
| STT 결과가 비었거나 신뢰도 0.4 미만(서버로 보내지 않음) | `UsableTranscript` |
| 빈 말풍선, 모르는 대화 이벤트 | `ConversationEvent` |
| 말풍선 100개 상한 | `ChatView.maxItems` (`chat_log.ts`의 `MAX_BUBBLES`는 같은 값, 스키마가 정본) |
| 설정·조각의 모르는 키, 형식 오류 | 계약 `DeviceConfig`, `KioskStartFragment` (검증기를 `src/types/validators.gen.cjs`로 생성) |
| 푸시 본문의 모르는 키, session_id 없음 | 계약 `StaffPushPayload` |
| 재시도 정책 값의 범위 | `RetryPolicy` |
| 개입 결정 입력(알림 ID 빈 값, 결정 열거) | `DecisionRequest`, `InterventionRequest` |
| 화면 상태의 조건부 필수(CALL_STAFF는 사유 필수 등) | `KioskView`의 `allOf/if/then` |

값 자체가 판단인 설정(유휴 60초, 재질문 3회, 재시도 예산 20초 등)은 스키마가 아니라 `src/config.ts`에 근거와 함께 있다. 신뢰도 0.4만 입력 조건이므로 `UsableTranscript`가 정본이다(사용자 결정 U10, 잠정, 근거 없는 임의 값, 측정하지 않았다, ADR 0008).

## 보내는 요청 본문 검증 (R7, U424)

보내기 전에 본문 전체를 스키마로 검증한다. 어기면 보내지 않는다. 세션 시작·발화·종료는 문진 스키마 `FrontendMessage`, 개입 결정은 `InterventionDecision`(고정 태그 survey-schema-v3.0.0, `src/types/validators.gen.cjs`로 생성, 복사본 없음), 직원 호출 재알림·보고는 계약 `StaffCallRetryRequest`·`StaffCallReport`. `turn_id`는 API 봉투 필드(PUBLIC_API.md)라 본문에서 떼어 낸 나머지를 문진 스키마로 검증한다. 시험은 fetch 가짜가 받은 실제 본문을 같은 검증기로 검증한다(`test/client.test.ts`, `test/staffcall.test.ts`).
