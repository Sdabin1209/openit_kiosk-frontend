# 시험 안의 실제 시간 (U422)

원칙: 시험은 실제 시간을 기다리거나 재서 판정하지 않는다. 우리 코드의 시간(요청 응답 대기, 재시도 간격·예산, 유휴 정리, 폴링, 설치 상한)은 시계를 인자로 받고(ADR 0034), 시험은 가짜 시계를 넣고 직접 흘린다(`test/helpers.ts` `fakeTimers`). 판정은 결과(오류 종류·상태·재시도 여부)다.
처리 열: 지움 / 1 = 우리 코드의 시간(시계 주입) / 2 = 라이브러리·바깥의 시간(넘긴 값 확인 + 가짜가 즉시 시간 초과) / 3 = 속도 측정(시간 단언 지움) / 매달림 감시 / 사건 = 시간 대신 사건(Event·조건 대기)으로 바꿈.

| 시험 | 목적 | 처리 | 바뀐 시험 이름 |
|---|---|---|---|
| client.test 무응답이면 같은 turn_id로 재시도하고 이후 성공한다 | 시간 초과를 재시도로 처리하고 같은 turn_id를 쓴다 | 2(가짜 의존이 즉시 AbortError) | 같은 이름(`timesOut()`) |
| client.test 3회 실패하면 CallStaffError | 재시도를 다 쓰면 직원 호출 | 2 | 같은 이름 |
| client.test 한 세션의 요청은 하나씩 순서대로 | 직렬 큐 | 사건(첫 요청을 Event로 붙잡고 뒤 요청이 나가지 않음을 확인) | 같은 이름 |
| client.test (새) 응답 대기 타이머는 REQUEST_TIMEOUT_MS에 발동하고 그 전에는 끊지 않는다 | 우리가 정한 응답 대기 값(12초) | 1(가짜 타이머를 주입, 시간을 흘림) | 새로 씀 |
| retry.test 무응답(타임아웃)도 예산에 들어가고 소진하면 직원 호출 | 시간 초과가 재시도 예산에 들어간다 | 2 | 같은 이름 |
| retry.test 그 밖(백오프 값, Retry-After, 예산) | 재시도 간격·예산 | 이미 1(`now`·`sleep` 주입, 실제 대기 없음) | 변경 없음 |
| flow.test 재시도 3회 실패하면 직원 호출 화면 | 재시도 소진 -> CALL_STAFF | 2 | 같은 이름 |
| staffcall.test 응답을 못 받은 재전송은 같은 turn_id | 시간 초과 뒤 재알림 처리 | 2 | 같은 이름 |
| staffcall.test L-1 report 진행 중 더블 클릭 | 중복 report 방지 | 사건(report 응답을 Event로 붙잡음) | 같은 이름 |
| kf09 / transport-limits / survey-complete / client / retry 의 `timeoutMs` 숫자 | 시험 주제가 아닌 응답 시한이 결과에 끼던 것 | 시한 값을 시험에서 지움(기본 값, 실제 타이머는 발동하지 않음) | 해당 시험 모두 |
| stt.test L: install()이 끝나지 않으면 상한 뒤 지원 안 함 | 설치 상한 처리 | 1(가짜 타이머를 흘림) | 같은 이름 |
| stt.test L(3차 점검) 설치 시간 초과 때 allowRemote | 외부 인식 자동 전환 금지 | 1 | 같은 이름 |
| stt.test (새) 설치 상한 기본값은 config.ts 10초 | 우리가 정한 값 | 1 | 새로 씀 |
| mock.test risk_resume: 폴링으로 재개를 알고 이어간다 | 폴링이 재개를 알아챔 | 사건(직원 RESUME 결정이 재개를 일으킴, 폴링 간격은 한 바퀴 양보) | 직원이 RESUME하면 키오스크가 폴링으로 재개를 알고 이어간다 |
| mock.test 지연 시나리오 elapsed >= 35 | 모의 서버(시연용 대역)의 지연 기능 | 지움(요구사항 아님, 대역의 기능) | error 시나리오: 503 두 번 뒤 성공 |
| mock.test SSE ': ping' 간격 | 모의 서버의 주기 ping | 지움(대역의 기능, 제품 요구사항 아님) | 없음 |
| mock.test SSE heartbeat 3회 | 모의 서버의 주기 heartbeat | 3(주기 단언을 지우고 연결 직후 heartbeat·resync만 확인) | SSE: 연결 직후 id 없는 heartbeat, … |
| setup-env.test 이미 준비돼 있으면 건너뜀 | 멱등 | 시계를 읽지 않는 고정 과거 mtime | 같은 이름 |
| sync.test (스트림·하트비트·재연결 전부) | 직원 스트림 복구 | 이미 1(시험이 쥔 가짜 setTimeout 큐) | 변경 없음 |
| idle-warning / audit (유휴 정리) | 유휴 경고·만료 | 이미 1(`timers` 주입) | 변경 없음 |
| helpers.waitFor | 시험이 자기 가짜에게서 신호를 기다림 | 매달림 감시(`HANG_GUARD_SECONDS`) | 상수 통일 |
| test-image 느린 클라이언트가 다른 요청을 막지 않는다 | Caddy 동작 | 지움 -> 2: Caddyfile에 `read_header 10s`, `idle 60s`를 넘겼다 | 느린 클라이언트 방어: Caddy 서버 timeout 값을 설정에 넘겼다 |
| test-image SIGTERM에 5초 안에 정상 종료 | Docker·Caddy 신호 처리 | 지움 -> 2: CMD가 exec 형식, `grace_period 10s` | 종료 신호 설정: CMD는 exec 형식이고 grace_period는 10s다 |
| test-image 기동 대기, 로그 줄 대기, 소켓 마감 | 컨테이너 기동·로그 | 사건 대기 + 매달림 감시(`HANG_GUARD_SECONDS`) | 로그 sleep 500 제거(마커 줄이 나올 때까지 조건 대기) |
| test-e2e 재시도 예산 소진(503), 다시 부르기 카운트다운, 정지 사유 폴링, 직원 스트림 재연결·하트비트 무음 감지(30초+지터), 목록 15초 재읽기, 키오스크 재개 폴링 | 제품 시간(24초·30초·15초·2초)을 실제로 기다리던 것 | 1(Playwright 표준 `page.clock`: `install` 후 `runFor`로 흘리는 `runUntil`) | 같은 이름(전체 34개, 실행 약 4분 -> 약 42초) |
| test-e2e "X초 뒤에도 없음" sleep 3곳(2500ms 정지 사유 불변, 1500ms 하트비트 도착, 1000ms 알림 부재) | 부재 확인 | 가짜 시계를 `runFor`로 흘린 뒤 없음을 확인(실제로 기다리지 않음) | 같은 이름 |
| test-e2e 모의 서버 지연(delay) 시나리오의 마지막 대기 | 대역의 실제 지연 | 지움(지연 중 대기 화면까지만 확인) | 같은 이름 |
| test-e2e 브라우저 안 가짜 STT 5~10ms 지연 | 비동기 모사 | `queueMicrotask`로 바꿈(시간 없음) | 같은 이름 |
| test-e2e 화면 대기 마감과 `runUntil`의 Date.now | 매달림 감시 | 매달림 감시(`HANG_GUARD_SECONDS`) | 상수 통일 |

