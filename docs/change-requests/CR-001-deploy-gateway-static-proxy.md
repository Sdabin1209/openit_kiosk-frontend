# CR-001 (대상: 헤드 -> deploy) 게이트웨이 인증, 정적 서빙 경로, /v1 프록시, 직원 콘솔 접근 제어

작성: kiosk-frontend. 상태: 요청. 아래는 모두 **제안**이며 deploy가 정한다. 이 영역은 서버 토큰을 갖지 않으므로 이 사항이 정해져야 실제 환경에서 동작한다(확인하지 못함: 실제 게이트웨이).

## 가정
- 브라우저는 같은 출처의 `/v1/...`만 부른다. 게이트웨이(리버스 프록시)가 요청에 `Authorization: Bearer <토큰>`을 붙여 문진 서비스로 전달한다. 토큰은 게이트웨이의 비밀 값이다.

## 정해 줄 것
1. **경로와 역할 매핑(제안).**
   - 키오스크 화면 `/`: `/v1/sessions`, `/v1/sessions/*/turns`, `/v1/sessions/*/end` 요청에는 **kiosk 역할 토큰**을 붙인다.
   - 직원 콘솔 `/staff/`: `/v1/staff/**`와 `/v1/sessions/*/intervention` 요청에만 **staff 역할 토큰**을 붙인다. 키오스크 쪽 경로에서 `/v1/staff/**`가 오면 staff 토큰을 붙이지 않는다(403으로 끝나야 함).
2. **직원 콘솔 접근 제어.** staff 토큰을 붙이는 경로는 사람 인증 뒤에만 연다(기본 인증, 사내망 제한, SSO 등 deploy가 선택. 로그인 방식은 브리프상 미정). 키오스크 단말이 `/staff/`에 닿지 않도록 네트워크로도 나눌 것을 권한다.
3. **정적 파일 서빙.** 이미지(`kiosk-frontend`)가 8080에서 `/`(키오스크), `/staff/`(직원 콘솔), `/staff/sw.js`, `/config.json`, `/healthz`, `/readyz`를 낸다. 이미지는 `/v1`을 처리하지 않는다. 서비스 워커 범위가 `/staff/`이므로 `Service-Worker-Allowed` 헤더는 필요 없다.
4. **/v1 프록시와 SSE.** `/v1/staff/alerts/stream`은 응답 버퍼링을 끄고(`proxy_buffering off` 상당) 읽기 제한 시간을 길게(수 분 이상) 해야 한다. 서버가 보내는 `id:`와 클라이언트의 `Last-Event-ID`를 그대로 전달해야 한다. 웹 푸시는 HTTPS(또는 localhost)가 필요하다. 키오스크의 STT(Web Speech API)도 보안 출처가 필요하다. **HTTPS 종단은 deploy가 맡는다.**
5. **VAPID 공개키.** (갱신: D66) 이미지는 공개키를 다루지 않는다. 직원 콘솔이 `GET /v1/staff/push-config`로 받는다(survey-service). 이미지에 `/config.json`은 없다.
6. **헤더.** 이미지는 CSP(`default-src 'self'`), `nosniff`, `Referrer-Policy: no-referrer`를 낸다. 게이트웨이가 HTTPS 관련 헤더(HSTS)를 더한다. 접근 로그에 요청 본문을 남기지 말 것(환자 발화 포함).
7. **이미지 규약.** 설정은 환경 변수(`PORT` 기본 8080, 정수가 아니면 시작 거부, `STATIC_DIR`, 선택 `CONFIG_FILE`=기기 설정 파일 경로; `VAPID_PUBLIC_KEY`는 쓰지 않는다: 공개키는 `GET /v1/staff/push-config`로 받는다. 갱신: 이 문장은 구현에 맞게 고쳤다), non-root(uid 1000), 로그는 표준 출력, 라벨 `io.openit.service/revision/contracts.boundary/contracts.survey-schema`와 `io.openit.app-version`. `io.openit.turn-engine`, `io.openit.model-runtime`은 이 영역에 해당이 없어 두지 않는다(D50의 6개 중 해당하는 것만, 브리프 2절). 이미 그렇게 해도 되는지 확인 바람.
