import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) { const p = join(dir, n); statSync(p).isDirectory() ? walk(p, out) : out.push(p); }
  return out;
}
const SRC = ["api", "apps"].flatMap((d) => walk(d)).filter((f) => /\.(ts|html|css)$/.test(f));

test("소스에 저장소·쿠키·콘솔·토큰·CDN이 없다", () => {
  const bad = /localStorage|sessionStorage|document\.cookie|indexedDB|console\.|Authorization|Bearer|https?:\/\/(?!www\.w3\.org)/;
  const hits = SRC.filter((f) => bad.test(readFileSync(f, "utf8")));
  assert.deepEqual(hits, []);
});

test("빌드 산출물에 토큰과 외부 URL이 없다", { skip: !existsSync("dist") && "먼저 npm run build" }, () => {
  const files = walk("dist");
  assert.ok(files.length > 0);
  for (const f of files) {
    const s = readFileSync(f, "utf8");
    assert.doesNotMatch(s, /Authorization|Bearer/i, f);
    assert.doesNotMatch(s, /https?:\/\/(?!www\.w3\.org|push\.example)/, f);
  }
});

test("정적 서버: healthz, readyz, config.json, 경로 탈출 차단", async () => {
  const { createServer } = await import("node:http");
  const { makeStaticHandler } = await import("../server/static.mjs");
  const h = makeStaticHandler({ dir: "apps/kiosk" });
  const srv = createServer((q, r) => void h(q, r));
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(srv.address() as any).port}`;
  try {
    assert.equal((await fetch(base + "/healthz")).status, 200);
    assert.equal((await fetch(base + "/readyz")).status, 200);
    assert.equal((await fetch(base + "/config.json")).status, 404); // 공개키는 /v1/staff/push-config
    assert.equal((await fetch(base + "/")).status, 200);
    assert.equal((await fetch(base + "/..%2f..%2fpackage.json")).status, 403);
  } finally { srv.closeAllConnections(); srv.close(); }
});
