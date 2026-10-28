# kiosk-frontend 설계서

상태: 초안(참고 구현). 표시: [확인] 계약 문서에서 읽은 것, [제안] 이 영역이 정한 것, [미정] 정해지지 않은 것.

## 1. 원칙
- 의존은 `PUBLIC_API.md`(I10) 하나. 서버 주소는 같은 출처의 `/v1`(상대 경로). 서버 비밀은 어디에도 없다. 키오스크는 기기 토큰(시작 URL 조각 또는 `/config.json`)을 메모리에만 두고 `/v1/sessions*`에 Bearer로 보낸다(D85 F절). 직원 인증은 게이트웨이가 붙인다.
- 환자 발화와 응답은 메모리에서만 다룬다. 저장소·쿠키·콘솔·분석 서비스에 남기지 않는다. 음성은 기기 안 인식(processLocally)만 쓰고 기기가 지원하지 않으면 음성 입력을 끈다(외부 인식은 기기 설정 `allow_remote_stt`로만 허용, 기본 꺼짐, D88 U3). 이전 문장 "외부 서비스에 남기지 않는다"는 브라우저 STT가 음성을 제공자로 보낼 수 있다는 사실과 어긋나 고쳤다.
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
| CALL_STAFF | 직원을 직접 부르는 화면 | "처음으로" -> `leaveCallStaff()`: 서버에 세션 종료를 먼저 보내고(실패하면 한 번 더, 그래도 실패하면 화면만) IDLE. 단 DELIVERY_FAILED는 세션을 끝내지 않고 한 번 더 확인한 뒤 IDLE(아래) |
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
- 409 `details.reason = TURN_IN_PROGRESS`(+`Retry-After`)의 형식은 PUBLIC_API.md 409 행으로 확정되었다. 모의 서버는 시나리오 `turn_in_progress`로 이를 낸다. survey-service가 이 형식을 구현했다고 헤드가 알려 왔고(survey-service 757351e, 이 영역은 그 리포지토리를 읽지 않아 직접 확인하지 못했다) 이 영역은 그 형식에 맞췄다(e69d441). 이 PC의 전체 E2E에서 실제 survey-service와 키오스크를 잇는 시험은 아직 없다. 이 경로는 모의 서버와 가짜 fetch 시험으로만 확인했다. reason이 없거나 다른 409는 기존대로 WAITING_STAFF.

### 깨진 응답과 정적 서버 장애 (FAULT_POLICY 원칙 10, FAULT_MATRIX A1·A2 F6, A3)
- 키오스크 클라이언트는 세션 시작·발화·종료·개입 응답을 `FrontendInput` 모양으로, 상태 폴링 응답을 `SessionState` 모양으로 검사한다(`api/validate.ts`). HTML·빈 본문·204·잘린 JSON·배열·`response_text` 누락/숫자/빈 문자열·알 수 없는 신호 값은 `BadBodyError`가 되어 5xx와 같은 재시도 대상이다(같은 `turn_id`, 예산 20초). 계속되면 직원 호출 화면이고 응답 문장을 지어내지 않는다. 이전에는 JSON 파싱 실패만 재시도되고, 빈 본문 200이나 필드가 빠진 JSON은 성공으로 취급되어 흐름에서 예외가 나 재시도 없이 직원 호출로 갔다.
- 검사 기준은 `FrontendInput.json`·`TurnFailureSignal.json`(열거값은 `check-schema`가 대조)이다. 스키마 파일을 복사하지 않고 손으로 쓴 검사라, 서버가 새 열거값을 추가하면 이 검사가 거부해 직원 호출이 될 수 있다(의도한 보수적 동작).
- 직원 콘솔 쪽 목록·세션 기록 응답은 이 검사를 하지 않는다("읽을 때는 관대하게").
- A3: 키오스크는 정적 파일이 한 번 로드되면 JS를 메모리에 두고 `/v1`만 호출하므로, 정적 화면 서버가 죽어도 진행 중인 세션은 이어진다. 브라우저 시험(정적 경로만 503으로 만든 상태에서 한 턴과 종료)으로 확인했다. 이 시험 구조에서는 정적 서버와 모의 API가 한 프로세스라 컨테이너를 따로 멈추지 못해 정적 경로만 503으로 바꾸는 방식으로 모의했다. 실제 gateway·Caddy가 정적 서버 중단 때 어떻게 응답하는지는 확인하지 못했다. 최초 로드나 새로고침이 정적 서버 장애 중이면 브라우저 기본 오류 화면이 뜬다(키오스크 서비스 워커·오프라인 캐시는 없다. 환자 화면에 낡은 코드를 남길 위험이 있어 만들지 않았다). 보완은 deploy의 gateway 몫이다(CR-004 4항).

