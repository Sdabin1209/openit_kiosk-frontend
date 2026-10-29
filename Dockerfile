# syntax=docker/dockerfile:1
FROM node:24-alpine AS build
WORKDIR /src
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci --ignore-scripts
COPY api ./api
COPY apps ./apps
COPY assets ./assets
COPY scripts/build.mjs ./scripts/build.mjs
RUN node scripts/build.mjs

# 왜 Caddy: 정적 서빙·보안 헤더·로그·종료 처리를 직접 만들지 않고 표준 도구로 한다(D111, ADR 0022). 태그 고정, 2.11.7-alpine의 digest는 ADR 0022에 적었다.
FROM caddy:2.11.7-alpine
ARG REVISION=n/a
ARG BOUNDARY_CONTRACT=v2.3.0
ARG SURVEY_SCHEMA=1
ARG APP_VERSION=0.1.0
# 이 영역은 turn-engine, model-runtime을 쓰지 않는다(해당 없음).
LABEL io.openit.service="kiosk-frontend" \
      io.openit.revision="${REVISION}" \
      io.openit.contracts.boundary="${BOUNDARY_CONTRACT}" \
      io.openit.contracts.survey-schema="${SURVEY_SCHEMA}" \
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
