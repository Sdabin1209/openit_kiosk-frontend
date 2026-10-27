# kiosk-frontend

환자가 키오스크에서 음성으로 문진하는 웹 화면(키오스크 앱)과, 위험 신호로 멈춘 세션을 직원이 풀거나 끝내는 웹 화면(직원 콘솔 앱)을 만드는 영역이다.

이 영역은 화면만 맡는다. 서버와는 공개 API(I10) 하나로만 말한다. 문진 로직, 문항 판단, 모델 호출, 데이터 저장은 하지 않는다. 환자 발화는 브라우저 메모리에서만 다루고 저장소·쿠키·콘솔에 남기지 않으며, 서버 비밀도 갖지 않는다. 키오스크는 기기 토큰(`#device=` 조각 또는 `/config.json`)을 메모리에만 두고 `/v1/sessions*`에 `Authorization: Bearer`로 보내며, 병원 접수가 넘긴 환자 참조(`#subject_ref=`)를 세션 시작 본문에 실어 보낸다(D85, `PUBLIC_API.md` 추가 인터페이스 A·F). 직원 인증은 게이트웨이가 붙인다(E). STT 서비스 자체도 만들지 않는다. 브라우저 Web Speech API(ko-KR)를 `SttAdapter` 뒤에 두고, 쓸 수 없으면 입력창으로 대신한다. 지금은 대략적인 참고 구현이고, 실제 프론트팀이 맡으면 이 리포지토리를 통째로 바꿔도 되게 설계했다(출처: `docs/brief.md` 성격 D65).

## 전체 속의 위치

| 방향 | 이웃 | 인터페이스 | 내용 |
|---|---|---|---|
| 입력 | 문진 서버(survey-service, 게이트웨이 경유) | I10 공개 API `PUBLIC_API.md`, 같은 출처의 `/v1` | 응답 문장(`FrontendInput`), 위험·전달 실패 신호(`TurnFailureSignal`), 알림 목록, SSE |
| 출력 | 같은 서버 | `POST /v1/sessions`, `/v1/sessions/{id}/turns`, `/end`, `/intervention` | 세션 시작, 발화 텍스트, 종료, 직원의 재개/종료 결정 |
| 출력 | 같은 서버 | `GET /v1/sessions/{id}/state`(2초 폴링), `/v1/staff/*`(알림, SSE, push-config, 푸시 구독) | 위험 정지 해제 확인, 직원 콘솔 |
| 입력 | deploy(게이트웨이) | 요청에 토큰을 붙임(CR-001, 요청 상태) | 인증, `/` 와 `/staff/` 정적 서빙 |

이웃 영역의 코드·SDK는 쓰지 않는다. 제공하는 서비스 API와 SDK는 없다(정적 파일, `/healthz`, `/readyz`뿐. `docs/boundary.md`).

## 구조

| 경로 | 역할 |
|---|---|
| `api/` | 공개 API 클라이언트. UI를 모른다. 재시도(같은 `turn_id`, 지수 백오프+지터, 총 예산 20초: `api/retry.ts`), 세션별 순서 큐, 10초 타임아웃, 상태 코드 분기 |
| `apps/kiosk/` | 키오스크 앱. `flow.ts` 상태 기계, `stt.ts` 음성 어댑터, `main.ts` 화면 |
| `apps/staff/` | 직원 콘솔. `decide.ts` 개입 결정(확인 후 전송), `push.ts` 푸시 구독, `sw.ts` 서비스 워커 |
| `mock-server/` | 공개 API 모의 서버(시나리오: normal, risk_stop, delivery_failed, not_committed, delay, hang, error 등). 서버 없이 혼자 시험·시연하는 대역 |
| `server/static.mjs` | 빌드 결과를 내는 정적 서버(`/healthz`, `/readyz`) |
| `scripts/` | `build.mjs`, `check-schema.mjs`(스키마 열거값 대조), `doctor.mjs`(전제 점검), `smoke.sh`, `e2e-docker.sh` |
| `test/`, `test-e2e/` | 단위·계약 시험(`node:test`), 브라우저 시험(Playwright 컨테이너) |
| `Dockerfile` | 정적 빌드 이미지(non-root, 라벨 `io.openit.*`) |
| `docs/` | 아래 "더 자세한 문서" 참고 |

```
환자 음성 -> SttAdapter(텍스트) -> 키오스크 flow.ts -> api/client.ts -> /v1 (게이트웨이) -> 문진 서버
                                         ^                                     |
   응답 문장 / 위험 대기 / 직원 호출 / 다시 말하기  <---- FrontendInput <---------+
직원 콘솔 <-- SSE(alert/resolved) + 웹 푸시 -- 서버 ;  개입 결정(재개/종료) --> 서버 --> 키오스크가 state 폴링으로 재개
```

## 실행 방법

전제: Node 24 이상(`package.json` engines), npm. `smoke`와 `test:e2e`는 Docker(데몬 접속 가능)가 필요하다. 호스트에 브라우저는 설치하지 않는다. 비밀 값: 이 영역은 이미지·리포지토리에 비밀을 두지 않는다(기기 토큰은 실행 중 시작 URL 조각이나 기기 설정 `/config.json`으로 받아 메모리에만 둔다, 소스에서 `_FILE` 방식 비밀 읽기를 찾지 못했다). D84의 NAME_FILE 규칙은 해당 없음으로 본다.

