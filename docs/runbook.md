# 런북

## 시험 한 명령씩
| 명령 | 내용 |
|---|---|
| `npm ci` | 의존 설치(리포 안 `node_modules`) |
| `npm test` | 단위·계약 시험(48개, doctor 판정 시험 5개 포함) |
| `npm run typecheck`, `npm run check-schema` | 타입, 스키마 열거값 |
| `npm run smoke` | 이미지 빌드, `/healthz`, 라벨, non-root (Docker 필요) |
| `npm run doctor` | 브라우저 시험 전제 점검(아래). `test:e2e`가 시작할 때 자동으로 먼저 부른다 |
| `npm run test:e2e` | 실제 헤드리스 Chromium에서 화면 흐름(9개). 빌드 후 모의 서버+정적 서버를 빈 포트로 띄운다 |

## 브라우저 시험(`test-e2e/`) 전제 설치
`npm run doctor`(`scripts/doctor.mjs`)가 아래 전제를 점검한다: Playwright Chromium 설치 여부, `ldd`로 본 빠진 공유 라이브러리(이름으로 나열), 한글 글꼴(`fc-list :lang=ko`). 부족하면 `FAIL: 전제 미충족`과 해결 명령을 내고 종료 코드 1로 끝난다. `test:e2e`는 doctor가 실패하면 시험을 시작하지 않는다. 판정 로직은 가짜 점검 결과로 단위 시험한다(`test/doctor.test.ts`).

1. `npm ci` (Playwright 1.55.0은 devDependency로 잠겨 있다)
2. `npx playwright install chromium` (브라우저를 `~/.cache/ms-playwright`에 내려받는다)
3. 시스템 라이브러리: `sudo npx playwright install-deps chromium` (Ubuntu 24.04에서 libnspr4, libnss3, libasound2t64가 없으면 브라우저가 뜨지 않는다. 시험은 이 오류 메시지를 그대로 낸다)
4. 한국어 글꼴: `sudo apt-get install fonts-noto-cjk`. 없으면 스크린샷의 한글이 네모(두부)로 찍힌다. DOM 문구 확인은 글꼴과 무관하게 통과한다.

시험은 새 헤드리스 모드(`channel: "chromium"`)를 쓴다. 기본 headless shell은 알림 권한 부여가 동작하지 않는다.
스크린샷은 `e2e-artifacts/`(gitignore)에 저장되며 환자 정보 없는 가짜 문장만 쓴다.

### 검증 환경과 한계 (숨기지 않음)
브라우저 시험 9/9 통과는 이 작업 PC에서 sudo 암호가 없어 표준 설치(`install-deps`, 글꼴)를 못 하고, `apt-get download`한 libnspr4·libnss3·libasound2t64 deb을 스크래치패드에 풀어 `LD_LIBRARY_PATH`로 가리킨 우회 환경에서 얻은 결과다. 표준 전제를 갖춘 환경에서만 재현되는 것으로 보고, 아직 그런 깨끗한 환경에서는 돌려 보지 못했다. 우회 없이 이 PC에서 `npm run test:e2e`를 실행하면 doctor가 위 라이브러리 목록과 함께 FAIL로 끝나는 것을 확인했다. 한글 글꼴도 이 PC에는 없어 스크린샷은 네모로 찍혔다.

### 자동으로 확인하는 것
시작 → 질문 → 텍스트 제출 → 다음 질문 → 종료, 가짜 SpeechRecognition 경계(ko-KR 어댑터가 텍스트를 서버로 전달), 위험 발화 대기 화면, 직원 호출 화면(알림 전달 실패)과 처음으로, 503 지속 시 직원 호출 화면, 저장 실패 시 다시 말하기, 지연 중 대기 화면, 직원 콘솔 실시간 알림과 이어서 진행(키오스크가 폴링으로 재개), 서비스 워커 등록·활성화와 푸시 핸들러의 알림 표시(합성 PushEvent).

### 사람 확인 필요(구멍) 체크리스트
실제 기기·실제 브라우저(Chrome, 키오스크 단말)에서 사람이 한다.
- [ ] 마이크 권한 요청 창이 뜨고, 허용하면 "말하기" 버튼이 듣기 상태가 된다. 거부하면 텍스트 입력 또는 다시 말하기로 이어진다.
- [ ] 한국어 STT 정확도: 실제 음성으로 증상 문장 10개 이상을 말하고 인식문과 신뢰도(confidence)를 기록한다. `MIN_CONFIDENCE`(0.4) 적정성 판단. 소음 환경 포함. (Web Speech API는 Chrome에서 인터넷 연결과 구글 음성 서비스에 의존한다.)
- [ ] 인식 결과가 비었을 때(침묵) "다시 말씀해 주세요"가 나온다.
- [ ] TTS(ko-KR) 음성이 나오고 알아들을 만하다. 단말에 한국어 음성이 설치되어 있는지.
- [ ] 단말에서 한글 글꼴이 정상 표시되고 글자 크기가 읽기 쉽다(실물 화면 해상도).
- [ ] 웹 푸시 구독: 직원 콘솔에서 "푸시 알림 켜기" → 알림 권한 허용 → 구독 성공. 헤드리스 시험은 구독 단계에서 `Registration failed - permission denied`로 실패한다(Chromium의 푸시 구독은 외부 푸시 서비스에 의존하고 자동화 환경에서는 허용되지 않는다). 구독 객체 생성은 확인하지 못했다.
- [ ] 실제 푸시 서비스(FCM 등)를 거친 서버 → 브라우저 전달, 브라우저를 닫았거나 화면이 꺼진 상태의 알림 표시, 알림 클릭 시 `/staff/` 열림. VAPID 키가 설정된 실제 서버 필요.
- [ ] HTTPS 배포 환경에서 서비스 워커 등록(시험은 127.0.0.1 http, 보안 컨텍스트로 취급됨).
- [ ] 실제 survey-service와의 연동(시험은 모의 서버).

### STT 경계
`apps/kiosk/stt.ts`의 `SttAdapter`가 경계다. `SpeechRecognition`이 없으면 텍스트 입력으로 대체되고, 시험은 가짜 `SpeechRecognition` 주입(`addInitScript`)으로 어댑터 경로를 지난다. 마이크 입력과 인식 자체는 가짜로 대체된 것이다.
