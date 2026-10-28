# 표준성·근거 전수 점검 보고서: kiosk-frontend (2026-10-29)

기준서: `../head/docs/audit/standards-audit-spec.md` (D89). 점검 대상 리포 HEAD: `98a43ac`(작업 트리 변경 없음, `git status` 깨끗). 코드·설정·시험은 고치지 않았다(이 파일만 추가).
읽은 것: `CLAUDE.md`, `README.md`, `docs/brief.md`, `docs/design.md`, `docs/boundary.md`, `docs/adr/0001~0015`, `api/*.ts`, `apps/kiosk/{stt,clinical,main,index.html,kiosk.css}`, `apps/kiosk/flow.ts`(상태 기계 표·유휴·폴링 부분, 전체는 아님), `apps/staff/{sw,push,sync,index.html,staff.css}`, `server/static.mjs`, `Dockerfile`, `scripts/build.mjs`, `package.json`, `.dockerignore`, `.gitignore`. 이웃(읽기 전용): `../boundary-contracts/PUBLIC_API.md` 일부(원칙, 27행, 57행, A절, F절).
표준 이름은 이 세션에서 원문을 열어 확인하지 않았고 기억에 의존했다. 기억에 의존하며 확신이 덜한 것은 `(기억)`으로 표시했다. 실행한 것: `dist/` 파일 크기 확인, 대비비 계산(python). 시험·빌드·Docker는 실행하지 않았다.

분류: S 표준+근거 / S- 표준이나 근거 기록 없음 / N 비표준이나 근거 있음 / N- 비표준+근거 없음 / O 재발명 / ? 표준 여부 확인 못 함.
"근거 있음"은 ADR·D번호·코드 주석 중 어디에든 이유가 적힌 경우다. 값이 "임의(측정 안 함)"라고 스스로 적은 것은 근거 없음으로 본다(기준서 6항: 측정·표준·제약 중 무엇에서 나왔는지 구분).

## 1. 결과표

### 1.1 빌드·구조 선택

| # | 요소(선택 인용) | 분류 | 표준 | 근거 위치 | 증거 |
|---|---|---|---|---|---|
| 1 | 프레임워크 없는 TypeScript + DOM. "프레임워크(React 등) 없이 TypeScript + DOM" | N | 해당 표준 없음 | ADR 0001. 단 ADR이 "프레임워크·Vite를 직접 비교한 기록은 없다"고 적음. 근거 수치 "kiosk.js 약 12KB, staff.js 약 14KB"는 지금 사실과 다름: 실제 `dist/kiosk.js` 32,165B, `dist/staff/staff.js` 23,243B(2026-10-29 확인) | `docs/adr/0001-*.md` 결정·왜 절, `dist/` 크기 |
| 2 | esbuild 옵션 `bundle, minify, target es2022, format iife`, 소스맵 없음 | N- | 없음 | 도구 선택은 ADR 0001. **target es2022(대상 브라우저)와 소스맵 없음의 이유는 어디에도 없음** | `scripts/build.mjs:6` |
| 3 | 시험 러너 `node:test` + Node 24 타입 제거로 .ts 직접 실행 | N | 없음 | ADR 0001 한 줄("Node 24 타입 제거 지원"). 대안(vitest 등) 비교 없음. 타입 제거 기능의 안정성 등급은 확인 못 함 | `package.json` scripts.test, `docs/adr/0001-*.md` |
| 4 | 키오스크와 직원 콘솔을 한 리포·한 이미지·한 정적 서버에 둠 | N | 없음 | ADR 0002(대안 "리포 둘로 분리" 기각, 비교 기록 없음 명시). 한계(키오스크 단말에서 `/staff/` 열림)를 ADR이 적음 | `docs/adr/0002-*.md` |
| 5 | 키오스크 상태 기계: 손으로 쓴 상태 열거 + 클래스 `KioskFlow`(IDLE~ENDED 9개 상태) | N- | 상태 기계/Statecharts(Harel), SCXML, XState 같은 라이브러리가 있음. 이 영역은 어느 것도 비교하지 않음 | 상태 표는 `design.md` 3절에 있으나 **이 모양(상태 분해, 사유를 상태가 아닌 필드로 두는 점)을 고른 이유와 대안 비교는 없음**. ADR 0001이 "상태 기계 하나라 필요성이 작다"고 프레임워크만 언급 | `docs/design.md` 3절, `apps/kiosk/flow.ts:67-125` |
| 6 | 세션별 직렬 큐(프라미스 체인) | N | 없음 | 요구는 계약 규칙("한 세션의 요청은 순서대로 하나씩", design.md 4절). 구현 방식(대안 비교)은 기록 없음 | `api/client.ts:126-134` |
| 7 | 응답 검증을 손으로 씀(`validateFrontendInput` 등) | N | JSON Schema(표준)를 쓰지 않음 | ADR 0005(런타임 의존 0, 검사할 모양 2개, 대안 ajv·코드 생성 비교). 어긋남 위험도 ADR이 적음. 이웃 자원 활용: ajv는 devDependency로만 존재 | `api/validate.ts:13-27`, `docs/adr/0005-*.md` |
| 8 | 대화 목록 `ChatLog` 컴포넌트(이벤트 입력, 뷰 모델 출력) | N | 없음(워크스페이스 구조 규칙 R2~R5) | ADR 0015, 대안 3개 비교 | `docs/adr/0015-*.md` |
| 9 | 모의 서버 `mock-server/`를 손으로 씀(의존 없음, 328줄) | N | 없음 | 브리프 2절·4절이 요구, ADR 0011이 용도 설명. 직접 작성 vs 기존 모의 도구 비교 기록은 없음. 이미지에 들어가지 않음(Dockerfile이 `dist`와 `server/static.mjs`만 복사) | `docs/brief.md` 2절, `Dockerfile:25-26`, `mock-server/app.ts` |