### 직원 호출 화면의 '처음으로' (3차 점검 K-a, K-b)
- 일반 CALL_STAFF: 종료 요청(`SESSION_END`)을 먼저 보낸다. 실패하면 한 번 더 보내고, 그래도 실패하면 환자를 화면에 가두지 않고 IDLE로 간다. 남은 세션은 서버 유휴 만료가 정리한다(런북).
- DELIVERY_FAILED(직원 알림이 닿지 않음): 서버 세션이 "알림이 안 닿았다"는 유일한 흔적이므로 끝내지 않는다. '처음으로'는 첫 누름에서 "직원에게 직접 알리셨나요?"를 묻고 '직접 알렸어요, 처음으로'/'취소'를 보인다. 선택 이유: 키오스크가 서버에 실패 사실을 남기려면 계약 변경(변경 요청)이 필요하고, 확인 단계 + 세션 보존은 계약 변경 없이 되는 최소 구현이다. 측정·현장 시험은 하지 않았다. 알림을 다시 보내는 API는 계약 2.1.0에서 생겼다: 다시 부르기·직접 통지 보고는 아래 절과 ADR 0014.

### 직원 호출 재알림·정지 사유 (계약 2.1.0, CR-H001·H002, ADR 0014)
- DELIVERY_FAILED의 CALL_STAFF에 '직원 다시 부르기'(`POST .../staff-call/retry`)를 둔다. 버튼은 응답의 `retry_after_s`(또는 429 `Retry-After`) 동안만 비활성이고 값은 서버 설정이다. 성공(DELIVERED)이면 대기 화면, 상한(429 RETRY_LIMIT)·열린 알림 없음(409)이면 버튼이 사라지고 '접수처로 직접 가서 직원에게 알려 주세요'만 남는다. 어느 경우에도 화면은 끝나지 않고 환자가 세션을 끝내지 못한다.
- '직접 알렸어요'/'취소'는 `.../staff-call/report`로 STAFF_NOTIFIED_MANUALLY/NOT_NOTIFIED를 남긴다(실패해도 환자를 가두지 않음). 새 경로가 404/405면 기능 감지로 기존 동작.
- 정지 사유는 `/state`의 `pause_reason`으로 읽고 서버 고정 문장을 우선한다. 직원 콘솔은 글자 접두로 구분하고 전달 시도·직접 통지 보고를 보인다. 문구는 provisional(임상 검토 전).

### 음성 인식 언어 팩 설치 시간 초과 (3차 점검 L)
설치가 시간 초과(10초, 임의 값)로 끝나면 allow_remote_stt가 켜진 기기에서도 외부 인식으로 전환하지 않고 글자 입력으로 안내한다(설치가 곧 끝날 수 있어 환자 음성을 외부로 보내는 결정을 시간 초과에 맡기지 않는다). 대기 화면(IDLE)에 돌아올 때마다 `recheck()`로 다시 확인한다. 시간 초과가 아닌 설치 실패는 설정대로 외부 인식을 쓰며 화면에 고지 문구가 보인다.

### 유휴 초기화 (상태 x 타이머, 재점검 K-1)
직원 개입을 기다리는 화면(CALL_STAFF, WAITING_STAFF)에는 유휴 초기화를 걸지 않는 것이 **설계 의도**다(3차 점검 지적에 대한 답): `reset()`은 서버 세션을 끝내지 않으므로 PAUSED_RISK가 남은 채 다음 사람이 시작할 수 있다. 벗어나는 길은 직원의 재개/종료 또는 환자의 명시적 동작뿐이다. 시험 `test/audit.test.ts`가 표를 고정한다(가짜 시계).
| 상태 | 유휴 타이머 | 60초 뒤 | 종료 요청 |
|---|---|---|---|
| IDLE, STARTING, SENDING, ENDING | 없음 | 변화 없음 | 0 |
| LISTENING, REPEAT_PROMPT | 있음 | 종료 요청 성공이면 IDLE, 실패면 ENDED(종료 실패 안내) 유지 | 1 |
| WAITING_STAFF(위험 정지) | 없음 | 변화 없음 | 0 |
| CALL_STAFF(전달 실패·직원 부르기·다시 말하기 상한 등 모든 사유) | 없음 | 변화 없음 | 0 |
| ENDED(성공) | 없음(화면 쪽 8초 표시 뒤 처음으로) | - | - |
| ENDED(종료 실패 안내) | 없음, "처음으로" 버튼 | 변화 없음 | - |

