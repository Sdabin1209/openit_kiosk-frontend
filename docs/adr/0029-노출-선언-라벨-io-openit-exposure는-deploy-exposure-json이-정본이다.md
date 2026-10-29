# ADR 0029: 노출 선언 라벨 `io.openit.exposure`는 `deploy-exposure.json`이 정본이다

## 상태
채택됨 (2026-10-30, OPEN_GAPS U47, 계약 v2.6.0 `Exposure`와 ImageLabels의 `io.openit.exposure`).

## 맥락
deploy의 `config/Caddyfile`이 이 영역 경로의 인증·메서드·역할을 직접 안다(구조 규칙 1 위반). 계약은 영역이 이미지 라벨로 노출 표를 선언하고 deploy가 그 선언으로 Caddyfile을 만들거나 대조하도록 정했다. deploy 쪽 변경은 나중이다.

## 결정
- 정본은 리포 루트의 `deploy-exposure.json`이다. `scripts/build-image.sh`(`build-image.mjs`)가 계약 검증기(Exposure)로 검증하고 한 줄 JSON으로 줄여 `docker build --label io.openit.exposure=<JSON>`으로 단다. 이미지에서 읽은 라벨이 그 값과 같은지 비교하고 BuildImageResult.labels에 낸다. Dockerfile에는 이 라벨을 두지 않는다(값이 파일 내용이라 LABEL로는 못 정한다. ADR 0025와 같은 이유).
- 표(현재 deploy/config/Caddyfile의 이 영역 블록에서 옮겼다):

| 경로 | 인증 | 메서드 | 비고 |
|---|---|---|---|
| `/config.json`, `/healthz`, `/readyz` | denied | | 게이트웨이가 `/config.json`은 404로 막고(기기마다 그 기기의 정적 서버가 낸다), `/healthz`는 자기가 200을 내고 `/readyz`는 survey-service의 것을 낸다. 이 이미지의 같은 경로는 밖으로 내지 않는다 |
| `/staff/*` | account, roles [staff] | GET | 직원 콘솔 정적 화면. `user_header` strip(Authorization·X-Openit-User를 지운다), dial 2000ms, response_header 10000ms |
| `/*` | none | GET | 키오스크 화면과 자산(`/`, 자산, `/staff`의 301). 같은 strip·timeouts |

- 시험: `test/exposure.test.ts`(선언이 Exposure를 지키고 Caddyfile 규칙과 어긋나지 않음), `test-image/static-image.test.ts`(실제 이미지: 열린 경로 GET 200, 선언 밖 메서드 405, `/config.json` 404), `test/build-image.test.ts`와 `test-image/build-image.test.ts`(라벨이 결과에 나오고 계약을 통과, 라벨이 없으면 진입점이 실패).

## 왜
- 계약 2.6.0과 구조 규칙 1. 이 영역이 자기 노출 표를 한 파일로 갖고, 코드 라우트와의 일치를 시험이 지킨다.
- `methods`를 GET으로 한 이유: 이미지는 GET·HEAD 외를 405로 막는다(Caddyfile). 계약의 methods 열거에는 HEAD가 없다.
- 값(timeouts 2000/10000ms)은 deploy Caddyfile의 현재 값을 그대로 옮긴 것이다. 이 영역이 측정한 값이 아니다(측정 안 함).

## 검토한 대안과 버리는 이유
- Dockerfile에 `ARG`로 JSON을 받아 LABEL: 빌드 인자 이름이 deploy에 새는 구조다(U42가 없애려는 것).
- 표를 시험 코드에 두기: 정본이 시험이 되어 deploy가 읽을 수 없다.

## 어긋남 / 한계 (보고)
- 게이트웨이 Caddyfile은 모든 메서드를 이 영역으로 전달하고 이미지가 405를 낸다. 선언은 GET만 연다고 하므로 deploy가 선언대로 만들면 405 대신 게이트웨이가 막게 된다(응답 코드가 달라질 수 있다).
- `/staff` (슬래시 없음)는 게이트웨이에서 `/staff/*`가 아니라 마지막 `handle`(인증 없음)로 가서 이 이미지가 301을 낸다. 선언에서는 `/*`(none)에 포함된다. 현재 Caddyfile과 같은 동작이다.
- 이미지의 `/healthz`·`/readyz`는 이미지 자체 점검용(컨테이너 HEALTHCHECK, StaticImageInterface의 필수 경로)이고, 게이트웨이 밖으로는 내지 않는다.

## StaticImageInterface와의 관계 (헤드가 라벨로 낼지 정한다)
- 겹치는 부분: 경로 표(StaticImageInterface.routes의 path·kind)와 Exposure.routes의 paths. `/config.json`(kind device_config, CONFIG_FILE 있을 때만)은 Exposure에서 denied로 겹친다. `not_served_prefixes`(`/v1/`)는 Exposure에서 "목록에 없는 /v1/*는 게이트웨이가 404"라는 기본과 같은 취지다.
- 겹치지 않는 부분(StaticImageInterface에만 있음): `port`(8080), `env`(PORT, STATIC_DIR, CONFIG_FILE 기본값), `user`(root 아님), `device_config_schema`, 경로의 `kind`(page/asset/health/ready/device_config)와 `note`. 이 값들은 이미지가 deploy에 주는 실행 인터페이스(컨테이너 포트·환경 변수·사용자)이지 게이트웨이 노출 표가 아니다.
- Exposure에만 있는 부분: 인증 종류와 역할(account/staff 등), 메서드, `user_header`, `streaming`, `upstream_token`, `timeouts_ms`. 이 영역의 StaticImageInterface에는 없다.
- 관점이 다른 점: StaticImageInterface는 이 이미지가 `/healthz`·`/readyz`를 **낸다**고 선언하고(필수), Exposure는 같은 경로를 게이트웨이 밖으로 **내지 않는다**(denied)고 선언한다. 둘을 한 라벨로 합치려면 이 구분(이미지가 내는 것 vs 게이트웨이가 여는 것)을 정해야 한다.
- 현재 `docs/image-interface.json`은 라벨이 아니라 리포 안 파일이고 시험이 Dockerfile·실제 응답과 맞춘다. 라벨로 내는 것은 하지 않았다(결정은 헤드).

## 결과
- 얻는 것: deploy가 이 영역의 노출 표를 이미지 라벨에서 읽을 수 있다.
- 감수하는 것: 위 한계. 정본 파일과 `Caddyfile`의 일치는 시험이 일부만(경로 문자열, 405 규칙) 본다.

## 되돌리는 조건
계약이 노출 선언 형식을 바꾸면 따른다.
