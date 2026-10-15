# kiosk-frontend 설계서

상태: 초안(참고 구현). 표시: [확인] 계약 문서에서 읽은 것, [제안] 이 영역이 정한 것, [미정] 정해지지 않은 것.

## 1. 원칙
- 의존은 `PUBLIC_API.md`(I10) 하나. 서버 주소는 같은 출처의 `/v1`(상대 경로). 서버 토큰은 어디에도 없다. 인증은 게이트웨이가 붙인다 [제안, CR-001].
- 환자 발화와 응답은 메모리에서만 다룬다. 저장소·쿠키·콘솔·외부 서비스에 남기지 않는다.
- `api/`는 UI를 모른다. 두 앱은 `api/`만 통해 서버와 말한다. 이 리포지토리를 통째로 바꿔도 나머지 시스템은 그대로다.

## 2. 화면 흐름 (키오스크)
시작 -> 안내 문장 표시 -> 듣기 -> (확인 중) -> 응답 표시 -> 듣기 ... -> 종료.
예외 화면: 다시 말씀해 주세요 / 직원이 오고 있습니다 / 직원을 불러 주세요 / 연결 끊김.
한 화면에 행동은 하나(큰 버튼 하나, 음성 우선). STT를 쓸 수 없으면 입력창 폴백.

## 3. 상태 기계 (키오스크, `apps/kiosk/flow.ts`)
| 상태 | 뜻 | 다음 |
| --- | --- | --- |
| IDLE | 시작 화면 | 시작 -> STARTING |
| STARTING | 세션 시작 호출 중 | 성공 -> LISTENING, 실패(재시도 소진) -> CALL_STAFF |
| LISTENING | 발화 대기 | 발화 -> SENDING, 빈/불신 STT -> REPEAT_PROMPT, 종료 -> ENDING |
| REPEAT_PROMPT | "다시 말씀해 주세요"(서버 호출 없음) | -> LISTENING |
| SENDING | 턴 호출 중(하나씩) | 응답 처리표 참조 |
| WAITING_STAFF | 위험 정지, 직원 호출 전달됨 | 환자가 직원 안내 후 다시 말하면 -> LISTENING |
| CALL_STAFF | 직원을 직접 부르는 화면 | 직원이 "처음으로" -> IDLE |
| ENDING / ENDED | 종료 호출 / 종료 화면 | ENDED -> 일정 시간 후 IDLE |

응답 처리(`FrontendInput`):
- 신호 없음 -> response_text 표시, LISTENING.
- `staff_alert = DELIVERY_FAILED` -> CALL_STAFF(최우선).
- `staff_alert = DELIVERED` -> WAITING_STAFF.
- `write_committed = NOT_COMMITTED`(DELIVERY_FAILED가 아닐 때) -> 다시 말해 달라고 안내, LISTENING.
- 재시도 3회 소진, 401/403 -> CALL_STAFF. 404 -> 세션 만료 안내 후 IDLE. 409 -> 위험 정지 중으로 보고 WAITING_STAFF.

