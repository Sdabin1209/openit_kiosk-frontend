#!/usr/bin/env bash
# jsdom DOM 시험을 node 컨테이너 안에서 돌린다(호스트에 jsdom을 설치하지 않는다). 리포는 읽기 전용으로 마운트하고 컨테이너 안에 복사해 npm ci 한다.
set -euo pipefail
cd "$(dirname "$0")/.."
DOCKER="${DOCKER:-docker}"
"$DOCKER" run --rm --init -v "$PWD":/src:ro node:24-bookworm-slim bash -c '
set -e
mkdir /work && cd /src && tar cf - --exclude=node_modules --exclude=dist --exclude=.git --exclude=e2e-artifacts . | tar xf - -C /work
cd /work && npm ci --ignore-scripts --no-audit --no-fund >/dev/null 2>&1
node --test test/staffview.test.ts'
