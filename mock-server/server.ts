// 개발·시험 전용 정적 파일 대역(이미지에 들어가지 않는다). 모의 서버 시연, jsdom 앱 시험, 브라우저 시험이 dist를 같은 출처로 내는 데 쓴다.
// 실제 이미지의 정적 서빙은 Caddy다(Caddyfile, ADR 0022). 이 대역은 경로 규칙을 시험하지 않는다: 그건 test-image/가 실제 이미지로 한다.
// 보안 헤더는 Caddyfile의 secure_headers에서 읽어 와 브라우저 시험이 실제 CSP 아래에서 돌게 한다(헤더 목록을 두 곳에 쓰지 않는다).
import type { IncomingMessage, ServerResponse } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2" };

function secureHeaders(): Record<string, string> {
  const text = readFileSync(new URL("../Caddyfile", import.meta.url), "utf8");
  const block = text.slice(text.indexOf("(secure_headers)"), text.indexOf("\n}\n", text.indexOf("(secure_headers)")));
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/^\t\t([A-Z][A-Za-z-]+) (.+)$/gm)) out[m[1].toLowerCase()] = m[2].replace(/^"(.*)"$/, "$1");
  return out;
}

export function makeDevStatic({ dir, configFile = null }: { dir: string; configFile?: string | null }) {
  const root = resolve(dir);
  const headers = secureHeaders();
  return function handle(req: IncomingMessage, res: ServerResponse): void {
    const send = (code: number, body: string | Buffer, type = "text/plain; charset=utf-8", extra: Record<string, string> = {}) => { res.writeHead(code, { "content-type": type, ...headers, ...extra }); res.end(body); };
    const path = new URL(req.url ?? "/", "http://x").pathname;
    if (path === "/healthz") return send(200, "ok");
    if (path === "/config.json" && configFile) { try { return send(200, readFileSync(configFile), "application/json"); } catch { return send(404, "not found"); } }
    if (path === "/staff") return send(301, "", "text/plain", { location: "/staff/" });
    let p: string;
    try { p = decodeURIComponent(path); } catch { return send(400, "bad request"); }
    if (p.endsWith("/")) p += "index.html";
    const file = normalize(join(root, p));
    if (!file.startsWith(root + "/")) return send(403, "forbidden");
    try { if (!statSync(file).isFile()) throw new Error(); send(200, readFileSync(file), TYPES[extname(file)] ?? "application/octet-stream"); } catch { send(404, "not found"); }
  };
}
