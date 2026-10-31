// 대화 목록 컴포넌트(apps/kiosk/chat.ts)와 그것을 먹이는 상태 기계 이벤트의 시험.
// 컴포넌트 시험은 입력(이벤트) -> 출력(뷰 모델)만 본다. 기대값은 데모 요구(시간순, 세션 끝나면 지움)에서 나왔다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createPublicApiClient } from "../src/wiring/public_api.ts";
import { createKioskFlow } from "../src/wiring/kiosk.ts";
import { ChatLog, MAX_BUBBLES, type ConversationEvent } from "../src/components/chat_log.ts";
import { renderChat } from "../src/ui/chat_view.ts";
import { json, ok, settle, started, asStarted } from "./helpers.ts";

let JSDOM: any = null;
const mod = "jsdom";
try { ({ JSDOM } = await import(mod)); } catch { /* 호스트에 없음 */ }
const opt = { skip: JSDOM ? false : "jsdom 없음" };

test("ChatLog: 이벤트 순서대로 말풍선이 쌓이고, 같은 id와 빈 글은 무시하고, CLEAR가 지운다", () => {
  const c = new ChatLog();
  const seen: number[] = [];
  c.subscribe((v) => seen.push(v.bubbles.length));
  c.accept({ type: "SYSTEM", id: "a", text: "안녕하세요" });
  c.accept({ type: "PATIENT", id: "b", text: "배가 아파요" });
  c.accept({ type: "PATIENT", id: "b", text: "배가 아파요" }); // 재전송: 같은 turn_id
  c.accept({ type: "SYSTEM", id: "c", text: "   " });
  assert.deepEqual(c.current.bubbles.map((b) => [b.speaker, b.text]), [["system", "안녕하세요"], ["patient", "배가 아파요"]]);
  c.accept({ type: "CLEAR" });
  assert.deepEqual(c.current.bubbles, []);
  assert.deepEqual(seen, [0, 1, 2, 0]); // 구독 직후 현재값, 변화마다 한 번(무시된 이벤트는 알리지 않는다)
});

test("ChatLog: 상한을 넘으면 가장 오래된 것부터 버린다", () => {
  const c = new ChatLog();
  for (let i = 0; i < MAX_BUBBLES + 5; i++) c.accept({ type: "SYSTEM", id: `i${i}`, text: `m${i}` });
  assert.equal(c.current.bubbles.length, MAX_BUBBLES);
  assert.equal(c.current.bubbles[0].text, "m5");
});

function make(handler: (b: any) => Response, stateFn: () => any = () => ({ state: "ACTIVE", resume_text: null })) {
  const api = createPublicApiClient({ retry: { maxAttempts: 3 }, sleep: async () => {}, fetch: (async (_u: string, init: RequestInit) => {
    if (init.method === "GET") return json({ session_id: "s", ...stateFn() });
    const b = JSON.parse(init.body as string); const res = handler(b); return b.kind === "SESSION_START" ? asStarted(res) : res;
  }) as any });
  const sleepers: Array<() => void> = [];
  const flow = createKioskFlow(api, { pollMs: 2, sleep: () => new Promise<void>((r) => sleepers.push(r)) });
  const chat = new ChatLog();
  flow.subscribeConversation((e: ConversationEvent) => chat.accept(e));
  return { flow, chat, step: async () => { await settle(); sleepers.splice(0).forEach((r) => r()); await settle(); } };
}
const say = (t: string) => ({ text: t, confidence: 0.9 });
const lines = (c: ChatLog) => c.current.bubbles.map((b) => `${b.speaker}:${b.text}`);

test("흐름: 시작 응답, 환자 발화, 응답이 시간순으로 보이고 종료하면 지워진다", async () => {
  const { flow, chat } = make((b) => ok(b.kind === "SESSION_START" ? "무엇이 불편하세요?" : b.kind === "UTTERANCE" ? "언제부터요?" : null));
  await flow.start();
  assert.deepEqual(lines(chat), ["system:무엇이 불편하세요?"]);
  await flow.hear(say("배가 아파요"));
  assert.deepEqual(lines(chat), ["system:무엇이 불편하세요?", "patient:배가 아파요", "system:언제부터요?"]);
  await flow.end();
  assert.equal(flow.current.state, "ENDED");
  assert.deepEqual(chat.current.bubbles, []);
});

test("흐름: 처음 화면(reset)으로 가면 지워지고, 낮은 신뢰도 발화는 말풍선이 되지 않는다", async () => {
  const { flow, chat } = make(() => ok("질문"));
  await flow.start();
  await flow.hear({ text: "네", confidence: 0.1 }); // 서버로 보내지 않는 발화
  assert.deepEqual(lines(chat), ["system:질문"]);
  flow.reset();
  assert.deepEqual(chat.current.bubbles, []);
});

test("흐름: 재시도 소진 뒤에도 환자 말풍선은 하나이고 새 세션은 빈 대화로 시작한다", async () => {
  let down = true;
  const { flow, chat } = make((b) => b.kind === "UTTERANCE" && down ? json({ code: "UNAVAILABLE", message: "x", retryable: true }, 503) : ok("질문"));
  await flow.start();
  await flow.hear(say("머리가 아파요")); // 재시도 소진 -> 직원 호출
  assert.equal(flow.current.state, "CALL_STAFF");
  assert.equal(lines(chat).filter((l) => l.startsWith("patient:")).length, 1);
  down = false; flow.reset(); await flow.start();
  assert.deepEqual(lines(chat), ["system:질문"]); // 새 세션은 빈 대화에서 시작한다
});

test("흐름: 위험 정지 대기 뒤 재개 문장도 대화에 보인다", async () => {
  let st: any = { state: "PAUSED_RISK", resume_text: null };
  const { flow, chat, step } = make((b) => b.kind === "SESSION_START" ? started("시작") : ok("대기 안내", { session_id: "s", write_committed: "COMMITTED", staff_alert: "DELIVERED" }), () => st);
  await flow.start(); await flow.hear(say("위험해요"));
  assert.equal(flow.current.state, "WAITING_STAFF");
  assert.deepEqual(lines(chat), ["system:시작", "patient:위험해요", "system:대기 안내"]);
  st = { state: "ACTIVE", resume_text: "다시 이어서 진행합니다" };
  await step();
  assert.equal(flow.current.state, "LISTENING");
  assert.equal(lines(chat).at(-1), "system:다시 이어서 진행합니다");
});

test("화면: 말풍선 DOM은 글자로만 그리고(HTML 해석 없음) 없으면 숨긴다", opt, () => {
  const dom = new JSDOM(`<body><ol id="chat" hidden></ol></body>`);
  const doc: Document = dom.window.document;
  const ol = doc.getElementById("chat") as HTMLElement;
  renderChat(doc, ol, { bubbles: [{ speaker: "system", text: "<i>안녕</i>" }, { speaker: "patient", text: "네" }] });
  assert.equal(ol.hidden, false);
  assert.deepEqual([...ol.children].map((li) => li.className), ["system", "patient"]);
  assert.ok(ol.children[0].textContent!.includes("<i>안녕</i>"));
  assert.equal(ol.querySelectorAll("i").length, 0);
  renderChat(doc, ol, { bubbles: [] });
  assert.equal(ol.hidden, true); assert.equal(ol.children.length, 0);
});
