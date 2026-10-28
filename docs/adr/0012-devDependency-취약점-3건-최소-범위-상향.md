# ADR 0012: devDependency 취약점 3건(playwright, ajv, fast-uri)을 최소 범위로 올린다

## 상태
채택됨 (2026-10-28). OPEN_GAPS L16 대응.

## 맥락
`npm audit`(2026-10-28, 레지스트리 조회만)가 devDependency 3건을 보고했다: playwright `<1.55.1`(high, 브라우저 내려받기 때 SSL 인증서 미검증, GHSA-7mvr-c777-76hp), ajv `<=8.17.1`(moderate, `$data` 옵션 ReDoS, GHSA-2g4f-4pwh-qvx6), fast-uri `<=3.1.8`(moderate, URI 해석 취약점 4건). `npm audit --omit=dev`는 0건이다.

## 결정
- playwright 1.55.0 -> **1.55.1**(취약점이 고쳐진 가장 낮은 patch). `npm audit fix --force`가 권하는 1.64.1은 minor 9단 상향이라 택하지 않는다.
- ajv 8.17.1 -> **8.20.0**(같은 8.x, `npm audit`이 제시한 수정 버전). 정확한 버전으로 고정(기존 방식 유지).
- fast-uri는 직접 의존이 아니라 ajv의 하위 의존이다. 잠금 파일에서 3.1.8 -> 3.1.9로 갱신.
- Playwright 공식 이미지 태그를 `v1.55.1-noble`로 함께 바꾼다(`test-e2e/Dockerfile`, 버전은 일치해야 함, ADR 0011).
- 결과: `npm audit` 0건, `npm audit --omit=dev` 0건.

## 왜 (따른 표준과 근거)
- 따른 기준: 워크스페이스 규칙(의존 버전은 잠금 파일로 고정, 고정 밖 상향은 최소 범위). 취약점이 고쳐진 가장 낮은 버전을 고르면 시험이 바뀔 위험이 가장 작다.
- 런타임 영향 없음 근거(확인한 것): 세 패키지 모두 `devDependencies`다. Dockerfile은 다단계 빌드이고 최종 단계에는 `dist`와 정적 서버(`server/static.mjs`, 의존 없음, ADR 0010)만 복사하므로 이 패키지들이 이미지에 들어가지 않는다. 앱 소스(`apps`, `api`)는 ajv를 가져오지 않는다(검색으로 확인). `npm audit --omit=dev`가 0건이다. ajv는 빌드 시 스키마 대조 시험(`check-schema`)에서, playwright는 개발 PC의 브라우저 시험에서만 쓴다.
- 확인하지 못한 것: 상향 전 위험이 실제로 악용되는 경로가 있었는지는 조사하지 않았다(개발 PC에서만 쓰이므로 필요 없다고 판단).

## 검토한 대안과 버리는 이유
- 올리지 않고 감사 결과만 문서화: 런타임 영향은 없지만 시험이 그대로 통과해 올리지 않을 이유가 없다.
- `npm audit fix --force`(playwright 1.64.1): 범위가 크고 Chromium 버전도 바뀐다. 필요 이상이다.

## 결과
시험 결과는 README 현재 상태 참조(단위 157, test:dom 8, test:e2e 23 통과, smoke 통과). 감수: 개발 PC가 새 Playwright 이미지를 한 번 받아야 한다.

## 되돌리는 조건
새 버전에서 브라우저 시험이 깨지면 1.55.0·8.17.1로 되돌리고 이 ADR을 새 ADR로 대체한다.
