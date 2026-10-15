// 정적 파일 서버. 의존 없음. 설정은 환경 변수만(PORT, STATIC_DIR). VAPID 공개키는 서버의 GET /v1/staff/push-config로 받는다.
// /v1은 이 서버가 처리하지 않는다. 게이트웨이가 문진 서비스로 프록시한다(CR-001).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon" };
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; worker-src 'self'; base-uri 'none'; frame-ancestors 'none'";

export function makeStaticHandler({ dir }) {
  const root = resolve(dir);
  return async function handle(req, res) {
    const url = new URL(req.url, "http://x");
    const send = (code, body, type = "text/plain; charset=utf-8", extra = {}) => {
      res.writeHead(code, { "content-type": type, "cache-control": "no-store", "content-security-policy": CSP, "x-content-type-options": "nosniff", "referrer-policy": "no-referrer", ...extra });
      res.end(body);
    };
    if (req.method !== "GET" && req.method !== "HEAD") return send(405, "method not allowed");
    if (url.pathname === "/healthz") return send(200, "ok");
    if (url.pathname === "/readyz") return existsSync(join(root, "index.html")) ? send(200, "ready") : send(503, "not ready");
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
  const handler = makeStaticHandler({ dir: process.env.STATIC_DIR ?? "dist" });
  const server = createServer((req, res) => {
    res.on("finish", () => console.log(JSON.stringify({ t: new Date().toISOString(), m: req.method, path: req.url.split("?")[0], s: res.statusCode })));
    handler(req, res).catch(() => { res.writeHead(500); res.end(); });
  });
  const port = Number(process.env.PORT ?? 8080);
  server.listen(port, "0.0.0.0", () => console.log(JSON.stringify({ msg: "listening", port })));
  process.on("SIGTERM", () => server.close(() => process.exit(0)));
}
