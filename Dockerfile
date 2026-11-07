# syntax=docker/dockerfile:1
# 기반 이미지는 digest 로 고정한다(공통 규칙 '빌드 때 고정'). 태그는 읽기 쉬우라고 남기며 digest 가 있으면 docker 는 digest 만 쓴다.
# 값: 2026-11-05 이 PC 에서 `docker pull <태그>` 로 받은 뒤 `docker image inspect --format '{{index .RepoDigests 0}}' <태그>` 로 읽은 멀티 아키텍처 index digest 다(두 이미지 모두 2026-11-05 에 받음).
# 올리는 방법: 새 태그를 `docker pull` 하고 같은 명령으로 digest 를 다시 읽어 아래 ARG 한 곳만 바꾼 뒤 이미지 시험·스모크를 다시 돌린다. 레지스트리의 태그가 움직여도 이 digest 는 그대로다(자동으로 보안 갱신을 받지 않는 대가).
ARG NODE_IMAGE=node:24-alpine@sha256:8a32c8cf649a49915a66e81e7a609223c708d0adabf288ee3f4077d765542f85
ARG CADDY_IMAGE=caddy:2.11.7-alpine@sha256:e70b164da81ef698b3ad19af799ea6086ce6d9e48ed4079eb9fe26f6fbf14ee5
FROM ${NODE_IMAGE} AS build
WORKDIR /src
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci --ignore-scripts
COPY src ./src
COPY assets ./assets
COPY scripts/build.mjs ./scripts/build.mjs
RUN node scripts/build.mjs

# 왜 Caddy: 정적 서빙·보안 헤더·로그·종료 처리를 직접 만들지 않고 표준 도구로 한다(D111, ADR 0022). 태그 고정, 2.11.7-alpine의 digest는 ADR 0022에 적었다.
FROM ${CADDY_IMAGE}
ARG REVISION=n/a
ARG BOUNDARY_CONTRACT=v3.6.5
ARG APP_VERSION=0.1.0
# 이 영역은 model-runtime을 쓰지 않는다(해당 없음). 문진 스키마 패키지도 이미지에 넣지 않으므로 survey-schema 라벨은 n/a다(계약 3.0.1: 이미지에 실제로 들어간 패키지의 주 번호).
LABEL io.openit.service="kiosk-frontend" \
      io.openit.revision="${REVISION}" \
      io.openit.contracts.boundary="${BOUNDARY_CONTRACT}" \
      io.openit.contracts.survey-schema="n/a" \
      io.openit.app-version="${APP_VERSION}"
# 왜 /tmp: Caddy가 쓰는 설정·데이터 디렉터리(XDG)를 쓰기 가능한 곳으로 둔다. 비root 사용자라 /data, /config를 쓰지 못한다.
ENV PORT=8080 STATIC_DIR=/app/dist XDG_DATA_HOME=/tmp/caddy-data XDG_CONFIG_HOME=/tmp/caddy-config
RUN addgroup -S app && adduser -S -u 10001 -G app app
COPY --from=build /src/dist /app/dist
COPY Caddyfile /etc/caddy/Caddyfile
USER app
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:${PORT}/healthz || exit 1
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
