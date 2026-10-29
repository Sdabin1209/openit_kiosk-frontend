#!/usr/bin/env bash
# 영역 빌드 진입점(계약 2.5.0 BuildImageRequest/BuildImageResult, OPEN_GAPS U42, ADR 0026).
# 사용: bash scripts/build-image.sh <요청 JSON 파일>. 결과 JSON은 표준 출력 마지막 줄, 진행 기록은 표준 오류.
# 왜 얇은 래퍼: 검증·docker 호출·결과 조립은 Node(scripts/build-image.mjs)가 하고(계약 검증기가 Node 생성물이다), 계약이 정한 호출 형태만 bash로 맞춘다.
set -euo pipefail
[ "$#" -eq 1 ] || { echo "사용: bash scripts/build-image.sh <요청 JSON 파일>" >&2; exit 2; }
exec node "$(dirname "$0")/build-image.mjs" "$1"