### 1.2 자격(기기 토큰)·저장

| # | 요소 | 분류 | 표준 | 근거 위치 | 증거 |
|---|---|---|---|---|---|
| 10 | 기기 토큰을 `Authorization: Bearer`로 `/sessions*` 요청에만 붙임. "if (token) headers.authorization = `Bearer ${token}`" | S | RFC 6750 §2.1(Authorization 요청 헤더로 Bearer 토큰 전달) | ADR 0006, PUBLIC_API.md F절. 직원 경로에 안 붙이는 규칙도 코드에 있음 | `api/client.ts:183-184`, `../boundary-contracts/PUBLIC_API.md` F절 |
| 11 | 토큰 전달 방식 1: 시작 URL 조각 `#device=`, 읽자마자 `history.replaceState`로 지움 | N | URL 조각은 요청으로 서버에 전송되지 않음(RFC 3986 §3.5). 그러나 **토큰을 조각으로 넘기는 것은 OAuth 암시적 허가(implicit grant)와 같은 모양이고 OAuth 보안 모범 사례(RFC 9700)가 이를 권하지 않음(기억)**. 조각 전달을 인증 절차로 규정한 표준은 확인 못 함 | ADR 0006: 쿼리 문자열은 서버 로그에 남아 쓰지 않음, 조각은 "시연용"(런북). 대안(쿼리, localStorage) 비교는 있으나 **OAuth BCP·mTLS(RFC 8705)·게이트웨이 주입(브라우저가 토큰을 안 가짐)과의 비교는 없음** | `api/device.ts:41-43`, `docs/adr/0006-*.md` 결정·검토한 대안 |
| 12 | 토큰 전달 방식 2(권장): 정적 서버가 운영이 마운트한 `CONFIG_FILE`을 `/config.json`으로 인증 없이 서빙, 키오스크가 fetch로 읽음 | N | 정적 설정 파일에 장기 비밀을 담아 브라우저에 내려 주는 방식의 이름 있는 표준은 확인 못 함. 비밀을 파일로 받는 것은 워크스페이스 D84 규칙(표준은 아님) | ADR 0006(새로고침에도 유지, 브라우저 저장소 없음). **같은 정적 경로가 기기 밖에서도 읽히는 문제는 "gateway 몫"으로 넘김(ADR 0006 한계, CR-001 미해결·실제 gateway 확인 못 함).** 문서 불일치: README는 D84 해당 없음이라 쓰고 ADR 0006은 D84를 근거로 듦; CR-001 5절은 "이미지에 `/config.json`은 없다"고 아직 적고 3절·코드는 있음 | `server/static.mjs:27-28`, `docs/adr/0006-*.md`, `README.md`(실행 방법), `docs/change-requests/CR-001-*.md` 3·5절 |
| 13 | 토큰 형식 검사 `^[\x21-\x7e]{1,512}$` | N- | RFC 6750 §2.1은 토큰 문자 집합을 b64token(영숫자 + `-._~+/`, 끝 `=`)으로 정함(기억). 이 정규식은 더 넓고 512자 상한은 임의 | 이 값의 이유 기록 없음. 헤더에 넣을 수 있는 ASCII라는 주석만 있음 | `api/device.ts:7` |
| 14 | 토큰 수명·회전·폐기 | N- | OAuth 2.0은 접근 토큰을 짧은 수명으로 다루는 것이 기본 모델(RFC 6749 §1.4, RFC 9700)(기억). 이 영역은 만료 없는 정적 Bearer를 쓴다 | **"토큰 수명·회전·폐기 절차는 이 영역 문서에 없다"고 ADR 0006이 스스로 적음.** 폐기는 gateway의 "파일을 지우면 폐기"(PUBLIC_API.md F절, D88 U8)이며 이 영역 밖. 이 영역이 발급·관리하지는 않으므로 O는 아님 | `docs/adr/0006-*.md` 한계, `../boundary-contracts/PUBLIC_API.md` F절 |
| 15 | 환자 발화·토큰은 메모리에만. localStorage·쿠키·IndexedDB·콘솔 미사용 | S | OWASP HTML5 Security Cheat Sheet의 Web Storage 절: 민감 정보를 localStorage에 두지 말 것(정확한 문구는 확인 못 함, 기억) | ADR 0006(공유 PC·XSS 이유), 브리프 4절. 소스에서 `localStorage|sessionStorage|indexedDB|document.cookie|console.` 검색 결과 `api/`, `apps/`에 없음(검색 확인) | ADR 0006, `api/client.ts:189-190`(`credentials: same-origin`, `cache: no-store`) |
| 16 | `subject_ref`: 조각/설정으로 받고 한 번 쓰면 비움, 형식 `[A-Za-z0-9._:/#=+-]{1,128}` | N | 형식은 계약 A절이 정함(제약). 비우는 규칙은 표준 아님 | 코드 주석(감사 P1: 다음 환자 기록에 붙는 위험). 운영 방식(기기 고정 참조 vs 환자별 URL)은 "사용자 확인 대기"로 미정 | `api/device.ts:6, 66-71`, `../boundary-contracts/PUBLIC_API.md` A절 |
| 17 | 세션 ID·turn_id: `"s-" + 24자리 hex`(CSPRNG 96비트) | S- | `crypto.getRandomValues`(W3C Web Crypto). 길이 96비트의 근거는 없음. UUID(RFC 9562)와 비교 없음. 형식 제약은 계약 | 길이 선택 이유 기록 없음. "개인 식별 정보를 담지 않는다"는 주석만 있음 | `api/ids.ts:7-21` |

