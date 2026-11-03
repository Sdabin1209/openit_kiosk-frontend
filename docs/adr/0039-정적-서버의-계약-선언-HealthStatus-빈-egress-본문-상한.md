# 0039. 정적 서버의 계약 선언: HealthStatus 본문, 빈 egress, 경로별 본문 상한 1KiB, 잡 없음

- 상태: 채택 (2026-11-04, 계약 3.4.7)
- 맥락: RUNTIME R5.1은 `/healthz`·`/readyz`의 본문이 `HealthStatus`(비어 있지 않은 JSON 객체, status는 ok·ready·not_ready)를 지키게 한다. Exposure에는 `egress`(이 영역 게이트웨이가 열어 줄 나가는 상대)와 경로별 `max_body_bytes`(없으면 8MiB)가 있다. 잡 선언(`JobsDeclaration`)은 잡이 하나 이상일 때만 의미가 있다.
- 결정: (1) Caddy가 `/healthz`는 `{"status":"ok"}` 200, `/readyz`는 `{"status":"ready"}` 200 또는 화면이 없으면 `{"status":"not_ready"}` 503을 `application/json`으로 낸다. 인증 없음. 이미지 시험이 계약 검증기로 본문을 확인한다. (2) `deploy-exposure.json`에 `"egress": []`: 이 영역은 브라우저가 같은 출처의 공개 입구로만 부르고 영역 컴포넌트가 다른 서비스를 부르지 않는다. (3) 화면 경로(GET 전용)의 `max_body_bytes`는 1024. (4) 잡이 없으므로 `io.openit.jobs` 라벨을 달지 않는다(`JobsDeclaration.jobs`는 1개 이상). `/metrics`는 이 정적 서버에 두지 않는다.
- 왜: (1) 계약이 정했다(빈 200은 통과로 보지 않는다). (3) GET만 받는 정적 경로는 요청 본문이 없으므로 기본 8MiB는 필요 이상으로 크다. 1KiB는 측정한 값이 아니라 "본문이 없어야 한다"는 뜻의 작은 시작값이고, 근거 표준은 없다(측정하지 않았다). 이 값을 넘는 GET 본문은 게이트웨이가 413으로 막는다.
- 검토한 대안: 기본 8MiB 유지 -> 정적 GET에 본문 허용 범위가 필요 이상. `/metrics`를 Caddy로 -> 계약이 정적 서버의 지표를 요구하는 칸이 없다(RUNTIME-MATRIX F21·F27은 정적 서버를 DB·로그 쪽에서 해당 없음/닫힘으로 처리).
- 결과: 얻는 것 - 감시·deploy가 본문까지 확인할 수 있는 건강 확인. 감수하는 것 - `/metrics`와 `io.openit.jobs`가 없다는 점을 계약이 요구하는지 확인하지 못했다(요구하면 변경 요청).
- 되돌리는 조건: 계약이 정적 서버에도 `/metrics`나 잡을 요구하면 새 ADR.
