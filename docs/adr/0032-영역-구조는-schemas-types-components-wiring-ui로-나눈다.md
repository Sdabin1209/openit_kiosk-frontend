# 0032. 영역 구조는 schemas / types / components / wiring / ui로 나눈다

- 상태: 채택 (2026-10-30, 헤드 지시서 U400, DESIGN.md D117)
- 맥락: 이전 구조는 `api/`(클라이언트+타입+검증)와 `apps/`(상태 기계+화면 섞임)였다. 컴포넌트가 서로를 import하고(`flow.ts` -> `api/*`, `stt.ts`, `chat.ts`), HTTP·재시도·상태 코드 해석이 흩어지고, 거부 조건이 손 검사로 여러 곳에 있었다.
- 결정: `schemas/`(내부 타입 JSON Schema), `src/types/`(생성), `src/components/`(컴포넌트마다 파일 하나, 통신은 `link_*`), `src/wiring/`(연결·주입), `src/ui/`(화면 부품), `src/config.ts`·진입점. 컴포넌트는 서로를 import하지 않고 필요한 기능을 wiring이 함수 모양으로 주입한다. 입력 검사는 스키마 검증기 하나다.
- 왜: 구조 규칙 6개(D104)와 DESIGN.md. functional core / imperative shell(Gary Bernhardt), 포트·어댑터(Cockburn). TypeScript 화면 리포는 DESIGN.md 3절에 따라 화면 부품을 `ui/`에 둔다.
- 검토한 대안: (1) 상태 기계를 작은 순수 함수 여럿으로 쪼갬 -> 상태·타이머·진행 중 요청이 한 덩어리로 묶여 있어 쪼개면 컴포넌트 사이 상태 공유가 생기므로 하나의 컴포넌트(`kiosk_flow`)로 두고 바깥 자원(공개 API, 턴 ID, 재시도 분류)만 주입한다. (2) 응답 본문 검증을 계약 스키마 그대로 사용 -> 계약은 모르는 키를 거부하는데 읽는 쪽은 관대해야 하므로(ADR 0005) 읽는 쪽 수용 스키마(`*Body`)를 따로 둔다. (3) 오류 클래스를 공유 모듈로 -> 컴포넌트끼리 import 금지이므로 오류의 데이터 모양(`ApiFailure`)을 스키마로 두고 업무 컴포넌트는 `name`·필드만 읽는다.
- 결과: 얻는 것 — 경계가 시험으로 강제된다(`test/test_structure.test.ts`), 상태 코드 해석(401·403, `BoundaryError`)이 링크 한 곳. 감수하는 것 — 코드 이동으로 이력이 끊겨 보인다(`git mv`로 최대한 보존), 작은 포트 인터페이스 선언이 컴포넌트마다 생긴다. 동작(와이어 형식)은 바꾸지 않았다(기존 단위 시험이 통과한 것으로 확인).
- 되돌리는 조건: DESIGN.md가 바뀌면 따른다. 헤드 검사기의 `ui/` 미인정은 `docs/change-requests/CR-007-structure-check-ui-dir.md`.