### 1.3 재시도·timeout·한도의 값

| # | 요소 | 분류 | 표준 | 근거 위치 | 증거 |
|---|---|---|---|---|---|
| 18 | 요청 timeout 10초(`AbortController`) | N | 값의 표준 없음 | 출처는 **제약(계약 PUBLIC_API.md 57행 "요청 타임아웃은 10초다")**. 계약 쪽 근거는 읽지 못했다. ADR 0004는 "계약의 값"이라 하고 서버 마감 6초·gateway 9.5초와의 대소를 한 곳에서 시험하는 것이 없다고(감사 E8) 적음. 측정 안 함 | `api/client.ts:46`, `docs/adr/0004-*.md` |
| 19 | 재시도 총 예산 20초 | N | 값의 표준 없음 | 출처는 **정책(FAULT_POLICY 원칙 7, 헤드 문서이며 이 세션에서 읽지 못함)**. "임상 흐름에 맞는지는 사용자 결정 대기, 측정 안 함"으로 ADR 0004·`retry.ts:2-4`가 적음. 예산 계산에 `Date.now()`(벽시계)를 씀. 단조 시계(`performance.now()`)와 비교한 기록 없음 | `api/retry.ts:21-28`, `api/client.ts:48,142,159` |
| 20 | 재시도 구조: 지수 백오프 + 지터, 같은 `turn_id` 재전송 | S | 지수 백오프+지터 관행(예: AWS Architecture Blog "Exponential Backoff and Jitter", Google SRE 책 재시도 장, 기억). 멱등 키 개념(IETF `Idempotency-Key` 헤더 초안, RFC 아님, 기억) | ADR 0004(관행 명시, 대안 3개 비교) | `api/retry.ts:57-60`, `docs/adr/0004-*.md` |
| 21 | 백오프 값: 기준 0.5초, 배율 2, 상한 5초, 지터 하한 50% | N- | 표준 값 없음 | **"임의(측정 안 함)"라고 코드·ADR이 스스로 적음.** 0.5초·5초에는 짧은 설명 주석("서비스 재시작은 수 초")이 있으나 비교·측정은 없음 | `api/retry.ts:3, 21-28`, `docs/adr/0004-*.md` |
| 22 | 재시도 대상 429/502/503/504/네트워크/무응답 + 409 `TURN_IN_PROGRESS`, `Retry-After`를 하한으로 따르고 위로만 지터 | S | RFC 9110 §10.2.3(Retry-After), §15.6.4(503). 구현은 정수 초만 읽음: RFC 9110은 HTTP-date 형식도 허용하는데 이 경우 `null`로 보고 일반 백오프로 감(계약은 "초, 정수"라 문제는 아님, 기억) | ADR 0004, 계약 PUBLIC_API.md 오류표 | `api/retry.ts:30-37, 63-67`, `api/client.ts:196-197` |
| 23 | 직원 호출 재알림은 자동 재시도 안 함(`single`) | S | RFC 9110 §10.2.3 | ADR 0014 | `api/client.ts:94`, `docs/adr/0014-*.md` |
| 24 | 위험 정지 상태 폴링 2초 | N | 없음 | 출처는 **제약(계약 PUBLIC_API.md 27행 "2초 간격으로 폴링")**. 계약 쪽 근거는 읽지 못함. 키오스크용 SSE와의 비교는 이 영역에 없음 | `apps/kiosk/flow.ts:87`, `docs/design.md` 3절 |
| 25 | STT 언어 팩 설치 timeout 10초 | N- | 없음 | 코드 주석 "임의(측정 안 함)", design.md "임의 값"이라 적음. 외부 전환을 시간 초과에 맡기지 않는다는 *동작* 이유는 있으나 *10초*의 이유는 없음 | `apps/kiosk/stt.ts:53`, `docs/design.md` 3절 |
| 26 | STT 신뢰도 하한 0.4 | N- | Web Speech의 `confidence` 필드가 있을 뿐 하한 값의 표준은 없음 | ADR 0008·`clinical.ts`가 "근거 기록 없음(임의)" 명시 | `apps/kiosk/clinical.ts:7`, `docs/adr/0008-*.md` |
| 27 | 종료 화면 표시 8초 | N- | 없음 | "근거 기록 없음(임의)" | `apps/kiosk/clinical.ts:10` |
| 28 | 유휴 초기화 60초, 되묻기 상한 3회 | N | 값의 표준 없음 | 출처는 **사용자 결정 D88 U10(잠정)**. "H1 실측 뒤 재정" | `apps/kiosk/clinical.ts:14,17`, `docs/adr/0008-*.md` |
| 29 | 유휴 초기화에 사전 경고·연장 수단 없음(`armIdle`이 60초 뒤 바로 세션 종료 요청) | N- | WCAG 2.2 SC 2.2.1 Timing Adjustable(시간 제한 전 경고와 연장 수단, 예외 있음)(기억). 이 시간 제한이 예외에 해당하는지 판단한 기록이 없음 | ADR 0008·design.md는 "다음 사람에게 남지 않게"라는 프라이버시 이유만 적음. WCAG 대조 기록 없음. 고령 환자 가정(브리프 5절)이라 해당 여부 확인이 필요 | `apps/kiosk/flow.ts:115-125`, `docs/adr/0008-*.md` |
| 30 | 위험 정지 장기 대기 안내 5분, 수동 입력 500자, 대화 말풍선 100개 상한, 직원 목록 20쪽x50건 상한 | N- | 없음 | 모두 "임의(측정 안 함)"로 적음(말풍선 100개는 ADR 0015, 20쪽은 코드 주석 "무한 커서 방지") | `apps/kiosk/clinical.ts:20,23`, `docs/adr/0015-*.md`, `apps/staff/sync.ts:52` |

