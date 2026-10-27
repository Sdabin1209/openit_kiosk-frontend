# ADR 0003: 직원 알림은 SSE(EventSource), 재연결·heartbeat는 직접 처리

## 상태
채택됨 (2026-10-28 작성. 기존 결정은 코드·docs·git log에서 근거를 찾아 적었고, 근거를 못 찾은 곳은 '근거 기록 없음'이라 표시했다)

## 맥락
직원 콘솔은 서버가 알림을 밀어 주는 단방향 스트림이 필요하다. 공개 API 계약(PUBLIC_API.md)이 `GET /v1/staff/alerts/stream`(text/event-stream)으로 정했다. 감사/FAULT_MATRIX A10은 재시작·5xx 때 동작 미정의를 지적했다.

## 결정
브라우저 `EventSource`를 쓰되 재연결은 직접 한다(`api/staff.ts stream()`): 오류가 나면 닫고 지수 백오프(1초 x2, 상한 15초, 지터 50~100%, 예산 없음)로 새로 연다. 붙을 때마다 목록 API로 보충한다(`apps/staff/sync.ts`). `event: heartbeat`(D87)를 처음 받은 연결부터 30초 + 지터 0~5초 무음이면 닫고 재연결, `resync`를 받으면 목록을 다시 읽는다.

## 왜 (따른 표준과 근거)
- 왜 SSE인가(WebSocket이 아닌 이유): 계약이 SSE로 정했고(우리가 고른 것이 아님), 방향이 서버->브라우저 한 방향이며, gateway가 이미 SSE용 설정(버퍼링 끄기, read_timeout 1h)을 갖는다(FAULT_MATRIX A10). WebSocket은 양방향·프레임 프로토콜이 필요 없고 계약 변경이 든다.
- 왜 직접 재연결인가(확인한 것은 브라우저 사양 지식, Chromium 실측은 하지 않음): EventSource는 HTTP 오류 응답을 받으면 재연결하지 않고 CLOSED로 끝낸다. 간격에도 백오프·지터가 없다. 그래서 FAULT_POLICY 원칙 7·12(복구되면 사람 개입 없이 정상화)를 맞추려면 직접 다시 열어야 한다.
- 값의 출처: 백오프 1초/2배/15초는 **임의로 정한 값(측정 안 함, 표준 지수 백오프 관행)**, 지터 하한 50%는 일반 관행. heartbeat 30초 = 계약의 약 15초 주기 x 2(한 번 놓침을 허용), 지터 5초는 임의. 모두 `api/retry.ts`에 있다.
- 한계: 새 EventSource는 `Last-Event-ID`를 보내지 못하므로 목록 보충에 의존한다. `: ping` 주석 줄은 EventSource가 보여 주지 않아 서버가 이름 있는 heartbeat를 추가했다(CR-004, D87).

## 검토한 대안과 버리는 이유
- WebSocket: 위 이유. 계약 변경 필요.
- 주기 폴링만: 지연이 폴링 간격만큼 늘고 푸시 알림성 요구에 맞지 않는다. 다만 15초 목록 재읽기를 안전망으로 함께 둔다.
- fetch 스트리밍으로 SSE 직접 구현: 주석 줄과 `Last-Event-ID`를 직접 다룰 수 있으나 파서 코드가 늘어난다. heartbeat 이벤트 추가로 불필요해졌다.

## 결과
서버가 heartbeat를 보내지 않는 구버전이면 무음 감시가 꺼지고 15초 목록 재읽기만 안전망이다. 연결 상태가 머리줄에 항상 보인다.

## 되돌리는 조건
EventSource가 HTTP 오류 재연결·Last-Event-ID를 지원하게 되거나 계약이 WebSocket으로 바뀔 때. heartbeat 값은 H1 실측 뒤 재정.
