#!/usr/bin/env bash
# 브라우저 시험을 Playwright 공식 이미지 안에서 돌린다. 호스트 전제는 Docker 하나다.
# 컨테이너 안에서 빌드·모의 서버(빈 포트)·헤드리스 Chromium이 돈다. 호스트 포트를 열지 않는다.
set -euo pipefail
cd "$(dirname "$0")/.."
DOCKER="${DOCKER:-docker}"
if ! command -v "$DOCKER" >/dev/null 2>&1; then
  echo "FAIL: 전제 미충족: '$DOCKER' 명령이 없습니다. Docker를 설치하세요." >&2; exit 1
fi
if ! "$DOCKER" info >/dev/null 2>&1; then
  echo "FAIL: 전제 미충족: Docker 데몬에 연결할 수 없습니다. 데몬이 실행 중인지, 현재 사용자에게 접근 권한이 있는지 확인하세요." >&2; exit 1
fi
TAG="kiosk-frontend-e2e:$$"
CTR="kiosk-frontend-e2e-$$"
cleanup() { "$DOCKER" rm -f "$CTR" >/dev/null 2>&1 || true; "$DOCKER" rmi -f "$TAG" >/dev/null 2>&1 || true; }
trap cleanup EXIT
"$DOCKER" build -q -f test-e2e/Dockerfile -t "$TAG" . >/dev/null
rc=0
# --ipc=host: Playwright 문서가 Chromium 메모리 부족 방지로 권장. 이미지는 non-root(pwuser)로 실행한다.
"$DOCKER" run --name "$CTR" --init --ipc=host "$TAG" || rc=$?
rm -rf e2e-artifacts && mkdir -p e2e-artifacts
"$DOCKER" cp "$CTR:/work/e2e-artifacts/." e2e-artifacts/ >/dev/null 2>&1 || true
echo "스크린샷: e2e-artifacts/ ($(ls e2e-artifacts | wc -l)개), 종료 코드 $rc"
exit "$rc"