### 1.4 음성(STT·TTS)

| # | 요소 | 분류 | 표준 | 근거 위치 | 증거 |
|---|---|---|---|---|---|
| 31 | STT를 브라우저 Web Speech API(`ko-KR`)로, `SttAdapter` 뒤에 둠 | N | Web Speech API는 W3C 표준 트랙이 아닌 Community Group 초안이고 브라우저 지원이 일정하지 않음(기억). `SpeechRecognition.available/install/processLocally`도 같은 초안 계열(Chrome 138+ 계열이라고 코드 주석에 적음, 이 PC에서 확인 못 함) | ADR 0007 대안 3개 비교(외부 STT 기본, 자체 STT, 텍스트만). 한국어 정확도·온디바이스 지원은 **확인 못 함**(ADR 0007 명시) | `apps/kiosk/stt.ts:38-79`, `docs/adr/0007-*.md` |
| 32 | 기기 안 인식만 기본, 외부 인식은 설정 `allow_remote_stt`로만, 켜면 환자 고지 문구 | S | privacy by default(개인정보 보호 기본 설정 원칙. GDPR 제25조·한국 개인정보 보호법의 해당 조문은 ADR에 이름이 적혀 있지 않음) | ADR 0007, D88 U3. 실기기 지원 여부는 미확인(U05 열림) | `apps/kiosk/stt.ts:93-103`, `apps/kiosk/clinical.ts:25-29` |
| 33 | STT 오류 코드 -> `SttErrorKind` 매핑 | S- | W3C Web Speech `SpeechRecognitionErrorCode`(`not-allowed`, `no-speech` 등) | 근거 문서 없음(KF-10 커밋·구조 규칙 보고서에서 옴). 코드 주석에 표준 열거 사용 명시 | `apps/kiosk/stt.ts:13-18` |
| 34 | TTS는 기기 안 한국어 음성(`localService`)만 | S | 같은 privacy 원칙 | ADR 0007에 포함 | `apps/kiosk/main.ts:30-32` |

### 1.5 직원 콘솔: SSE, 서비스 워커, 웹 푸시