### 직원 콘솔 연결 상태 (FAULT_POLICY 원칙 7·12)
- 머리줄 `#conn`: "실시간 연결됨" / "연결 중" / "연결 끊김 - 다시 연결 중 (N초 뒤). 새 알림이 바로 보이지 않을 수 있습니다."(끊김은 붉은 배경, `role=alert`).
- 목록 읽기에 실패하면 `#list-status`가 "알림 목록을 불러오지 못했습니다. 비어 있는 것이 아닙니다"(처음부터 실패) 또는 "새로 읽지 못했습니다. 화면이 최신이 아닐 수 있습니다"를 보인다. 목록 요청 자체는 키오스크와 같은 재시도 정책(`api/retry.ts`, 502·503·504·429 등, 예산 20초)을 따른다.
- 이 안내 문구는 임상 문구가 아닌 임시 UI 문구다.
- 하트비트(PUBLIC_API.md 43행, D87): EventSource는 `: ping` 주석 줄을 보여 주지 않으므로 서버가 보내는 이름 있는 이벤트 `heartbeat`(연결 직후 한 번, 약 15초마다, `id` 없음)를 쓴다. 한 연결에서 첫 `heartbeat`를 받으면 무음 감시를 켜고, 주기의 2배(30초) + 지터 0~5초 안에 다음 `heartbeat`가 없으면 조용히 죽은 연결로 보고 직접 닫아 `#conn`을 "연결 끊김"으로 바꾸며 재연결 백오프 경로로 간다(`api/retry.ts` `STAFF_HEARTBEAT`, 값은 정한 것이고 실측하지 않았다). 새 연결은 첫 `heartbeat`를 받을 때까지 감시하지 않는다. 그래서 `heartbeat`를 보내지 않는 구버전 서버에서는 감시가 켜지지 않고 15초 주기 목록 재읽기가 유일한 안전망으로 남는다.
- `resync`(`{"reason": "EVENTS_NOT_RESUMABLE"}`): 받으면 알림 목록을 즉시 다시 읽는다(OPEN·RESOLVED 둘 다 읽는 기존 `load()`를 그대로 쓴다. OPEN만 읽는 최적화는 하지 않았다). 모르는 이벤트 이름은 무시한다.
- 서버 쪽 구현(survey-service)은 읽지 않았고, 계약 문구와 모의 서버 기준으로 만들었다. 실제 서버와의 E2E는 없다.

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
| SSE 끊김 복구(FAULT_POLICY 원칙 7·12) | 재연결은 EventSource 자동 재연결에 맡기지 않고 `api/staff.ts` `stream()`이 한다(HTTP 오류를 받으면 브라우저는 재연결 없이 CLOSED로 끝내고, 간격에 지터가 없기 때문). 지수 백오프 1초 x2, 상한 15초, 지터 50~100%, 예산 없음(`api/retry.ts` `STAFF_STREAM_RETRY`). 새 EventSource는 `Last-Event-ID`를 보내지 않으므로 붙을 때마다 `apps/staff/sync.ts`가 알림 목록을 다시 읽어 놓친 알림을 보충한다(커서 따라 최대 20쪽). 목록도 15초마다 다시 읽는다(스트림이 소리 없이 죽은 경우의 안전망 겸 목록 읽기 실패 복구) |
| 푸시 구독 등록(멱등)·해지. 구독 실패는 알림 배너와 분리된 `#push-status`에 "실시간 알림은 그대로 동작합니다"와 함께 표시 | `api/staff.ts`, `apps/staff/push.ts`, `apps/staff/main.ts`, `sw.js` |
| 모르는 `kind`·열거값은 그대로 표시, 죽지 않음 | `api/types.ts` 관대한 읽기 |
| 기기 토큰 헤더는 `/sessions*`에만, 직원 경로에는 붙이지 않음 | `api/client.ts`(`deviceToken` 옵션), `test/d85.test.ts` |

## 5. 모의 서버 시나리오 (`mock-server/`)
계약의 모든 호출(세션·턴·종료·healthz/readyz·알림 목록·SSE·푸시 구독 등록/해지·개입)을 구현하고 `FrontendInput`을 스키마로 검증하는 시험을 둔다.
시나리오는 제어 경로 `POST /__mock/scenario`(계약 밖, 모의 전용)나 환경 변수로 고른다.
- `normal`: 문진 흐름 몇 턴 후 안내.
- `risk_resume`(위험 정지 4초 뒤 직원이 재개한 것처럼 처리), `rate_limited`(429+Retry-After), `turn_in_progress`(409 CONFLICT + details.reason + Retry-After), 알림 스트림 연결 거절(`streamErrorStatus`·`streamErrorTimes`)과 제어 경로 `POST /__mock/drop-sse`(스트림 연결만 끊기), 스트림 하트비트(기본 켬, 연결 직후와 ping 주기마다. `POST /__mock/heartbeat {on}`으로 연결을 둔 채 끄기, 시나리오 값 `heartbeat: false`는 구버전 서버), `resyncOnConnect`, `POST /__mock/stream {mute, resync}`(스트림 발행 막기와 resync 보내기)
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
apps/staff/     직원 콘솔(main.ts, sync.ts, decide.ts, push.ts, sw.ts)
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
