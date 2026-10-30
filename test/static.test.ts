import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) { const p = join(dir, n); statSync(p).isDirectory() ? walk(p, out) : out.push(p); }
  return out;
}
const SRC = ["src", "assets"].flatMap((d) => walk(d)).filter((f) => /\.(ts|html|css)$/.test(f) && !f.startsWith("src/types/")); // 생성 검증기(.cjs)는 계약 스키마의 설명 글을 담으므로 제외한다(ADR 0021)

test("소스에 저장소·쿠키·콘솔·CDN이 없고, 기기 토큰 헤더(Authorization/Bearer)는 link_public_api_send.ts에만 있다", () => {
  const bad = /localStorage|sessionStorage|document\.cookie|indexedDB|console\.|https?:\/\/(?!www\.w3\.org)/;
  assert.deepEqual(SRC.filter((f) => bad.test(readFileSync(f, "utf8"))), []);
  const auth = SRC.filter((f) => /Authorization|Bearer/i.test(readFileSync(f, "utf8")));
  assert.deepEqual(auth, ["src/components/link_public_api_send.ts"]);
});

// 왜: dist가 없을 때 건너뛰면 CI가 초록으로 보이므로 실패시킨다(ADR 0013). npm test는 pretest가 먼저 빌드한다.
test("빌드 산출물에 토큰과 외부 URL이 없다", () => {
  assert.ok(existsSync("dist"), "dist 없음: npm run build 먼저(npm test는 pretest로 자동 빌드)");
  const files = walk("dist");
  assert.ok(files.length > 0);
  // 왜: node --test를 직접 돌리면 pretest가 안 돌아 낡은 dist로 통과한다. 소스가 dist보다 새로우면 실패시킨다(ADR 0013).
  const newest = (fs: string[]) => Math.max(...fs.map((f) => statSync(f).mtimeMs));
  const srcAll = ["src", "assets"].flatMap((d) => walk(d)).concat("scripts/build.mjs");
  assert.ok(newest(srcAll) <= newest(files), "dist가 소스보다 낡았다: npm run build 먼저(npm test는 pretest로 자동 빌드)");
  for (const f of files) {
    if (f.endsWith("fonts/OFL.txt")) continue; // 라이선스 전문(문서)은 URL을 글자로 담고 있다. 불러오는 주소가 아니다(#60, OFL은 전문 동봉을 요구)
    const s = readFileSync(f, "utf8");
    assert.doesNotMatch(s, /Bearer\s+(?!\$\{)[A-Za-z0-9_.-]{6,}/i, f); // 토큰 값이 박혀 있으면 안 된다(헤더 이름만 허용)
    assert.doesNotMatch(s, /https?:\/\/(?!www\.w3\.org|push\.example)/, f);
  }
});