| # | 요소 | 분류 | 표준 | 근거 위치 | 증거 |
|---|---|---|---|---|---|
| 35 | 직원 알림을 SSE(`EventSource`)로 받고 재연결을 직접 함(오류 시 닫고 새로 엶, 붙을 때마다 목록 보충) | N | SSE는 HTML Living Standard(Server-sent events). 표준 `EventSource`는 HTTP 오류 응답 뒤 재연결하지 않고 닫음(기억). 직접 재연결은 표준 동작이 아니라 보완. fetch 기반 SSE 라이브러리(예: `@microsoft/fetch-event-source`)와는 비교하지 않음 | ADR 0003: WebSocket·폴링·fetch 스트리밍 비교, 한계 명시. 프로토콜 선택은 계약 | `api/staff.ts:44-89`, `docs/adr/0003-*.md` |
| 36 | 재연결 값: 1초 x2, 상한 15초, 지터 50~100%, 예산 없음 | N- | 값의 표준 없음 | "임의(측정 안 함)"로 ADR 0003·`retry.ts`가 적음 | `api/retry.ts:47`, `docs/adr/0003-*.md` |
| 37 | 하트비트 무음 감시: 주기 15초의 2배 + 지터 0~5초 | N | 값의 표준 없음 | 30초는 **계약 주기(약 15초) x 2(한 번 놓침 허용)**로 도출 근거 있음. 지터 5초는 임의. 실측 안 함 | `api/retry.ts:53-54`, `docs/adr/0003-*.md` |
| 38 | 목록 주기 재읽기 15초(안전망) | N- | 없음 | "임의 값" 주석 | `apps/staff/sync.ts:25, 99` |
| 39 | 서비스 워커는 `/staff/`에만, 푸시 핸들러만(fetch 핸들러·캐시 없음), 키오스크에는 없음 | S | W3C Service Workers, Push API, Notifications API | ADR 0009(대안 2개 비교, 낡은 코드 위험). 서비스 워커 갱신 방식(skipWaiting 등) 기록 없음 | `apps/staff/sw.ts:1-13`, `scripts/build.mjs:8`, `docs/adr/0009-*.md` |
| 40 | 푸시 구독: VAPID 공개키를 `push-config`에서 받아 `applicationServerKey`로 구독, `userVisibleOnly: true` | S | RFC 8030(Web Push), RFC 8292(VAPID), W3C Push API(`userVisibleOnly`는 Chrome 요구, 기억). 서버 쪽 전송·암호화(RFC 8291)는 이 영역이 아님 | design.md 7절·계약. 실제 푸시 전달은 **확인 못 함** | `apps/staff/push.ts:26-37` |
| 41 | `b64ToBytes`: base64url -> Uint8Array 직접 변환 | S- | 널리 쓰는 관용구(MDN 예제 계열, 기억). 최신 Push API는 `applicationServerKey`에 문자열(base64url)을 직접 받을 수도 있음(기억). 직접 변환이 필요한지 비교한 기록은 없음 | 근거 기록 없음 | `apps/staff/push.ts:3-9` |
| 42 | 푸시 구독 해지: `DELETE /staff/push-subscriptions?endpoint=<푸시 엔드포인트 URL>`(쿼리 문자열에 실음) | N- | 푸시 엔드포인트 URL은 그 자체가 전송 권한과 닿는 URL(RFC 8030의 push resource, 기억)이라 비밀로 다뤄야 함. 이 영역이 ADR 0006에서 "쿼리 문자열은 서버 로그에 남는다"를 이유로 쿼리를 기각한 것과 일관되지 않음 | **근거 기록 없음.** 모양은 계약(PUBLIC_API.md)에서 온 것으로 보이나 이 세션에서 계약의 해당 줄은 읽지 않음 | `api/staff.ts:30` |
| 43 | 알림 옵션 `renotify: true`, `requireInteraction: true`, `tag=alert_id`; 본문에 세션 ID 노출 | S- | Notifications API 옵션. 본문 내용은 계약("세션 ID와 종류만") | `renotify` 이유는 코드 주석(M-1). `requireInteraction` 이유 기록 없음. 잠금 화면 노출은 ADR 0009가 감사 P17로 언급만 함 | `apps/staff/sw.ts:7-8`, `docs/adr/0009-*.md` |
| 44 | 개입 결정: 확인 후 전송, 알림당 같은 `turn_id` | S- | 멱등 키 패턴(위 20번 참조) | 브리프 4절 수용 기준. 구현 쪽 이유 문서는 없음(`decide.ts`는 세부 미열람) | `docs/brief.md` 4절, `apps/staff/decide.ts`(읽지 않음) |

### 1.6 정적 서버·이미지·보안 헤더