## 4. 공개 API 호출 규칙 대응표
| 규칙(PUBLIC_API.md) | 구현 위치 |
| --- | --- |
| 세션 ID는 프론트가 발급(1~64자, 영문·숫자·`-_`) | `api/ids.ts` `newSessionId` |
| 턴마다 고유 `turn_id` | `api/ids.ts` `newTurnId`, 발화 호출 한 번에 하나 |
| 같은 `turn_id` 재전송은 안전 | `api/client.ts` 재시도는 같은 `turn_id` |
| 10초 무응답이면 재시도, 3회 실패 시 직원 호출 | `api/client.ts` `AbortController` 타임아웃, 시도 3회 후 `CallStaffError` |
| 한 세션의 요청은 순서대로 하나씩 | `api/client.ts` 세션별 직렬 큐 |
| 503·429는 재시도 가능, 400/401/403/404/409는 재시도 안 함 | `api/client.ts` 분류 |
| `turn_failure_signal` 처리 | `apps/kiosk/flow.ts` |
| 빈/불신 STT는 보내지 않음 | `apps/kiosk/flow.ts` `isUsableTranscript` |
| 개입 결정: 확인 후 전송, 알림당 같은 `turn_id` | `apps/staff/decide.ts` |
| SSE `Last-Event-ID` 이어 받기 | 브라우저 `EventSource` 자동 재연결, `api/staff.ts` |
| 푸시 구독 등록(멱등)·해지 | `api/staff.ts`, `apps/staff/push.ts`, `sw.js` |
| 모르는 `kind`·열거값은 그대로 표시, 죽지 않음 | `api/types.ts` 관대한 읽기 |
| 인증 헤더를 붙이지 않음 | `api/client.ts`(토큰 인자 없음), 시험으로 고정 |

## 5. 모의 서버 시나리오 (`mock-server/`)
계약의 모든 호출(세션·턴·종료·healthz/readyz·알림 목록·SSE·푸시 구독 등록/해지·개입)을 구현하고 `FrontendInput`을 스키마로 검증하는 시험을 둔다.
시나리오는 제어 경로 `POST /__mock/scenario`(계약 밖, 모의 전용)나 환경 변수로 고른다.
- `normal`: 문진 흐름 몇 턴 후 안내.
- `risk_stop`: 발화에 "위험"이 있으면 정지, 알림 저장, `DELIVERED`.
- `delivery_failed`: 정지하되 `DELIVERY_FAILED`(알림은 목록에서 조회됨).
- `not_committed`: `NOT_COMMITTED` 신호.
- `delay`(ms), `hang`(앞 N번 무응답, 같은 `turn_id` 재시도 시험), `error`(상태 코드, 횟수).
- 같은 `turn_id`는 같은 응답을 돌려주고 한 번만 처리. 멈추지 않은 세션의 개입은 409.

## 6. 디렉터리 구조
```
api/            공개 API 클라이언트(UI 무관)
mock-server/    모의 서버(Node, 의존 없음)
apps/kiosk/     키오스크 앱(flow.ts 상태 기계, stt.ts 어댑터, main.ts UI)
apps/staff/     직원 콘솔(main.ts, decide.ts, push.ts, sw.ts)
server/         정적 파일 서버(/healthz, /readyz, /config.json)
scripts/        빌드, 스키마 대조, 스모크
test/           자동 시험
Dockerfile, package-lock.json
```

## 7. 기술 선택과 이유
- TypeScript 순수(프레임워크 없음). 번들은 작게, 의존은 최소. 화면이 단순하다.
- 빌드는 esbuild 하나. 시험은 `node:test`(Node 24가 타입 제거를 지원). 개발 의존은 esbuild, typescript, ajv(스키마 대조)뿐이고 런타임 의존은 없다. 잠금 파일은 `package-lock.json`.
- 글꼴·스크립트는 모두 이미지에 포함, 외부 CDN 없음. 글꼴은 시스템 한국어 글꼴 우선 [미정: 오프라인 글꼴 파일 포함은 라이선스 결정 후].
- 정적 서버는 Node 작은 스크립트(non-root). `/healthz`, `/readyz`, `/config.json`(공개 값만, VAPID 공개키).
- STT: `SttAdapter` 인터페이스, 기본은 Web Speech API(`ko-KR`) [미정: 한국어 정확도 확인 못 함].
- 스키마 대조: `scripts/check-schema.mjs`가 `../survey-service/schema/schemas`를 읽어 열거값을 `api/types.ts`와 비교한다(스키마 복사본을 두지 않음).

## 8. 경계 밖으로 넘기는 것
변경 요청 `docs/change-requests/`: 게이트웨이 인증·정적 서빙·/v1 프록시·직원 콘솔 접근 제어(deploy), 계약 부족분(헤드).
