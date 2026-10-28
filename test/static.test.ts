import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) { const p = join(dir, n); statSync(p).isDirectory() ? walk(p, out) : out.push(p); }
  return out;
}
const SRC = ["api", "apps", "assets"].flatMap((d) => walk(d)).filter((f) => /\.(ts|html|css)$/.test(f));

test("소스에 저장소·쿠키·콘솔·CDN이 없고, 기기 토큰 헤더(Authorization/Bearer)는 api/client.ts에만 있다", () => {
  const bad = /localStorage|sessionStorage|document\.cookie|indexedDB|console\.|https?:\/\/(?!www\.w3\.org)/;
  assert.deepEqual(SRC.filter((f) => bad.test(readFileSync(f, "utf8"))), []);
  const auth = SRC.filter((f) => /Authorization|Bearer/i.test(readFileSync(f, "utf8")));
  assert.deepEqual(auth, ["api/client.ts"]);
});

// 왜: dist가 없을 때 건너뛰면 CI가 초록으로 보이므로 실패시킨다(ADR 0013). npm test는 pretest가 먼저 빌드한다.
test("빌드 산출물에 토큰과 외부 URL이 없다", () => {
  assert.ok(existsSync("dist"), "dist 없음: npm run build 먼저(npm test는 pretest로 자동 빌드)");
  const files = walk("dist");
  assert.ok(files.length > 0);
  // 왜: node --test를 직접 돌리면 pretest가 안 돌아 낡은 dist로 통과한다. 소스가 dist보다 새로우면 실패시킨다(ADR 0013).
  const newest = (fs: string[]) => Math.max(...fs.map((f) => statSync(f).mtimeMs));
  const srcAll = ["api", "apps", "assets"].flatMap((d) => walk(d)).concat("scripts/build.mjs");
  assert.ok(newest(srcAll) <= newest(files), "dist가 소스보다 낡았다: npm run build 먼저(npm test는 pretest로 자동 빌드)");
  for (const f of files) {
    if (f.endsWith("fonts/OFL.txt")) continue; // 라이선스 전문(문서)은 URL을 글자로 담고 있다. 불러오는 주소가 아니다(#60, OFL은 전문 동봉을 요구)
    const s = readFileSync(f, "utf8");
    assert.doesNotMatch(s, /Bearer\s+(?!\$\{)[A-Za-z0-9_.-]{6,}/i, f); // 토큰 값이 박혀 있으면 안 된다(헤더 이름만 허용)
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

test("정적 서버: 보안 헤더(Permissions-Policy·COOP·CORP·CSP object-src/form-action)가 모든 응답에 붙는다", async () => {
  const { createServer } = await import("node:http");
  const { makeStaticHandler } = await import("../server/static.mjs");
  const h = makeStaticHandler({ dir: "apps/kiosk" });
  const srv = createServer((q, r) => void h(q, r));
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(srv.address() as any).port}`;
  try {
    for (const p of ["/", "/healthz", "/nope"]) {
      const r = await fetch(base + p);
      assert.match(r.headers.get("permissions-policy")!, /microphone=\(self\)/, p);
      assert.match(r.headers.get("permissions-policy")!, /camera=\(\)/, p);
      assert.equal(r.headers.get("cross-origin-opener-policy"), "same-origin", p);
      assert.equal(r.headers.get("cross-origin-resource-policy"), "same-origin", p);
      assert.match(r.headers.get("content-security-policy")!, /object-src 'none'/, p);
      assert.match(r.headers.get("content-security-policy")!, /form-action 'self'/, p);
      assert.equal(r.headers.get("x-content-type-options"), "nosniff", p);
    }
  } finally { srv.closeAllConnections(); srv.close(); }
});

test("정적 서버: CONFIG_FILE이 있으면 /config.json으로 낸다(새로고침해도 유지), 없는 파일이면 404", async () => {
  const { createServer } = await import("node:http");
  const { writeFileSync, mkdtempSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { makeStaticHandler } = await import("../server/static.mjs");
  const dir = mkdtempSync(join(tmpdir(), "kiosk-cfg-"));
  try {
    const file = join(dir, "config.json");
    writeFileSync(file, JSON.stringify({ device_token: "tok-FAKE", allow_remote_stt: false }));
    for (const [cfg, want] of [[file, 200], [join(dir, "none.json"), 404]] as const) {
      const h = makeStaticHandler({ dir: "apps/kiosk", configFile: cfg });
      const srv = createServer((q, r) => void h(q, r));
      await new Promise<void>((r) => srv.listen(0, "127.0.0.1", r));
      try {
        const r = await fetch(`http://127.0.0.1:${(srv.address() as any).port}/config.json`);
        assert.equal(r.status, want);
        if (want === 200) { assert.equal(r.headers.get("cache-control"), "no-store"); assert.equal(((await r.json()) as any).device_token, "tok-FAKE"); }
      } finally { srv.closeAllConnections(); srv.close(); }
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("정적 서버: PORT가 정수가 아니면 명확한 메시지로 종료하고, 감시 요청은 로그에 남기지 않는다", async () => {
  const { spawnSync, spawn } = await import("node:child_process");
  const bad = spawnSync(process.execPath, ["server/static.mjs"], { env: { ...process.env, PORT: "abc" }, encoding: "utf8" });
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /PORT는 0~65535 정수/);
  const child = spawn(process.execPath, ["server/static.mjs"], { env: { ...process.env, PORT: "0", STATIC_DIR: "apps/kiosk" } });
  let out = "";
  child.stdout.on("data", (d) => (out += d));
  try {
    const port = await new Promise<number>((res, rej) => { const t = setTimeout(() => rej(new Error("시작 안 됨")), 10_000); child.stdout.on("data", () => { const m = out.match(/"port":(\d+)/); if (m && Number(m[1]) > 0) { clearTimeout(t); res(Number(m[1])); } }); });
    await fetch(`http://127.0.0.1:${port}/healthz`); await fetch(`http://127.0.0.1:${port}/`);
    await new Promise((r) => setTimeout(r, 100));
    assert.doesNotMatch(out, /"path":"\/healthz"/);
    assert.match(out, /"path":"\/"/);
  } finally { child.kill(); }
});

// 왜: 잘못된 퍼센트 인코딩(%zz)은 decodeURIComponent가 예외를 낸다. 예전에는 바깥 catch가 보안 헤더 없는 500을 냈다.
test("정적 서버: 잘못된 퍼센트 인코딩은 보안 헤더가 붙은 400이다(500 아님)", async () => {
  const { createServer } = await import("node:http");
  const { makeStaticHandler } = await import("../server/static.mjs");
  const h = makeStaticHandler({ dir: "apps/kiosk" });
  const srv = createServer((q, r) => { h(q, r).catch(() => { r.writeHead(500); r.end(); }); });
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(srv.address() as any).port}`;
  try {
    for (const p of ["/%zz", "/%E0%A4%A", "/staff/%"]) {
      const r = await fetch(base + p);
      assert.equal(r.status, 400, p);
      assert.match(r.headers.get("content-security-policy")!, /default-src 'self'/, p);
      assert.equal(r.headers.get("x-content-type-options"), "nosniff", p);
    }
  } finally { srv.closeAllConnections(); srv.close(); }
});
