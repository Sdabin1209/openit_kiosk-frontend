# syntax=docker/dockerfile:1
# 브라우저 시험용 이미지. 태그는 package.json의 playwright 버전(1.55.1)과 정확히 같아야 한다.
FROM mcr.microsoft.com/playwright:v1.55.1-noble
# 이 리포의 엔진 요구(node >=24)와 같은 메이저의 node를 쓴다(이미지 기본은 22).
COPY --from=node:24-bookworm-slim /usr/local/bin/node /usr/local/bin/node
# 스크린샷의 한글이 네모로 찍히지 않도록 한글 글꼴을 보장한다.
RUN apt-get update && apt-get install -y --no-install-recommends fonts-noto-cjk \
 && rm -rf /var/lib/apt/lists/* && fc-cache -f
RUN mkdir /work && chown pwuser:pwuser /work
USER pwuser
WORKDIR /work
COPY --chown=pwuser:pwuser package.json package-lock.json tsconfig.json ./
RUN npm ci --ignore-scripts
COPY --chown=pwuser:pwuser api ./api
COPY --chown=pwuser:pwuser apps ./apps
COPY --chown=pwuser:pwuser assets ./assets
COPY --chown=pwuser:pwuser mock-server ./mock-server
COPY --chown=pwuser:pwuser Caddyfile ./Caddyfile
COPY --chown=pwuser:pwuser scripts ./scripts
COPY --chown=pwuser:pwuser test-e2e ./test-e2e
ENV CI=1
CMD ["sh", "-c", "fc-list :lang=ko | grep -qi 'noto.*cjk' && node scripts/build.mjs && node --test --test-concurrency=1 'test-e2e/*.test.ts'"]
