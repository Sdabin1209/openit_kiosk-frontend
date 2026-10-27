# syntax=docker/dockerfile:1
FROM node:24-alpine AS build
WORKDIR /src
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci --ignore-scripts
COPY api ./api
COPY apps ./apps
COPY scripts/build.mjs ./scripts/build.mjs
RUN node scripts/build.mjs

FROM node:24-alpine
ARG REVISION=unknown
ARG BOUNDARY_CONTRACT=v2.0.2
ARG SURVEY_SCHEMA=1
ARG APP_VERSION=0.1.0
# 이 영역은 turn-engine, model-runtime을 쓰지 않는다(해당 없음).
LABEL io.openit.service="kiosk-frontend" \
      io.openit.revision="${REVISION}" \
      io.openit.contracts.boundary="${BOUNDARY_CONTRACT}" \
      io.openit.contracts.survey-schema="${SURVEY_SCHEMA}" \
      io.openit.app-version="${APP_VERSION}"
ENV NODE_ENV=production PORT=8080 STATIC_DIR=/app/dist
WORKDIR /app
COPY --from=build /src/dist ./dist
COPY server/static.mjs ./server/static.mjs
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
CMD ["node", "server/static.mjs"]
