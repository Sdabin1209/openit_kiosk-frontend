# CR-007: head/scripts/structure-check.py가 ui/를 인정하지 않는다

- 대상: 헤드(`head/scripts/structure-check.py`, DESIGN.md 6절 6번).
- 현상: DESIGN.md 3절은 "TypeScript 화면 리포는 화면 부품을 `ui/`에 두고 `components/`는 이 문서의 뜻으로만 쓴다"고 하는데, 검사기의 6번 규칙은 코드 파일이 `components/`, `wiring/`, `types/` 또는 진입점 중 하나에 속해야 한다고만 본다. 그래서 `src/ui/*.ts` 3개 파일(`kiosk_screen.ts`, `chat_view.ts`, `record_view.ts`)이 "어디에도 속하지 않음"으로 걸린다. 이 영역의 나머지 검사(1~5번)는 통과한다(확인한 것: 검사기를 이 영역 작업 트리로 돌려 3건만 나왔다).
- 요청: 검사기의 6번 규칙이 `ui/`도 허용하게 해 주세요(`/(components|wiring|types|ui)/`). 이 영역은 `ui/`를 두는 것이 지시에 맞다고 보고 옮기지 않았다. 이 영역의 `test/test_structure.test.ts`는 `ui/`를 허용하는 같은 기준을 이미 강제한다.
