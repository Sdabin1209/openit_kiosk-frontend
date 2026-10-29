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

async function rig(configFile: string | null, gateway = false) {
  assert.ok(existsSync("dist/kiosk.js"), "dist 없음: npm run build 먼저");
  const mock = createMock(gateway ? { gatewayDevice: true } : { deviceToken: TOKEN });
  const api = mock.server.listeners("request")[0] as (...a: any[]) => void;
  const st = makeDevStatic({ dir: "dist", configFile });
  const seen: Array<{ method: string; path: string; auth: string | undefined }> = [];
  const front: Server = createServer((req, res) => {
    const path = (req.url ?? "").split("?")[0];
    seen.push({ method: req.method ?? "", path, auth: req.headers.authorization });
    if (gateway) req.headers["x-openit-device"] = "kiosk-01"; // 게이트웨이 흉내(mTLS): 인증된 기기 ID를 붙인다
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
  const bubbles = () => [...doc.querySelectorAll("#chat li:not(.status)")].map((li) => `${li.className}:${li.querySelector(".msg")!.textContent}`);
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

test("기기 설정도 토큰도 없이(2.3.0 mTLS) 게이트웨이를 거치면 세션이 시작되고 요청에 Authorization이 없다", opt, async () => {
  const t = await rig(null, true);
  try {
    t.$("action").click();
    await waitFor(() => t.bubbles().length === 1, "시작 응답 말풍선");
    assert.equal(t.$("title").textContent, "말씀해 주세요");
    const reqs = t.seen.filter((s) => s.path.startsWith("/v1/sessions"));
    assert.ok(reqs.length > 0 && reqs.every((s) => s.auth === undefined), "기기 자격을 보내지 않는다");
    (t.$("manual-input") as HTMLInputElement).value = "머리가 아파요";
    t.$("action").click();
    await waitFor(() => t.bubbles().length === 3, "발화와 응답");
    await waitFor(() => t.$("title").textContent === "말씀해 주세요", "응답 뒤 다시 듣기 화면");
    t.$("secondary").click();
    await waitFor(() => t.$("title").textContent === "수고하셨습니다", "종료 화면");
  } finally { await t.close(); }
});

// 대화형 UI(ADR 0023): 화면의 중심은 대화 스레드이고, 현재 질문은 스레드의 마지막 시스템 말풍선이며, 입력은 아래 고정 영역에 있다.
test("대화 스레드: 시간순으로 쌓이고, 마지막 시스템 말풍선이 현재 질문(#text)이며 같은 글이 두 번 보이지 않고, 입력은 스레드 밖 아래 영역에 있다", opt, async () => {
  const cfg = tmpConfig({ device_token: TOKEN });
  const t = await rig(cfg.f);
  try {
    await waitFor(() => t.seen.some((s) => s.path === "/config.json"), "앱이 /config.json을 읽음");
    t.$("action").click();
    await waitFor(() => t.bubbles().length === 1, "시작 인사가 첫 말풍선");
    for (const [i, say] of ["머리가 아파요", "어제부터요"].entries()) {
      (t.$("manual-input") as HTMLInputElement).value = say;
      t.$("action").click();
      await waitFor(() => t.bubbles().length === 3 + 2 * i, `${i + 1}번째 발화와 응답`);
      await waitFor(() => t.$("title").textContent === "말씀해 주세요", "다시 듣기 화면");
    }
    const lis = [...t.doc.querySelectorAll("#chat li:not(.status)")] as HTMLElement[];
    assert.deepEqual(lis.map((li) => li.className.split(" ")[0]), ["system", "patient", "system", "patient", "system"]);
    assert.deepEqual(lis.filter((li) => li.className.startsWith("patient")).map((li) => li.querySelector(".msg")!.textContent), ["머리가 아파요", "어제부터요"]);
    const last = lis[lis.length - 1];
    assert.ok(last.className.startsWith("system"), "마지막이 시스템 말");
    assert.equal(t.$("text").closest("li"), last, "현재 질문(#text)은 마지막 시스템 말풍선이다");
    assert.equal(t.$("text").closest("#chat")?.id, "chat");
    const sentence = last.querySelector(".msg")!.textContent!;
    const same = [...t.doc.querySelectorAll("body *")].filter((e) => e.children.length === 0 && e.textContent === sentence);
    assert.equal(same.length, 1, "같은 글이 화면에 두 번 있으면 안 된다");
    assert.equal(t.$("chat").getAttribute("role"), "log", "새 시스템 말을 읽어 주는 영역");
    assert.equal(t.$("chat").getAttribute("aria-live"), "polite");
    for (const id of ["action", "secondary", "manual-input"]) assert.equal(t.$(id).closest("#chat"), null, id + "은 스레드 밖");
    assert.equal(t.$("action").closest("footer")?.id, "controls", "입력은 아래 고정 영역");
  } finally { await t.close(); cfg.done(); }
});
