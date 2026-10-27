# kiosk-frontend 설계서

상태: 초안(참고 구현). 표시: [확인] 계약 문서에서 읽은 것, [제안] 이 영역이 정한 것, [미정] 정해지지 않은 것.

## 1. 원칙
- 의존은 `PUBLIC_API.md`(I10) 하나. 서버 주소는 같은 출처의 `/v1`(상대 경로). 서버 비밀은 어디에도 없다. 키오스크는 기기 토큰(시작 URL 조각 또는 `/config.json`)을 메모리에만 두고 `/v1/sessions*`에 Bearer로 보낸다(D85 F절). 직원 인증은 게이트웨이가 붙인다.
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
| STARTING | 세션 시작 호출 중. 재시도 중이면 `retrying`(대기 문구 + 직원 부르기·그만하기) | 성공 -> LISTENING, 실패(재시도 예산 소진) -> CALL_STAFF, 직원 부르기 -> CALL_STAFF(`STAFF_REQUESTED`) |
| LISTENING | 발화 대기 | 발화 -> SENDING, 빈/불신 STT -> REPEAT_PROMPT, 종료 -> ENDING |
| REPEAT_PROMPT | "다시 말씀해 주세요"(서버 호출 없음) | -> LISTENING |
| SENDING | 턴 호출 중(하나씩). 재시도 중이면 `retrying`: "잠시만 기다려 주세요" + 직원 부르기·그만하기 | 응답 처리표 참조, 직원 부르기 -> CALL_STAFF(`STAFF_REQUESTED`), 그만하기 -> ENDING |
| WAITING_STAFF | 위험 정지, 직원 호출 전달됨. 말은 받지 않고 `GET /sessions/{id}/state`를 2초 간격 폴링(D66) | ACTIVE -> LISTENING(`resume_text` 표시), ENDED -> ENDED, 404 -> IDLE, 401/403 -> CALL_STAFF |
| CALL_STAFF | 직원을 직접 부르는 화면 | 직원이 "처음으로" -> IDLE |
| ENDING / ENDED | 종료 호출 / 종료 화면 | ENDED -> 일정 시간 후 IDLE |

응답 처리(`FrontendInput`):
- 신호 없음 -> response_text 표시, LISTENING.
- `staff_alert = DELIVERY_FAILED` -> CALL_STAFF(최우선).
- `staff_alert = DELIVERED` -> WAITING_STAFF.
- `write_committed = NOT_COMMITTED`(DELIVERY_FAILED가 아닐 때) -> 다시 말해 달라고 안내, LISTENING.
- 재시도 예산(20초) 소진, 401/403 -> CALL_STAFF. 500·그 밖의 4xx(429 제외)는 재시도 없이 오류로 처리. 404 -> 세션 만료 안내 후 IDLE. 409 -> 위험 정지 중으로 보고 WAITING_STAFF(폴링으로 확인). 위험 정지 세션은 유휴 만료되지 않는다(계약).

### 재시도와 대기 화면 (FAULT_POLICY 원칙 2·3·7)
- 정책 값은 `api/retry.ts` 한 곳(기준 0.5초, 배율 2, 상한 5초, 예산 20초, 지터 하한 50%)에 근거와 함께 둔다. 예산·값이 임상 현장에 맞는지는 FAULT_POLICY의 사용자 결정 대기 항목이며 실측으로 확인하지 못했다. 예산은 타임아웃과 대기를 합산하며 시작한 시도는 끊지 않으므로 최악 약 예산 + 10초(한 번의 타임아웃)까지 길어질 수 있다.
- 재시도가 시작되면 화면은 "잠시만 기다려 주세요"(기존 STARTING 문구)와 안내 문장, "직원 부르기", "그만하기"를 보인다. 안내 문장은 임상 문구가 아닌 임시 UI 문구다. 직원 부르기는 진행 중 요청을 끊고 CALL_STAFF, 그만하기는 끊고 세션 종료를 요청한다. 이미 서버가 확정한 턴이 있을 수 있으나 같은 `turn_id` 재전송은 멱등이라 안전하다(서버 계약).
- 409 `details.reason = TURN_IN_PROGRESS`(+`Retry-After`)의 형식은 PUBLIC_API.md 409 행으로 확정되었다. 모의 서버는 시나리오 `turn_in_progress`로 이를 낸다. 실제 survey-service가 이 응답을 내는지는 확인하지 못했다. reason이 없거나 다른 409는 기존대로 WAITING_STAFF.

