# ADR 0011: 브라우저 시험은 컨테이너 안 Playwright Chromium과 모의 서버

## 상태
채택됨 (2026-10-28 작성. 기존 결정은 코드·docs·git log에서 근거를 찾아 적었고, 근거를 못 찾은 곳은 '근거 기록 없음'이라 표시했다)

## 맥락
키오스크·직원 콘솔의 화면 흐름, 서비스 워커, CSP, 모의 서버 시나리오를 실제 브라우저에서 확인해야 한다. 개발 PC마다 환경이 다르다.

## 결정
Playwright 공식 이미지(`mcr.microsoft.com/playwright:v1.55.1-noble`, `package.json`의 playwright 버전과 같아야 함) 안에서 빌드·모의 서버(빈 포트)·헤드리스 Chromium을 돌린다(`npm run test:e2e`). 가짜 `SpeechRecognition`은 `addInitScript`로 주입한다. 단위 시험은 `node:test` + 가짜 fetch·가짜 시계.

## 왜 (따른 표준과 근거)
- 따른 기준: 컨테이너는 개발 환경이 아니라 확인 산출물(워크스페이스 D22), 두 번째 환경 검증(통과를 한 환경에서만 보지 않는다), 고정 포트 금지.
- 확인한 것: 이 PC에서 우회 없이 통과(`docs/STATUS.md`). 확인하지 못한 것: 실제 gateway·survey, 실제 마이크·STT·푸시, 단말 글꼴, 정적 서버를 컨테이너 단위로 멈추는 시험(정적 경로만 503으로 모의).
- 모의 서버의 한계: 실제 서버 동작을 가릴 수 있다(감사 H1/P10).

## 검토한 대안과 버리는 이유
- 호스트 Playwright 직접 실행: 환경 의존이 크다. `test:e2e:host`는 doctor 점검과 함께 보조로만 둔다.
- jsdom만: 서비스 워커·CSP·마이크 어댑터를 못 본다. jsdom 시험은 `test:dom`에서 컨테이너로 돌린다.

## 결과
E2E는 Docker와 이미지 pull이 필요하고 느리다(약 1분 이상). 간헐 실패를 막으려 실제 타이머 의존을 가짜 시계·조건 대기로 바꿨다(커밋 8688bdf).

## 되돌리는 조건
실제 gateway·survey를 포함한 E2E가 deploy에 생기면 그 결과(`deploy/docs/E2E_RESULTS.md`)를 우선한다.