| # | 요소 | 분류 | 표준 | 근거 위치 | 증거 |
|---|---|---|---|---|---|
| 45 | 정적 파일 서버를 Node `http`로 직접 구현(52줄, 의존 없음) | N | nginx·Caddy 등 정적 서빙이 표준 인프라로 존재. 경계 판정: 아래 §2에 따로 적음 | ADR 0010: 의존·설정·공급망 최소화. **"nginx 등을 직접 비교한 기록은 없다"고 ADR이 스스로 적음.** 또 CR-001은 정적 서빙을 deploy gateway가 할 수도 있다고 열어 두었고 결정은 미확인 | `server/static.mjs`, `docs/adr/0010-*.md` |
| 46 | 보안 헤더 `Content-Security-Policy`(default-src 'self', script/style 'self', frame-ancestors 'none' 등), `nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, COOP/CORP | S- | W3C CSP Level 3, OWASP Secure Headers Project 권고(기억). 인라인 스크립트·스타일이 없어 `'unsafe-inline'` 없이 적용됨 | ADR 0010은 헤더 목록만 적고 **지시어별 이유는 없음**(`img-src data:`, CORP 포함 이유 불명). `Permissions-Policy`만 코드 주석(감사 P15). HSTS는 gateway 몫이라고 ADR이 적음 | `server/static.mjs:10-12, 19` |
| 47 | 모든 응답 `Cache-Control: no-store` (JS·CSS 포함) | S- | RFC 9111 `no-store` 지시어. 정적 자산에 쓰는 것이 적절한지 비교한 기록 없음 | ADR 0010이 "캐시 정책이 필요해질 때" 되돌린다고 한 줄. 이유(낡은 코드 방지 등)는 명시되지 않음 | `server/static.mjs:19` |
| 48 | 경로 탈출 방지: 정규화 후 `root + "/"` 접두 검사 | S- | OWASP Path Traversal 방어(정규화 후 기준 디렉터리 접두 확인) | 근거 문서 없음. 읽기만으로 확인한 관찰: `decodeURIComponent`가 잘못된 `%` 시퀀스에서 예외를 내면 바깥 `.catch`가 보안 헤더 없이 500을 냄(실행해 보지 않음) | `server/static.mjs:31-34, 46` |
| 49 | 로그: 표준 출력 JSON 한 줄, `/healthz`·`/readyz` 제외, 쿼리 문자열 제외 | S | 12-factor XI(로그를 이벤트 스트림으로), 워크스페이스 D22 | ADR 0010·`/config.json` 내용은 로그에 안 씀(주석) | `server/static.mjs:23-28, 45` |
| 50 | 설정은 환경 변수(`PORT` 정수 검증, `STATIC_DIR`, `CONFIG_FILE`), 0.0.0.0 바인딩, SIGTERM 정상 종료 | S | 12-factor III·VII | D22, CR-005 7항 | `server/static.mjs:48-51` |
| 51 | `/healthz`(살아 있음), `/readyz`(index.html 존재) | S | 컨테이너 프로브 관행, 워크스페이스 D22. `/readyz`는 `CONFIG_FILE` 존재를 보지 않음(관찰) | ADR 0010 | `server/static.mjs:23-24` |
| 52 | Dockerfile: 다단계, `npm ci --ignore-scripts`, `USER node`, 라벨 `io.openit.*`, `HEALTHCHECK` | S | Docker 모범 사례(비루트, 다단계), `npm ci`는 잠금 파일 그대로 설치, D22·D50 | ADR 0010, 워크스페이스 규칙. `HEALTHCHECK`가 `wget`(busybox)을 씀: 이유 기록 없음, 사소 | `Dockerfile:2,5,17-21,26,28` |
| 53 | 베이스 이미지 `node:24-alpine`(태그만, digest 없음), 빌드 스테이지도 동일 | N- | Docker 모범 사례는 재현성을 위해 digest 고정을 권함(기억). 이 영역은 적용하지 않음 | ADR 0010이 "digest·SBOM·스캔은 없다(감사 P8)"고 **한계로만** 적고 이유·되돌릴 조건은 없음. README 현재 상태도 이미지 스캔 결과 없음 | `Dockerfile:2,8`(`FROM node:24-alpine` 두 곳), `docs/adr/0010-*.md` |
| 54 | 의존 고정: 정확한 버전 + `package-lock.json`, 취약점 최소 상향, `npm audit` 0건 기록 | S | npm 잠금 파일, 워크스페이스 규칙(태그·잠금 고정). 예외: `@types/node`만 `^24.19.2` 범위(잠금으로 고정됨) | ADR 0012(범위·이유 상세) | `package.json` devDependencies, `docs/adr/0012-*.md` |
| 55 | `npm test`의 `pretest`로 빌드, `dist` 없으면 실패 | S | npm `pre<script>` 수명주기 훅 | ADR 0013 | `package.json` scripts.pretest |
| 56 | 브라우저 시험: Playwright 공식 컨테이너 + 모의 서버 | S | 워크스페이스 D22(컨테이너는 확인 산출물) | ADR 0011 | `docs/adr/0011-*.md`, `package.json` |
| 57 | 스키마 대조 스크립트(ajv, 개발 의존)가 `../survey-service/schema`를 읽어 열거값을 비교 | S- | ajv는 JSON Schema 구현으로 표준 도구. 이 스크립트의 설계 이유를 따로 적은 ADR 없음(ADR 0005가 대조 존재만 언급) | 근거 기록 약함. 이 스크립트는 `../` 폴더 의존이라 이 리포 단독 clone에서는 비0 종료(README가 적음) | `scripts/check-schema.mjs`, `README.md` 실행 방법 |

### 1.7 화면: 접근성, 글꼴, 문구

| # | 요소 | 분류 | 표준 | 근거 위치 | 증거 |
|---|---|---|---|---|---|
| 58 | 접근성 전반: `<html lang="ko">`, `aria-live`, `role=status/alert`, 포커스 표시 `outline`, 큰 글자(본문 32px, 버튼 44px+패딩), 대비 | S- | WCAG 2.2(ADR 0014가 SC 2.2.1, 1.4.1, 2.1.1, 4.1.3을 이름으로 인용). 계산한 대비비(내가 python으로 계산): `#8a1c1c`/백 9.28, `#7a5a00`/백 6.38, `#555`/백 7.46, `#0b3d91`/백 10.04, `#444`/`#dbe7ff` 7.83 -> 모두 4.5 이상 | **적합 목표 수준(A/AA)과 키오스크 전체에 대한 점검 기록은 없음.** 브리프 5절은 "접근성(대비, 포커스 순서)을 기본으로 한다" 한 줄. 인용된 WCAG 기준은 ADR 0014(직원 호출 재알림)에만 있음. 대비 숫자 주석은 직원 콘솔 일부에만 있고 키오스크 CSS에는 없음 | `apps/kiosk/index.html:2,10`, `apps/kiosk/kiosk.css:3,8,11`, `apps/staff/staff.css:20-22`, `docs/adr/0014-*.md` 왜 절 |
| 59 | 한국 키오스크·웹 접근성 기준(법정 또는 KS 규격)과의 적합 | ? | 한국에 키오스크 접근성 관련 지침·인증 기준이 있는지, 있다면 무엇인지 **확인하지 못함**. 이름을 지어내지 않음 | 근거 기록 없음 | 해당 없음(조사 못 함) |
| 60 | 글꼴: 시스템 글꼴 스택(`system-ui, "Noto Sans KR", "Malgun Gothic"`), 이미지에 글꼴 파일 없음 | N- | 없음 | design.md 7절이 "[미정: 오프라인 글꼴 파일 포함은 라이선스 결정 후]"로 적음. 반면 브리프 5절은 "오프라인 폰트 포함"을 요구하고, 단말 한글 글꼴 확인은 런북 체크리스트 미체크. 미정 상태가 수용 기준과 어긋남 | `apps/kiosk/kiosk.css:3`, `docs/design.md` 7절, `docs/brief.md` 5절 |
| 61 | 환자에게 보이는 문구의 임상 검토 표식 | N- | 임상 문구 검토 절차의 표준은 확인 못 함(기준서 범위 밖) | **표식이 불완전.** 표식 있음: `clinical.ts`의 상수들, `main.ts:87,125`, `chatview.ts:9`. **표식 없는 환자 노출 문구가 `main.ts`에 직접 박혀 있음**: 제목·본문 `"문진을 시작합니다"`, `"말씀해 주세요"`, `"확인하고 있어요"`, `"직원이 곧 도와드립니다"`(71~86행), `"그대로 기다려 주세요. 직원이 오면 이어서 안내해 드립니다."`(86행), CALL_STAFF 사유별 문장 5개(92~96행), `"수고하셨습니다"`(124행), `"저장하지 못했어요. 다시 말씀해 주세요."`(132행), `"연결이 느려 다시 시도하고 있어요..."`(48행). "직원이 곧 도와드립니다"는 대기 시간을 암시하는 약속형 문구인데 검토 표식이 없음. 설계서 3절만 "STARTING 문구는 임시 UI 문구"라고 밝힘. `clinical.ts` 머리말은 "임상 판단 값을 한 곳에 모은다"고 하지만 문구는 일부만 모여 있음 | `apps/kiosk/main.ts:48,71-96,124,132`, `apps/kiosk/clinical.ts:29-50` |
| 62 | 대화 말풍선을 `textContent`로만 렌더, 목록은 `aria-live="off"`(최신 응답은 `#app`이 읽음) | S- | OWASP XSS 방지(DOM에는 `textContent` 사용 권고, 기억). 낭독 중복 방지는 WCAG 4.1.3 취지 | ADR 0015가 두 이유를 적음(표준 이름은 인용하지 않음) | `apps/kiosk/chatview.ts`, `apps/kiosk/index.html:21`, `docs/adr/0015-*.md` |