```bash
cd kiosk-frontend
npm ci                  # 의존 설치(리포 안 node_modules)
npm run doctor          # Docker 전제 점검
npm run typecheck && npm run check-schema
npm test                # 단위·계약 시험
npm run build && STATIC_DIR=dist MOCK_SCENARIO=risk_stop node mock-server/main.ts   # 모의 서버로 시연(PORT를 비우면 빈 포트)
npm run smoke           # 이미지 빌드, /healthz, 라벨, non-root (Docker)
npm run test:e2e        # 헤드리스 Chromium 화면 시험, Playwright 공식 이미지 안에서 실행 (Docker)
```

이 문서를 쓰며 직접 돌려 본 것(2026-10-27, Node v24.14.0): `npm test`(통과, 숫자는 실행 결과 참조), `npm run typecheck`(오류 없음), `npm run check-schema`("스키마 열거값 일치"), `npm run doctor`("OK: 전제 충족").
돌리지 않은 것: `npm ci`, `npm run build`, 모의 서버 시연, `npm run smoke`, `npm run test:e2e`, `npm run test:e2e:host`.

## 현재 상태

확인된 것(근거 문서):
- 단위·계약 시험이 이 세션에서도 통과했다.
- 브라우저 시험 통과, 이미지 빌드·`/healthz`·라벨·non-root 확인은 이전 작업 PC에서 했다고 기록되어 있다(`docs/runbook.md`, `docs/STATUS.md`). 이 세션에서는 다시 확인하지 않았다.
- boundary-contracts v2.0.2, survey-schema 1 기준이다(D66 회신 반영은 v1.3.2 시점, v2에서 이 영역의 I10 응답 모양은 바뀌지 않았다). CR-002, CR-003은 헤드가 회신해 해소됐다(`docs/STATUS.md`, `docs/boundary.md`).

확인 못 한 것:
- 실제 survey-service와의 연동(시험은 모의 서버뿐). 실제 게이트웨이(CR-001)도 확인하지 못했다.
- 실제 기기의 마이크 권한, 한국어 STT 정확도, TTS 음성, 단말 한글 글꼴, 웹 푸시 구독과 실제 푸시 전달, HTTPS 서비스 워커(`docs/runbook.md` 체크리스트가 모두 미체크).
- 호스트 직접 브라우저 시험(`test:e2e:host`): 이 PC에서 돌리지 못했다고 기록됨.
- 계약 버전 정합: Dockerfile `BOUNDARY_CONTRACT=v2.0.2`. `npm run check-schema`가 계약 패키지 버전·pipeline_schema_version과 대조한다. v2의 I10 변화는 SSE `id:` 설명뿐(PUBLIC_API.md 차이 확인).

## 이 영역의 열린 항목

헤드 대장 `head/docs/OPEN_GAPS.md`(읽기 전용)에서 골랐다. 이 영역을 직접 지목한 것은 U05뿐이고, 나머지는 키오스크 화면 동작에 영향을 주는 이웃·공통 항목이라 내가 고른 것이다.

| ID | 요약 | 막고 있는 것 |
|---|---|---|
| U05 | 실제 브라우저 화면, 한국어 음성 인식(STT), 웹 푸시 수신을 해 보지 않았다(열림) | 사람이 실기기에서 확인(`docs/runbook.md` 체크리스트). GPU와 무관 |
| G01 | 직원 알림의 입력원이 없어 알림 경로가 비활성(survey-service 소유, 부분). 직원 알림 화면은 실제 서버로 시험되지 않았다 | 사용자 결정(입력원 미정), 다른 영역 의존 |
| G12 | REASK/CONFIRM 상한이 기본 꺼짐이라 환자가 같은 질문을 계속 받을 수 있음(survey-service 소유, 부분). 상한이 켜지면 직원 호출 경로를 타서 키오스크 화면과 닿는다 | 사용자 결정(값·의미) |
| U07 | 실제 LLM 데모에서 키오스크 발화 14턴이 모두 `NOT_COMMITTED`로 끝났다(부분, 모델 쪽 원인으로 추정) | GPU와 학습된 LoRA(H2), 계약 변경(U14), 다른 영역 의존 |
| D-A | 운영 도메인·HTTPS, 직원 콘솔 로그인 방식 등(열림). 이 영역의 CR-001과 관련 | 사용자 결정 |

## 더 자세한 문서

| 문서 | 내용 |
|---|---|
| `CLAUDE.md` | 이 영역 에이전트의 지침(하는 일, 하지 않는 일) |
| `docs/brief.md` | 영역 브리프: 목적, 범위, 소유·소비하는 것, 수용 기준, 경계, 열린 결정 |
| `docs/design.md` | 내부 설계: 화면 흐름, 상태 기계, 공개 API 규칙 대응표, 모의 서버 시나리오 |
| `docs/boundary.md` | 경계 문서: 소유 저장소, 지원 계약 버전, 장애 영향 |
| `docs/runbook.md` | 시험 명령 표, 브라우저 시험 전제, 사람 확인 체크리스트 |
| `docs/STATUS.md` | 한 일, 남은 일, 막힌 것 |
| `docs/change-requests/` | CR-001(deploy: 게이트웨이·정적 서빙), CR-002(계약 부족분), CR-003(재개 신호). CR-002·003은 해소 기록 |
