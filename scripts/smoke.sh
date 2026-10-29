#!/usr/bin/env bash
# 이미지를 빌드해 띄우고 /healthz, /readyz, 화면, 라벨, non-root를 확인한다.
# 고정 포트를 쓰지 않는다: Docker가 호스트 포트를 배정한다(-p 127.0.0.1::8080).
set -euo pipefail
cd "$(dirname "$0")/.."
# 표준 docker만 쓴다. 실행 파일 이름은 DOCKER 환경 변수로만 바꿀 수 있다.
DOCKER="${DOCKER:-docker}"
if ! command -v "$DOCKER" >/dev/null 2>&1; then
  echo "오류: '$DOCKER' 명령을 찾을 수 없습니다. Docker를 설치하거나 DOCKER 환경 변수에 실행 파일 이름을 지정하세요." >&2
  exit 1
fi
if ! "$DOCKER" info >/dev/null 2>&1; then
  echo "오류: Docker 데몬에 연결할 수 없습니다. 데몬이 실행 중인지, 현재 사용자에게 접근 권한이 있는지 확인하세요." >&2
  exit 1
fi
NAME=kiosk-frontend
TAG="$NAME:smoke-$$"
CTR="$NAME-smoke-$$"
REV="$(git rev-parse --short HEAD 2>/dev/null || echo n/a)"
cleanup() { "$DOCKER" rm -f "$CTR" >/dev/null 2>&1 || true; "$DOCKER" rmi -f "$TAG" >/dev/null 2>&1 || true; }
trap cleanup EXIT

"$DOCKER" build -q -t "$TAG" --build-arg "REVISION=$REV" .
"$DOCKER" run -d --name "$CTR" -p 127.0.0.1::8080 "$TAG" >/dev/null
HOSTPORT="$("$DOCKER" port "$CTR" 8080/tcp | head -1 | tr -d '\r' | sed 's/.*://')"
echo "host port: $HOSTPORT"

fail() { echo "SMOKE FAIL: $*"; "$DOCKER" logs "$CTR" 2>&1 | tail -20; exit 1; }
for i in $(seq 1 30); do
  curl -fsS "http://127.0.0.1:$HOSTPORT/healthz" >/dev/null 2>&1 && break
  [ "$i" = 30 ] && fail "/healthz 응답 없음"
  sleep 1
done
curl -fsS "http://127.0.0.1:$HOSTPORT/readyz" >/dev/null || fail "/readyz"
curl -fsS "http://127.0.0.1:$HOSTPORT/" | grep -q "문진" || fail "키오스크 화면"
curl -fsS "http://127.0.0.1:$HOSTPORT/staff/" | grep -q "직원 콘솔" || fail "직원 콘솔 화면"
curl -fsS "http://127.0.0.1:$HOSTPORT/staff/sw.js" >/dev/null || fail "sw.js"

USER_ID="$("$DOCKER" exec "$CTR" id -u | tr -d '\r')"
[ "$USER_ID" != "0" ] || fail "root로 실행 중"
for k in io.openit.service io.openit.revision io.openit.contracts.boundary io.openit.contracts.survey-schema; do
  V="$("$DOCKER" inspect -f "{{ index .Config.Labels \"$k\" }}" "$TAG" | tr -d '\r')"
  [ -n "$V" ] || fail "라벨 $k 없음"
  echo "label $k=$V"
done
# CR-D29: 이미지의 app-version 라벨이 package.json version과 같아야 한다(deploy는 APP_VERSION을 넘기지 않아 Dockerfile 기본값이 라벨이 된다).
PKG_VER="$(node -p "require('./package.json').version")"
IMG_VER="$("$DOCKER" inspect -f '{{ index .Config.Labels "io.openit.app-version" }}' "$TAG" | tr -d '\r')"
[ "$IMG_VER" = "$PKG_VER" ] || fail "라벨 io.openit.app-version=$IMG_VER 이 package.json version=$PKG_VER 과 다르다(Dockerfile ARG APP_VERSION을 맞추세요)"
echo "label io.openit.app-version=$IMG_VER (package.json과 같음)"
"$DOCKER" logs "$CTR" 2>&1 | grep -q '"uri"' || fail "표준 출력 로그 없음"
echo "SMOKE OK (uid=$USER_ID)"