## 2. 요청받은 요소별 요약

- **기기 토큰 자격 전달**(10~14번): 헤더 형식(Bearer, RFC 6750)은 표준이다. 전달 경로(URL 조각, 인증 없는 `/config.json`)는 표준 인증 절차가 아니라 이 프로젝트가 정한 방식이고, ADR 0006은 저장소·쿼리 문자열과만 비교했다. 비교되지 않은 대안: 게이트웨이가 요청에 토큰을 붙여 브라우저가 비밀을 갖지 않는 방식(브리프 4절의 "인증은 게이트웨이가 붙인다"와 D88 U8 "브라우저가 토큰을 보낸다"가 다른 모양), 기기 인증서(mTLS, RFC 8705), 짧은 수명 토큰과 갱신. 수명·회전·폐기는 이 영역에 기록이 없고 gateway 몫이다. 이 영역이 자격을 발급·관리하지는 않으므로 O로는 분류하지 않았다. `/config.json`을 기기 밖에서 못 읽게 하는 것은 gateway가 해야 하는데 CR-001은 미해결이고 실제 gateway는 확인하지 못했다.
- **음성 인식**(31~34번): 온디바이스 한정은 근거가 있으나 Web Speech API 자체가 표준 트랙이 아니고 실기기 지원은 확인된 바 없다(U05 열림).
- **재시도·timeout 값**(18~25번): 10초는 계약, 20초는 FAULT_POLICY, 2초 폴링은 계약에서 온 제약이다. 이 영역이 정한 나머지 값(0.5초, 5초, 50%, 1초/15초, 30초+5초, 10초 설치 대기, 15초 재읽기)은 스스로 "임의, 측정 안 함"이라 적었다.
- **서비스 워커·웹 푸시**(39~43번): 표준(RFC 8030/8292, W3C)을 따른다. 해지 요청이 엔드포인트를 쿼리에 싣는 점(42번)이 눈에 띈다.
- **SSE 재연결**(35~38번): 직접 재연결의 이유는 있으나 값은 임의다.
- **CSP·보안 헤더**(46~48번): 표준 헤더를 쓰지만 지시어별 이유가 없다.
- **esbuild·프레임워크 없는 TS**(1~2번): ADR은 있으나 비교 기록이 없고 ADR 안의 번들 크기 수치가 현재 사실과 다르다.
- **상태 기계 모양**(5번): 모양을 고른 이유 기록이 없다.
- **접근성**(58~59, 29번): WCAG는 부분 인용, 적합 목표 수준 없음, 유휴 초기화의 시간 제한 판단 없음.
- **임상 검토 표식**(61번): 불완전.
- **메모리 전용 저장**(15번): 표준 권고와 맞고 소스 검색으로 확인했다.
- **정적 서버 구현**(45번): 경계 사례. 서비스 API 없는 52줄 서버라 N으로 두었으나 "표준 인프라가 제공하는 것을 직접 만들었다"의 O에 해당한다는 판단도 가능하다. 근거(ADR 0010)가 얇고 비교 기록이 없다는 점을 헤드가 판단해 달라.

## 3. N-, O, ? 항목만 모음

