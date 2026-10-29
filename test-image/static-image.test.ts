// 이미지(정적 서빙) 성질 시험: 실제 이미지를 Docker로 띄워 HTTP로 확인한다. 서버 구현(Node 직접 구현 -> Caddy)이 바뀌어도 같은 성질을 지켜야 한다(단위 4a).
// 고정 포트를 쓰지 않는다(Docker가 호스트 포트를 배정). IMAGE 환경 변수가 있으면 그 이미지를, 없으면 이 리포의 Dockerfile을 빌드한다.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { connect } from "node:net";
import { mkdtempSync, writeFileSync, rmSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const docker = (...a: string[]) => spawnSync("docker", a, { encoding: "utf8" });
const TAG = process.env.IMAGE ?? `kiosk-frontend:imgtest-${process.pid}`;
const started: string[] = [];
let cfgDir = "";
const CFG = JSON.stringify({ device_token: "tok-FAKE" });

function run(extra: string[] = [], env: string[] = []): { name: string; port: number; base: string } {
  const name = `kiosk-frontend-imgtest-${process.pid}-${started.length}`;
  const r = docker("run", "-d", "--name", name, "-p", "127.0.0.1::8080", ...env.flatMap((e) => ["-e", e]), ...extra, TAG);
  assert.equal(r.status, 0, r.stderr);
  started.push(name);
  const port = Number(docker("port", name, "8080/tcp").stdout.trim().split("\n")[0].split(":").pop());
  return { name, port, base: `http://127.0.0.1:${port}` };
}
async function ready(base: string) {
  for (let i = 0; i < 50; i++) { try { if ((await fetch(base + "/healthz")).ok) return; } catch { /* 아직 */ } await new Promise((r) => setTimeout(r, 200)); }
  throw new Error("healthz 응답 없음");
}
const raw = (port: number, req: string) => new Promise<string>((resolve) => {
  const s = connect(port, "127.0.0.1"); let out = "";
  s.on("data", (d) => { out += d; }); s.on("close", () => resolve(out)); s.on("error", () => resolve(out));
  s.write(req); setTimeout(() => s.destroy(), 1500);
});

let plain: { name: string; port: number; base: string };
let withCfg: { name: string; port: number; base: string };
before(async () => {
  if (!process.env.IMAGE) { const b = docker("build", "-q", "-t", TAG, "."); assert.equal(b.status, 0, b.stderr); }
  cfgDir = mkdtempSync(join(tmpdir(), "kf-img-"));
  chmodSync(cfgDir, 0o755);
  writeFileSync(join(cfgDir, "device.json"), CFG, { mode: 0o644 }); // 컨테이너 사용자(비root)가 읽을 수 있어야 한다
  plain = run();
  withCfg = run(["-v", `${cfgDir}:/cfg:ro`], ["CONFIG_FILE=/cfg/device.json"]);
  await ready(plain.base); await ready(withCfg.base);
});
after(() => { for (const n of started) docker("rm", "-f", n); if (!process.env.IMAGE) docker("rmi", "-f", TAG); if (cfgDir) rmSync(cfgDir, { recursive: true, force: true }); });

const SEC = ["content-security-policy", "x-content-type-options", "referrer-policy", "permissions-policy", "cross-origin-opener-policy", "cross-origin-resource-policy", "cache-control"];

test("/healthz 200, /readyz 200, 화면과 서비스 워커를 낸다", async () => {
  assert.equal((await fetch(plain.base + "/healthz")).status, 200);
  assert.equal((await fetch(plain.base + "/readyz")).status, 200);
  assert.match(await (await fetch(plain.base + "/")).text(), /문진/);
  assert.match(await (await fetch(plain.base + "/staff/")).text(), /직원 콘솔/);
  const sw = await fetch(plain.base + "/staff/sw.js");
  assert.equal(sw.status, 200);
  assert.match(sw.headers.get("content-type")!, /javascript/);
});

test("/staff는 /staff/로 영구 이동(301)", async () => {
  const r = await fetch(plain.base + "/staff", { redirect: "manual" });
  assert.equal(r.status, 301);
  assert.equal(new URL(r.headers.get("location")!, plain.base).pathname, "/staff/");
});

test("보안 헤더가 정상·404·405 응답에 붙고 캐시는 no-store", async () => {
  for (const [p, m, st] of [["/", "GET", 200], ["/healthz", "GET", 200], ["/nope", "GET", 404], ["/", "POST", 405]] as const) {
    const r = await fetch(plain.base + p, { method: m });
    assert.equal(r.status, st, `${m} ${p}`);
    for (const h of SEC) assert.ok(r.headers.get(h), `${m} ${p} ${h}`);
    assert.match(r.headers.get("content-security-policy")!, /default-src 'self'/);
    assert.match(r.headers.get("content-security-policy")!, /object-src 'none'/);
    assert.match(r.headers.get("content-security-policy")!, /form-action 'self'/);
    assert.match(r.headers.get("permissions-policy")!, /microphone=\(self\)/);
    assert.equal(r.headers.get("x-content-type-options"), "nosniff");
    assert.equal(r.headers.get("cache-control"), "no-store");
  }
});

test("/config.json: CONFIG_FILE이 없으면 404, 있으면 파일 내용을 application/json으로", async () => {
  assert.equal((await fetch(plain.base + "/config.json")).status, 404);
  const r = await fetch(withCfg.base + "/config.json");
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-type")!, /application\/json/);
  assert.equal(await r.text(), CFG);
  assert.equal(r.headers.get("cache-control"), "no-store");
});

test("경로 탈출은 파일을 내지 않는다", async () => {
  for (const p of ["/..%2f..%2fetc%2fpasswd", "/%2e%2e/%2e%2e/etc/passwd", "/../../etc/passwd"]) {
    const r = await raw(plain.port, `GET ${p} HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n`);
    assert.doesNotMatch(r, /root:/, p);
    assert.doesNotMatch(r, /^HTTP\/1\.1 200/, p);
  }
});

test("잘못된 퍼센트 인코딩은 400", async () => {
  for (const p of ["/%zz", "/%E0%A4%A", "/staff/%"]) {
    const r = await raw(plain.port, `GET ${p} HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n`);
    assert.match(r, /^HTTP\/1\.1 400/, p);
  }
});

// 알려진 차이(ADR 0022): 예전 Node 서버는 이 400에도 보안 헤더를 붙였다. Caddy는 Go의 HTTP 파서가 요청 줄을 거부하면 Caddy 설정이 실행되기 전에 고정 응답을 내므로
// 보안 헤더를 붙일 수 없다. 응답은 text/plain 고정 문구이고 입력을 되풀이하지 않으며 HTML이 아니라 헤더가 없어도 스크립트 실행 경로가 없다.
test("잘못된 퍼센트 인코딩 400은 고정 문구의 text/plain이고 입력을 되풀이하지 않는다", async () => {
  const r = await raw(plain.port, "GET /%zz-marker HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n");
  assert.match(r, /^HTTP\/1\.1 400/);
  assert.match(r.toLowerCase(), /content-type: text\/plain/);
  assert.doesNotMatch(r, /marker|%zz/);
});

test("STATIC_DIR에 화면이 없으면 /readyz는 503이고 /healthz는 200", async () => {
  const c = run([], ["STATIC_DIR=/nonexistent"]);
  await ready(c.base);
  assert.equal((await fetch(c.base + "/readyz")).status, 503);
  assert.equal((await fetch(c.base + "/healthz")).status, 200);
});

test("느린 클라이언트(요청을 끝내지 않는 연결)가 다른 요청을 막지 않는다", async () => {
  const slow = Array.from({ length: 20 }, () => { const s = connect(plain.port, "127.0.0.1"); s.on("error", () => {}); s.write("GET / HTTP/1.1\r\nHost: x\r\n"); return s; });
  try {
    const t = Date.now();
    assert.equal((await fetch(plain.base + "/healthz")).status, 200);
    assert.ok(Date.now() - t < 2000);
  } finally { for (const s of slow) s.destroy(); }
});

test("로그는 표준 출력 JSON 한 줄이고 /healthz는 남기지 않는다", async () => {
  const c = run(); await ready(c.base);
  await fetch(c.base + "/healthz"); await fetch(c.base + "/marker-path-xyz");
  await new Promise((r) => setTimeout(r, 500));
  const out = docker("logs", c.name); const lines = (out.stdout + out.stderr).split("\n").filter((l) => l.startsWith("{"));
  assert.ok(lines.length > 0);
  for (const l of lines) JSON.parse(l);
  const text = lines.join("\n");
  assert.match(text, /marker-path-xyz/);
  assert.doesNotMatch(text, /"uri":"\/healthz"|"path":"\/healthz"/);
});

test("SIGTERM에 5초 안에 정상 종료(코드 0)한다", () => {
  const c = run(); 
  const t = Date.now();
  const r = docker("stop", "-t", "5", c.name);
  assert.equal(r.status, 0);
  assert.ok(Date.now() - t < 5000, "SIGTERM 무시, SIGKILL까지 감");
  assert.equal(docker("inspect", "-f", "{{.State.ExitCode}}", c.name).stdout.trim(), "0");
});

test("PORT가 정수가 아니면 시작을 거부한다(비0 종료)", () => {
  const name = `kiosk-frontend-imgtest-${process.pid}-badport`;
  started.push(name);
  docker("run", "-d", "--name", name, "-e", "PORT=abc", TAG);
  let code = "";
  for (let i = 0; i < 25 && code === ""; i++) { const s = docker("inspect", "-f", "{{.State.Status}} {{.State.ExitCode}}", name).stdout.trim(); if (s.startsWith("exited")) code = s.split(" ")[1]; else spawnSync("sleep", ["0.2"]); }
  assert.ok(code !== "" && code !== "0", `종료 코드 ${code}`);
});

test("root가 아닌 사용자로 실행한다", () => {
  assert.notEqual(docker("exec", plain.name, "id", "-u").stdout.trim(), "0");
});

// 노출 선언(deploy-exposure.json, 계약 Exposure)이 이 이미지의 실제 응답과 맞는지: 인증 없음·계정 인증 경로는 GET이 열려 있고(계정 인증 자체는 게이트웨이 몫),
// 선언한 메서드 밖(POST)은 405이며, 게이트웨이 밖으로 내지 않는다고 선언한 /config.json은 설정 파일이 없으면 404다.
test("노출 선언과 실제 응답: 열린 경로 GET 200, 선언 밖 메서드 405, 닫은 /config.json은 설정 없이 404", async () => {
  const { readFileSync } = await import("node:fs");
  const ex = JSON.parse(readFileSync("deploy-exposure.json", "utf8"));
  for (const r of ex.routes.filter((r: any) => r.auth.kind !== "denied")) {
    const sample = r.paths[0].replace("/*", "/") ; // "/*" -> "/", "/staff/*" -> "/staff/"
    assert.equal((await fetch(plain.base + sample)).status, 200, `GET ${sample}`);
    for (const m of ["POST", "PUT", "PATCH", "DELETE"].filter((m) => !r.methods.includes(m))) assert.equal((await fetch(plain.base + sample, { method: m })).status, 405, `${m} ${sample}`);
  }
  assert.equal((await fetch(plain.base + "/config.json")).status, 404);
});
