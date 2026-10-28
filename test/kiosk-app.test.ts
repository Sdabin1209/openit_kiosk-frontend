// 키오스크 앱 전체(dist/kiosk.js + 실제 index.html)를 jsdom에서 돌리는 시험. Docker 없이 호스트에서 돈다.
// 연결: jsdom 앱 -> (같은 출처 라우터) -> 정적 파일 대역 mock-server/devstatic.ts(dist, CONFIG_FILE) 와 모의 공개 API(/v1, 기기 토큰 필요).
// 확인하는 것: (1) 시작 URL 조각 없이 /config.json의 기기 토큰으로 POST /v1/sessions를 부른다. (2) 대화가 시간순 말풍선으로 보이고
// 종료하면 지워진다. (3) 저장소·쿠키에 아무것도 남지 않는다. 기대값은 PUBLIC_API.md F절(기기 토큰은 Authorization: Bearer)과 데모 요구에서 왔다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createMock } from "../mock-server/app.ts";
import { makeDevStatic } from "../mock-server/devstatic.ts";
import { waitFor } from "./helpers.ts";

let JSDOM: any = null;
const mod = "jsdom";
try { ({ JSDOM } = await import(mod)); } catch { /* 호스트에 없음 */ }
const opt = { skip: JSDOM ? false : "jsdom 없음" };
const TOKEN = "tok-FAKE-for-test";

async function rig(configFile: string | null) {
  assert.ok(existsSync("dist/kiosk.js"), "dist 없음: npm run build 먼저");
  const mock = createMock({ deviceToken: TOKEN });
  const api = mock.server.listeners("request")[0] as (...a: any[]) => void;
  const st = makeDevStatic({ dir: "dist", configFile });
  const seen: Array<{ method: string; path: string; auth: string | undefined }> = [];
  const front: Server = createServer((req, res) => {
    const path = (req.url ?? "").split("?")[0];
    seen.push({ method: req.method ?? "", path, auth: req.headers.authorization });
    if (path.startsWith("/v1/")) api(req, res); else st(req, res);
  });
  await new Promise<void>((r) => front.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(front.address() as AddressInfo).port}`;
  const dom = new JSDOM(readFileSync("dist/index.html", "utf8"), { url: base + "/", runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window as any;
  w.fetch = (u: string, init?: RequestInit) => fetch(new URL(u, base), init); // 같은 출처 fetch를 실제 서버로 잇는다
  w.AbortController = AbortController; w.AbortSignal = AbortSignal; // Node fetch는 Node의 AbortSignal만 받는다
  const doc: Document = w.document;
  w.eval(readFileSync("dist/kiosk.js", "utf8"));
  const $ = (id: string) => doc.getElementById(id) as HTMLElement;
  const bubbles = () => [...doc.querySelectorAll("#chat li")].map((li) => `${li.className}:${li.querySelector(".msg")!.textContent}`);
  const close = async () => { w.close(); front.closeAllConnections(); await new Promise<void>((r) => front.close(() => r())); mock.reset(); mock.server.closeAllConnections(); };
  return { w, doc, $, bubbles, seen, mock, close };
}
const tmpConfig = (obj: unknown) => { const d = mkdtempSync(join(tmpdir(), "kiosk-app-")); const f = join(d, "config.json"); writeFileSync(f, JSON.stringify(obj)); return { f, done: () => rmSync(d, { recursive: true, force: true }) }; };

test("조각 없이 /config.json의 기기 토큰으로 /v1/sessions를 부르고, 대화가 보이고, 종료하면 지워진다", opt, async () => {
  const cfg = tmpConfig({ device_token: TOKEN });
  const t = await rig(cfg.f);
  try {
    assert.equal(t.w.location.hash, "", "시작 URL에 조각이 없어야 한다");
    await waitFor(() => t.seen.some((s) => s.path === "/config.json"), "앱이 /config.json을 읽음");
    t.$("action").click();
    await waitFor(() => t.bubbles().length === 1, "시작 응답 말풍선");
    const start = t.seen.find((s) => s.method === "POST" && s.path === "/v1/sessions");
    assert.ok(start, "POST /v1/sessions가 나가야 한다");
    assert.equal(start!.auth, `Bearer ${TOKEN}`); // 토큰 없이 부르면 모의 서버가 401(F절)이라 CALL_STAFF가 된다
    assert.equal(t.$("title").textContent, "말씀해 주세요");
    assert.match(t.bubbles()[0], /^system:안녕하세요/);
    // 발화
    (t.$("manual-input") as HTMLInputElement).value = "머리가 아파요";
    t.$("action").click();
    await waitFor(() => t.bubbles().length === 3, "환자 발화와 응답 말풍선");
    const b = t.bubbles();
    assert.deepEqual([b[0].split(":")[0], b[1], b[2].split(":")[0]], ["system", "patient:머리가 아파요", "system"]);
    assert.equal(t.$("chat").hidden, false);
    await waitFor(() => t.$("title").textContent === "말씀해 주세요", "응답 뒤 다시 듣기 화면");
    // 저장하지 않는다
    assert.equal(t.w.localStorage.length, 0); assert.equal(t.w.sessionStorage.length, 0); assert.equal(t.w.document.cookie, "");
    // 종료하면 지운다
    t.$("secondary").click();
    await waitFor(() => t.$("title").textContent === "수고하셨습니다", "종료 화면");
    assert.deepEqual(t.bubbles(), []);
    assert.equal(t.$("chat").hidden, true);
    assert.ok(t.seen.filter((s) => s.path.startsWith("/v1/sessions")).every((s) => s.auth === `Bearer ${TOKEN}`), "모든 /v1/sessions* 요청에 기기 토큰");
  } finally { await t.close(); cfg.done(); }
});

test("기기 설정이 없으면(조각도 없음) 서버로 세션을 부르지 않고 직원 호출 화면", opt, async () => {
  const t = await rig(null);
  try {
    t.$("action").click();
    await waitFor(() => t.$("title").textContent === "직원을 불러 주세요", "직원 호출 화면");
    assert.equal(t.seen.some((s) => s.path.startsWith("/v1/")), false);
    assert.deepEqual(t.bubbles(), []);
  } finally { await t.close(); }
});