- N- #2: esbuild `target es2022`·소스맵 없음의 이유 없음(`scripts/build.mjs:6`).
- N- #5: 상태 기계를 손으로 쓴 모양과 상태 분해의 이유·대안 비교 없음(`apps/kiosk/flow.ts:67-125`, `docs/design.md` 3절).
- N- #13: 토큰 형식 정규식과 512자 상한이 임의, RFC 6750 b64token보다 넓음(`api/device.ts:7`).
- N- #14: 기기 토큰의 수명·회전·폐기 절차가 이 영역 기록에 없음(ADR 0006이 인정), 만료 없는 정적 Bearer.
- N- #21: 백오프 값 0.5초/2배/5초/50%가 임의(`api/retry.ts:21-28`).
- N- #25: STT 언어 팩 설치 timeout 10초가 임의(`apps/kiosk/stt.ts:53`).
- N- #26: STT 신뢰도 하한 0.4가 근거 없음(`apps/kiosk/clinical.ts:7`).
- N- #27: 종료 화면 8초가 근거 없음(`apps/kiosk/clinical.ts:10`).
- N- #29: 유휴 초기화에 사전 경고·연장이 없고 WCAG 2.2.1 해당 여부 판단 기록 없음(`apps/kiosk/flow.ts:115-125`).
- N- #30: 장기 대기 안내 5분, 입력 500자, 말풍선 100개, 직원 목록 20쪽 상한이 임의(`apps/kiosk/clinical.ts:20,23`, `apps/staff/sync.ts:52`).
- N- #36: 직원 스트림 재연결 1초/15초/50%가 임의(`api/retry.ts:47`).
- N- #38: 직원 목록 15초 재읽기가 임의(`apps/staff/sync.ts:25,99`).
- N- #42: 푸시 구독 해지가 엔드포인트 URL을 쿼리 문자열에 실음, 근거 없음(`api/staff.ts:30`).
- N- #53: 베이스 이미지를 태그로만 고정(digest 없음), 한계로만 적고 이유·되돌릴 조건 없음(`Dockerfile:2,8`).
- N- #60: 글꼴 파일을 넣지 않음, 설계서는 미정이고 브리프 요구와 어긋남(`apps/kiosk/kiosk.css:3`).
- N- #61: 환자 노출 문구에 임상 검토 표식이 일부만 있음(`apps/kiosk/main.ts:48,71-96,124,132`).
- O: 없음. (경계 사례 #45 정적 서버, 상태 기계 #5, 직접 재연결 #35, 손 검증 #7을 O로 볼 여지는 헤드 판단에 맡긴다. 자격 발급·스케줄러·PKI·큐를 직접 만든 것은 이 영역에서 찾지 못했다.)
- ? #59: 한국 키오스크·웹 접근성 법정/규격 기준과의 적합 여부를 확인하지 못함.

## 4. 이 점검에서 함께 보인 문서 불일치(분류 밖, 참고)

- ADR 0001의 번들 크기(12KB/14KB)가 현재 `dist`(32KB/23KB)와 다름.
- `docs/boundary.md`는 지원 계약을 v2.1.0(태그 수신 전)이라 쓰고 `Dockerfile:13`은 `ARG BOUNDARY_CONTRACT=v2.1.1`(README는 Dockerfile이 정본이라 함).
- CR-001 5절 "이미지에 `/config.json`은 없다"가 3절·코드·ADR 0006과 어긋남.
- README는 D84(`NAME_FILE`)를 해당 없음이라 하고 ADR 0006은 D84를 근거로 듦(`/config.json`의 비밀이 파일로 오지만 `NAME_FILE` 형식은 아님).

## 5. 점검하지 못한 것

- 표준 원문(RFC 6750/8030/8292/9110/9111/9700/3986, WCAG 2.2, W3C CSP/Push/Service Workers, HTML SSE, OWASP 시트, Docker 모범 사례)을 이 세션에서 열어 보지 않았다. 표의 표준 서술은 기억에 의존하며 `(기억)`으로 표시한 것은 특히 확신이 낮다. 한국 접근성 기준은 이름을 모른다(#59).
- 이웃 문서: FAULT_POLICY, DECISIONS(D88 U8·U10 원문), OPEN_GAPS는 읽기 허용 범위 밖이라 읽지 않았다. 20초·60초·3회 값의 정책 쪽 근거는 확인하지 못했다. `PUBLIC_API.md`는 일부 줄만 읽었다(10초·2초의 계약 측 근거, 푸시 구독 DELETE 모양은 확인하지 못함).
- `apps/kiosk/flow.ts` 전체(420줄 중 상태 표·유휴·폴링 부분), `apps/staff/{main,record,decide,alertinfo}.ts`, `mock-server/app.ts`, `scripts/{check-schema,doctor,smoke,e2e-docker,setup-env}`, `test/`, `test-e2e/`, `docs/runbook.md`, `docs/STATUS.md`, CR-002~005 본문 대부분은 읽지 않았거나 일부만 읽었다. `test/static.test.ts`가 소스에 저장소 API가 없음을 확인한다는 CR-005의 서술은 시험 파일을 열어 확인하지 않았다(#15는 내가 한 검색으로 확인).
- 실행: 빌드·시험·`npm audit`·Docker 이미지 빌드·smoke·브라우저 시험·실제 마이크/STT/푸시를 하지 않았다. 정적 서버의 잘못된 `%` 경로 처리(#48)는 읽기 판단일 뿐 실행하지 않았다.
- 게이트웨이(deploy)와 survey-service의 기기 토큰 검증, `/config.json` 접근 제한, HTTPS/HSTS, 직원 콘솔 로그인은 이 리포에서 확인할 수 없다.
- 번들 크기 외에 `dist` 내용(토큰·외부 URL 부재)은 직접 검사하지 않았다.
