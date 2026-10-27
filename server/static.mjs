// 정적 파일 서버. 의존 없음. 설정은 환경 변수만(PORT, STATIC_DIR). VAPID 공개키는 서버의 GET /v1/staff/push-config로 받는다.
// /v1은 이 서버가 처리하지 않는다. 게이트웨이가 문진 서비스로 프록시한다(CR-001).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon" };
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; worker-src 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'; form-action 'self'";
// 마이크는 같은 출처만(키오스크 음성 입력), 카메라·위치·결제 등은 막는다. 감사 P15.
const PERMISSIONS = "microphone=(self), camera=(), geolocation=(), payment=(), usb=()";

export function makeStaticHandler({ dir, configFile = null }) {
  const root = resolve(dir);
  return async function handle(req, res) {
    const url = new URL(req.url, "http://x");
    const send = (code, body, type = "text/plain; charset=utf-8", extra = {}) => {
      res.writeHead(code, { "content-type": type, "cache-control": "no-store", "content-security-policy": CSP, "x-content-type-options": "nosniff", "referrer-policy": "no-referrer", "permissions-policy": PERMISSIONS, "cross-origin-opener-policy": "same-origin", "cross-origin-resource-policy": "same-origin", ...extra });
      res.end(body);
    };
    if (req.method !== "GET" && req.method !== "HEAD") return send(405, "method not allowed");
    if (url.pathname === "/healthz") return send(200, "ok");
    if (url.pathname === "/readyz") return existsSync(join(root, "index.html")) ? send(200, "ready") : send(503, "not ready");
    // 기기 설정: 운영이 마운트한 파일(CONFIG_FILE)을 /config.json으로 낸다. 새로고침해도 유지되고 브라우저 저장소를 쓰지 않는다.
    // 토큰이 들어 있을 수 있으므로 이 서버는 내용을 로그·오류 응답에 쓰지 않는다. 기기 밖에서 읽히지 않게 막는 것은 gateway 몫이다.
    if (url.pathname === "/config.json" && configFile) {
      try { return send(200, await readFile(configFile), "application/json"); } catch { return send(404, "not found"); }
    }
    if (url.pathname === "/staff") return send(301, "", "text/plain", { location: "/staff/" });
    let p = decodeURIComponent(url.pathname);
    if (p.endsWith("/")) p += "index.html";
    const file = normalize(join(root, p));
    if (!file.startsWith(root + "/")) return send(403, "forbidden");
    try {
      if (!(await stat(file)).isFile()) throw new Error();
      send(200, await readFile(file), TYPES[extname(file)] ?? "application/octet-stream");
    } catch { send(404, "not found"); }
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const handler = makeStaticHandler({ dir: process.env.STATIC_DIR ?? "dist", configFile: process.env.CONFIG_FILE || null });
  const server = createServer((req, res) => {
    res.on("finish", () => { if (req.url === "/healthz" || req.url === "/readyz") return; /* 감시 요청은 로그 양만 키운다 */ console.log(JSON.stringify({ t: new Date().toISOString(), m: req.method, path: req.url.split("?")[0], s: res.statusCode })); });
    handler(req, res).catch(() => { res.writeHead(500); res.end(); });
  });
  const port = Number(process.env.PORT ?? 8080);
  if (!Number.isInteger(port) || port < 0 || port > 65535) { console.error(JSON.stringify({ msg: "PORT는 0~65535 정수여야 합니다", got: String(process.env.PORT) })); process.exit(2); }
  server.listen(port, "0.0.0.0", () => console.log(JSON.stringify({ msg: "listening", port: server.address().port })));
  process.on("SIGTERM", () => server.close(() => process.exit(0)));
}
