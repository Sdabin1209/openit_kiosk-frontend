#!/usr/bin/env bash
# 왜: 영역 환경 준비의 정본은 이 파일 하나다. 새 머신으로 옮길 때 README마다 설치법이 달라 어긋났고,
# deploy가 모든 영역의 이 스크립트를 같은 모양으로 차례로 부르게 하려고 한 곳으로 모았다. 비밀 값은 다루지 않는다.
set -euo pipefail

# 왜: 어느 폴더에서 불러도 같은 결과여야 하므로 자기 위치(리포 루트)로 이동한다.
cd "$(dirname "${BASH_SOURCE[0]}")/.."

fail() { echo "setup-env: 실패: $*" >&2; exit 1; }

command -v node >/dev/null 2>&1 || fail "node가 없습니다. package.json의 engines.node 요구를 만족하는 Node를 설치하세요."
command -v npm  >/dev/null 2>&1 || fail "npm이 없습니다. Node와 함께 npm을 설치하세요."
[ -f package-lock.json ] || fail "package-lock.json이 없습니다(npm ci는 잠금 파일이 필요합니다)."

# 왜: 요구 버전의 정본은 package.json이다. 스크립트에 숫자를 적지 않고 거기서 읽어 비교한다.
node -e '
const need = require("./package.json").engines?.node;
if (!need) process.exit(0);
const m = need.trim().match(/^>=\s*v?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/);
if (!m) { console.error("engines.node 형식을 이 스크립트가 해석하지 못합니다: " + need); process.exit(2); }
const want = [m[1], m[2] ?? 0, m[3] ?? 0].map(Number);
const have = process.versions.node.split(".").map(Number);
for (let i = 0; i < 3; i++) {
  if (have[i] > want[i]) process.exit(0);
  if (have[i] < want[i]) { console.error("Node " + process.versions.node + "는 engines.node(" + need + ") 요구에 맞지 않습니다."); process.exit(1); }
}
' || fail "Node 버전 점검에 실패했습니다(위 이유 참고)."

# 왜: 일시적 네트워크 오류는 흔하므로 한 번만 재시도한다. 그래도 실패하면 숨기지 않고 비0으로 끝낸다.
install() { npm ci --no-audit --no-fund; }
if ! install; then
  echo "setup-env: npm ci 실패, 5초 뒤 한 번 재시도합니다(네트워크 일시 오류 가능)." >&2
  sleep 5
  install || fail "npm ci가 재시도 후에도 실패했습니다(네트워크 또는 package-lock.json 불일치 확인)."
fi

echo "setup-env: OK (의존 설치 완료)"
