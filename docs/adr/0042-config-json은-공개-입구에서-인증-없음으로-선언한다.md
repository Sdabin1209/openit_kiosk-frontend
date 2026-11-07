# ADR 0042: `/config.json`은 공개 입구에서 인증 없음(none)으로 선언한다 (0029의 `/config.json` 행 대체)

## 상태
채택됨 (2026-11-08, 계약 v4.0.5). Supersedes: ADR 0029 표의 `/config.json` denied 행.

## 맥락
ADR 0029는 `/config.json`을 `denied`로 적고 게이트웨이가 404로 막는다고 보았다. 계약 Exposure는 denied 선언으로 경로를 만들지 않으며, 같은 경로에 다른 선언이 있으면 그 선언을 사용한다. 앱은 시작할 때 같은 출처로 `GET /config.json`을 읽으므로 이 경로를 명시적으로 선언해야 한다.

platform에 남았던 전역 404 규칙은 명시적 GET none 선언보다 먼저 적용되지 않는 것으로 실제 Caddy 통합 시험에서 확인했다. 그 규칙 제거는 중복 정책 정리이며 새 선언에서도 경로를 막던 결함 수정으로 주장하지 않는다.

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
- 감수하는 것: `/config.json`은 공개 입구에 닿는 누구나 읽을 수 있다. 계약 4.0.5에서 `DeviceConfig.subject_ref`를 제거했으며, 환자 참조는 시작 URL 조각으로만 받는다. 설정에 이 키가 있으면 계약 위반으로 설정 전체를 사용하지 않는다. 값은 로그에 쓰지 않는다.

## 되돌리는 조건
계약이 정적 경로의 기기 인증(device, upstream_token 없음)이나 denied 우선 규칙을 정하면 그에 맞춰 바꾼다.
