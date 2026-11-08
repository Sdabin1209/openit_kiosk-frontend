// 화면(DOM): 기기 설정 읽기 등으로 STARTING 이 길어지면 1초·10초 안내 문구가 실제 화면에 그려진다(ADR 0043). 가짜 시계, 실제 시간 없음(U422).
// HTML 은 소스(src/kiosk/index.html)를 직접 읽는다: dist 는 빌드 산출물이라 단일 파일 실행 때 낡을 수 있다.
// 1초·10초는 Nielsen 응답 시간 지침의 표준 값이다(wait-hint.test.ts 와 같다). jsdom 이 호스트에 없으면 건너뛴다(kiosk-app.test.ts 와 같은 방식).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createPublicApiClient } from "../src/wiring/public_api.ts";
import { createKioskFlow } from "../src/wiring/kiosk.ts";
import { ChatLog } from "../src/components/chat_log.ts";
import { MSG } from "../src/components/patient_copy.ts";
import { fakeTimers, flowTimers, settle, qsFetch, started } from "./helpers.ts";

let JSDOM: any = null;
const mod = "jsdom";
try { ({ JSDOM } = await import(mod)); } catch { /* 호스트에 없음 */ }

test("STARTING 이 길어지면 화면에 진행 표시 문구, 이어서 안내 문구가 그려진다", { skip: JSDOM ? false : "jsdom 없음" }, async () => {
  const dom = new JSDOM(readFileSync("src/kiosk/index.html", "utf8"), { url: "http://127.0.0.1/", pretendToBeVisual: true });
  const g = globalThis as any, saved = { document: g.document, window: g.window };
  g.document = dom.window.document; g.window = dom.window;
  try {
    const ft = fakeTimers();
    const api = createPublicApiClient({ timers: fakeTimers(), now: () => 0, sleep: async () => {}, retry: { maxAttempts: 1 }, fetch: qsFetch((async () => started()) as any) });
    const startValues = () => new Promise<any>(() => {}); // 설정 읽기가 끝나지 않는 상태
    const flow = createKioskFlow(api, { idleMs: 0, timers: flowTimers(ft), startValues } as any);
    const stt = { available: () => false, remote: false, recheck: async () => false, cancel() {}, listen: async () => ({ text: "", confidence: null }) } as any;
    const { mountKioskScreen } = await import("../src/ui/kiosk_screen.ts");
    mountKioskScreen({ flow, chat: new ChatLog(), stt, sttReady: Promise.resolve() });
    void flow.start(); await settle();
    const doc = dom.window.document as Document;
    const body = () => doc.getElementById("chat")!.textContent ?? "";
    assert.equal(flow.current.state, "STARTING");
    assert.equal(doc.getElementById("title")!.textContent, MSG.TITLE_WAIT.text);
    assert.ok(!body().includes(MSG.BODY_THINKING.text), "1초 전에는 안내가 없다");
    ft.advance(1_000);
    assert.ok(body().includes(MSG.BODY_THINKING.text), "1초 뒤 진행 표시 문구");
    assert.equal(doc.body.dataset.waitHint, "THINKING");
    ft.advance(9_000);
    assert.ok(body().includes(MSG.BODY_WAIT_LONGER.text), "10초 뒤 안내 문구");
    assert.equal(doc.body.dataset.waitHint, "PLEASE_WAIT");
  } finally { g.document = saved.document; g.window = saved.window; dom.window.close(); }
});
