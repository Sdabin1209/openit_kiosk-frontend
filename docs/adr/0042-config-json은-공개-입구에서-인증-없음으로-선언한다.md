# ADR 0042: `/config.json`은 공개 입구에서 인증 없음(none)으로 선언한다 (0029의 `/config.json` 행 대체)

## 상태
채택됨 (2026-11-08, 계약 v4.0.4). Supersedes: ADR 0029 표의 `/config.json` denied 행.

## 맥락
ADR 0029는 `/config.json`을 `denied`로 적고 "게이트웨이가 404로 막는다"고 보았다. 계약 4.0.4 `Exposure`(routes[].upstream_token 설명)는 denied 선언에 공개 입구가 경로를 만들지 않으며, 같은 (경로, 메서드)에 다른 선언이 있으면 그 선언이 쓰인다고 정한다. 이 영역의 `/*`(none, GET)가 `/config.json`을 덮으므로 실제로는 인증 없이 열린다. 또 키오스크 앱은 시작할 때 같은 출처(공개 입구)로 `GET /config.json`을 읽는다(`src/components/link_device_config_receive.ts`). 선언과 실제가 어긋났다.

## 결정
`deploy-exposure.json`에 `/config.json` 경로를 `auth.kind=none`, `methods=[GET]`, 나머지 값은 `/*`와 같게(user_header strip, timeouts 2000/10000ms, max_body_bytes 1024) 따로 적는다. denied는 `/healthz`, `/readyz`만 남긴다.

## 왜
- 계약 `Exposure` 설명: 노출하지 않는 경로를 denied로 적는다. `/config.json`은 노출되므로 denied가 아니다.
- 따로 적는 이유: `/*`에 묻어 두는 것보다 앱이 읽는 경로가 인증 없이 열린다는 사실이 선언에 드러난다. 시험(`test/exposure.test.ts`)이 그 행을 확인한다.
- 계약 4.0.0부터 `DeviceConfig`에는 기기 자격(device_token)이 없다(D136).

## 검토한 대안과 버리는 이유
- denied 행만 지우기(`/*`가 덮음): 동작은 같지만 앱이 읽는 경로의 노출이 선언에 보이지 않는다.
- `device`로 선언: 공개 입구는 device 경로에 `upstream_token`을 요구하고(PUBLIC_API F절 4.0.4, platform 생성기 종료 65) 정적 서버는 서비스 토큰을 쓰지 않는다. 계약이 정적 device 경로를 따로 정하지 않아 이 영역이 정할 수 없다.

## 결과
- 얻는 것: 선언이 실제 공개 입구 동작과 같다.
- 감수하는 것: `/config.json`은 공개 입구에 닿는 누구나 읽을 수 있다. `DeviceConfig.subject_ref`(개인정보 참조일 수 있음)를 기기 설정에 두면 함께 열린다. 이 영역은 값을 로그에 쓰지 않는다.

## 되돌리는 조건
계약이 정적 경로의 기기 인증(device, upstream_token 없음)이나 denied 우선 규칙을 정하면 그에 맞춰 바꾼다.