## 4. 공개 API 호출 규칙 대응표
| 규칙(PUBLIC_API.md) | 구현 위치 |
| --- | --- |
| 세션 ID는 프론트가 발급(1~64자, 영문·숫자·`-_`) | `api/ids.ts` `newSessionId` |
| 턴마다 고유 `turn_id` | `api/ids.ts` `newTurnId`, 발화 호출 한 번에 하나 |
| 같은 `turn_id` 재전송은 안전 | `api/client.ts` 재시도는 같은 `turn_id` |
| 10초 무응답이면 같은 `turn_id`로 재시도, 총 재시도 예산(기본 20초)을 넘으면 직원 호출(FAULT_POLICY 원칙 7; 이전 "3회 실패"를 대체) | `api/client.ts` `AbortController` 타임아웃, 예산 소진 시 `CallStaffError`. 값과 근거는 `api/retry.ts` |
| 한 세션의 요청은 순서대로 하나씩 | `api/client.ts` 세션별 직렬 큐 |
| 상태 코드로 분기(D66 표 + FAULT_POLICY). 429·502·503·504·네트워크 오류·무응답은 지수 백오프(0.5초 x2, 상한 5초, 지터 50~100%)로 재시도하고 `Retry-After`가 있으면 그 이상 기다린다(위로만 지터). 409 중 본문 `code = CONFLICT`이면서 `details.reason = TURN_IN_PROGRESS`인 것만 (PUBLIC_API.md 409 행) 같은 `turn_id`로 재시도하고 나머지 409는 기존대로 WAITING_STAFF. 400/401/403/404/500은 재시도 안 함. `Retry-After`가 남은 예산보다 길면 기다리지 않고 직원 호출 | `api/client.ts`, `api/retry.ts` |
| `turn_id`는 봉투 필드: 떼어 낸 나머지가 FrontendMessage/InterventionDecision | 시험 `test/mock.test.ts`, 모의 서버 |
| 위험 정지 중 상태 폴링 2초 | `apps/kiosk/flow.ts` |
| SSE 이벤트 `alert`/`resolved`, 15초 `: ping` | `api/staff.ts`, 모의 서버 |
| `turn_failure_signal` 처리 | `apps/kiosk/flow.ts` |
| 빈/불신 STT는 보내지 않음 | `apps/kiosk/flow.ts` `isUsableTranscript` |
| 개입 결정: 확인 후 전송, 알림당 같은 `turn_id` | `apps/staff/decide.ts` |
| SSE `Last-Event-ID` 이어 받기 | 브라우저 `EventSource` 자동 재연결, `api/staff.ts` |
| 푸시 구독 등록(멱등)·해지 | `api/staff.ts`, `apps/staff/push.ts`, `sw.js` |
| 모르는 `kind`·열거값은 그대로 표시, 죽지 않음 | `api/types.ts` 관대한 읽기 |
| 기기 토큰 헤더는 `/sessions*`에만, 직원 경로에는 붙이지 않음 | `api/client.ts`(`deviceToken` 옵션), `test/d85.test.ts` |

## 5. 모의 서버 시나리오 (`mock-server/`)
계약의 모든 호출(세션·턴·종료·healthz/readyz·알림 목록·SSE·푸시 구독 등록/해지·개입)을 구현하고 `FrontendInput`을 스키마로 검증하는 시험을 둔다.
시나리오는 제어 경로 `POST /__mock/scenario`(계약 밖, 모의 전용)나 환경 변수로 고른다.
- `normal`: 문진 흐름 몇 턴 후 안내.
- `risk_resume`(위험 정지 4초 뒤 직원이 재개한 것처럼 처리), `rate_limited`(429+Retry-After), `turn_in_progress`(409 CONFLICT + details.reason + Retry-After)
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
server/         정적 파일 서버(/healthz, /readyz)
scripts/        빌드, 스키마 대조, 스모크
test/           자동 시험
Dockerfile, package-lock.json
```

## 7. 기술 선택과 이유
- TypeScript 순수(프레임워크 없음). 번들은 작게, 의존은 최소. 화면이 단순하다.
- 빌드는 esbuild 하나. 시험은 `node:test`(Node 24가 타입 제거를 지원). 개발 의존은 esbuild, typescript, ajv(스키마 대조)뿐이고 런타임 의존은 없다. 잠금 파일은 `package-lock.json`.
- 글꼴·스크립트는 모두 이미지에 포함, 외부 CDN 없음. 글꼴은 시스템 한국어 글꼴 우선 [미정: 오프라인 글꼴 파일 포함은 라이선스 결정 후].
- 정적 서버는 Node 작은 스크립트(non-root). `/healthz`, `/readyz`. VAPID 공개키는 서버의 `GET /v1/staff/push-config`에서 받고, null이면 푸시 UI를 끄고 SSE만 쓴다.
- STT: `SttAdapter` 인터페이스, 기본은 Web Speech API(`ko-KR`) [미정: 한국어 정확도 확인 못 함].
- 스키마 대조: `scripts/check-schema.mjs`가 `../survey-service/schema/schemas`를 읽어 열거값을 `api/types.ts`와 비교한다(스키마 복사본을 두지 않음).

## 8. 경계 밖으로 넘기는 것
변경 요청 `docs/change-requests/`: 게이트웨이 인증·정적 서빙·/v1 프록시·직원 콘솔 접근 제어(deploy), 계약 부족분(헤드).