## E2E (브라우저 시험)
`npm run test:e2e`(Docker, Playwright 1.55.1 이미지)로 34개를 돌려 확인했다: 34/34 통과(`~/openit-logs/kf422-e2e2.log`). 이 영역의 test-e2e는 영역 시험이고 deploy 전체 E2E(`scripts/e2e.sh`)가 아니다. 이 기계에서 브라우저는 컨테이너 안에서 정상 실행된다. 한 번은 하트비트 시험이 실패했다(가짜 시계를 5초씩 흘리자 재연결이 한 걸음에 끝나 '끊김' 표시를 놓침): 걸음을 250ms로 줄여 해결했고 이는 시험 쪽 문제였다.
`test-e2e/Dockerfile`은 U400 구조 개편 이후 옛 경로(`api`, `apps`)를 복사해 빌드가 실패하는 상태였다(U400 때 돌리지 않아 놓침): `src`와 `test/helpers.ts`를 복사하도록 고쳤다.

## 정적 확인
`test/timing.test.ts`가 `test/*.test.ts`에서 `Date.now`, `performance.now`, `hrtime`, `setInterval`, `new Date`, `mock.timers`와 숫자 `timeoutMs`가 허용 목록(가짜 시계 정의 `helpers.ts`, 가짜 타이머 큐 `sync.test.ts`, 고정 과거 `setup-env.test.ts`) 밖에 없음을 확인한다. 컴포넌트가 시간을 직접 읽는 곳 0도 같은 파일의 두 번째 시험이 확인한다.
