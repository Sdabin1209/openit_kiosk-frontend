// 직원 콘솔 기록 보기의 DOM 단언. jsdom은 devDependency이고 컨테이너(npm run test:dom)에서 돈다.
// 호스트에 jsdom이 없으면 이 파일은 건너뛴다(통과로 세지 않는다).
import { test } from "node:test";
import assert from "node:assert/strict";
import { ApiError } from "../api/errors.ts";
import type { StaffSessionView } from "../api/types.ts";
import { createRecordViewer } from "../apps/staff/record.ts";

let JSDOM: any = null;
const mod = "jsdom"; // 문자열로 import: 호스트 typecheck가 jsdom 없이도 통과한다
try { ({ JSDOM } = await import(mod)); } catch { /* 호스트에 없음 */ }
const opt = { skip: JSDOM ? false : "jsdom 없음(npm run test:dom으로 컨테이너에서 실행)" };

const view = (o: Partial<StaffSessionView> = {}): StaffSessionView => ({
  session_id: "s1", status: "PAUSED_RISK", release_id: "rel-1", subject_ref: "pt:abc/1", created_at: "2026-01-01T00:00:00Z",
  turns: [
    { turn_index: 1, turn_id: "t2", at: "2026-01-01T00:00:10Z", utterance: "가짜 증상 <b>문장</b>", response_text: "언제부터인가요?", action: "ASK_NEXT" },
    { turn_index: 0, turn_id: "t1", at: "2026-01-01T00:00:01Z", utterance: null, response_text: "안녕하세요", action: "SESSION_START" },
  ],
  values: [{ key: "chief", value: "두통", status: "CONFIRMED", precision: "EXACT" }, { key: "age", value: { n: 3 }, status: "DRAFT", precision: "APPROX" }],
  alerts: [{ alert_id: "a1", kind: "RISK", status: "OPEN", created_at: "2026-01-01T00:00:09Z", rule_id: "rule-7", resolved_by: null }, { alert_id: "a2", kind: "CALL_STAFF", status: "RESOLVED", created_at: "2026-01-01T00:00:20Z", rule_id: null, resolved_by: "staff-7" }],
  ...o,
});
function setup(fetchSession: (id: string) => Promise<StaffSessionView>, decide: (a: string, s: string, d: any) => Promise<boolean> = async () => true) {
  const dom = new JSDOM(`<body><button id="op">기록 보기</button><dialog id="record"></dialog></body>`);
  const doc: Document = dom.window.document;
  const dialog = doc.getElementById("record") as HTMLDialogElement;
  const v = createRecordViewer({ doc, dialog, fetchSession, decide });
  const text = (sel: string) => [...doc.querySelectorAll(sel)].map((e) => e.textContent);
  return { doc, dialog, v, text, op: doc.getElementById("op") as HTMLElement };
}

test("대화와 값과 알림이 렌더되고 발화는 시간순, HTML은 글자로만 보인다", opt, async () => {
  const { doc, v, text } = setup(async () => view());
  await v.open("s1");
  assert.match(doc.getElementById("record-title")!.textContent!, /s1/);
  const info = text("dl.info dd");
  assert.deepEqual(info, ["PAUSED_RISK", "2026-01-01T00:00:00Z", "rel-1", "pt:abc/1"]);
  const bubbles = [...doc.querySelectorAll("ol.chat li")];
  assert.equal(bubbles.length, 3); // 시스템(0), 환자(1), 시스템(1)
  assert.ok(bubbles[0].classList.contains("system") && bubbles[0].textContent!.includes("안녕하세요"));
  assert.ok(bubbles[1].classList.contains("patient") && bubbles[1].textContent!.includes("<b>문장</b>"));
  assert.equal(doc.querySelectorAll("#record b").length, 0, "발화의 태그가 해석되면 안 된다");
  const rows = [...doc.querySelectorAll('table[aria-label="저장된 값"] tbody tr')].map((r) => [...r.children].map((c) => c.textContent));
  assert.deepEqual(rows, [["chief", "두통", "CONFIRMED", "EXACT"], ["age", '{"n":3}', "DRAFT", "APPROX"]]);
  const alerts = [...doc.querySelectorAll('table[aria-label="이 세션의 알림"] tbody tr')].map((r) => [...r.children].map((c) => c.textContent));
  assert.deepEqual(alerts.map((r) => [r[0], r[3], r[4]]), [["RISK", "rule-7", "(없음)"], ["CALL_STAFF", "-", "staff-7"]]); // 해결한 직원 열
});

test("turns·values·alerts가 비면 안내 문구, release_id가 null이면 '(없음)'", opt, async () => {
  const { doc, v } = setup(async () => view({ turns: [], values: [], alerts: [], release_id: null, subject_ref: null }));
  await v.open("s1");
  const t = doc.getElementById("record-body")!.textContent!;
  assert.ok(t.includes("대화 기록이 없습니다.") && t.includes("저장된 값이 없습니다.") && t.includes("알림이 없습니다.") && t.includes("(없음)"));
  assert.equal(doc.querySelectorAll("table").length, 0);
});

test("turn의 null 필드(발화·응답·action)와 value null을 견딘다", opt, async () => {
  const { doc, v } = setup(async () => view({
    turns: [{ turn_index: 0, turn_id: "t", at: "x", utterance: null, response_text: null, action: null }],
    values: [{ key: "k", value: null, status: "s", precision: "p" }], alerts: [],
  }));
  await v.open("s1");
  assert.equal(doc.querySelectorAll("ol.chat li").length, 1);
  assert.ok(doc.getElementById("record-body")!.textContent!.includes("(내용 없음)"));
  assert.ok(doc.querySelector("td:nth-child(2)")!.textContent === "(없음)");
});

test("404·권한·네트워크 오류는 각각 다른 문구이고 내용을 싣지 않는다", opt, async () => {
  const cases: [unknown, RegExp][] = [
    [new ApiError(404, null), /찾을 수 없습니다/],
    [new ApiError(401, null), /권한|로그인/],
    [new ApiError(403, null), /권한|로그인/],
    [new Error("fetch failed"), /연결하지 못했습니다/],
  ];
  for (const [err, re] of cases) {
    const { doc, v } = setup(async () => { throw err; });
    await v.open("s1");
    const msg = doc.getElementById("record-status")!.textContent!;
    assert.match(msg, re);
    assert.ok(!msg.includes("fetch failed"));
    assert.ok(doc.querySelector("#record-body button"), "다시 시도 버튼");
  }
});

test("닫으면 내용(발화)이 DOM에서 지워지고 초점이 열었던 버튼으로 돌아간다", opt, async () => {
  const { doc, dialog, v, op } = setup(async () => view());
  await v.open("s1", op);
  assert.ok(dialog.textContent!.includes("두통"));
  (doc.getElementById("record-close") as HTMLButtonElement).click();
  assert.equal(dialog.textContent, "");
  assert.equal(doc.activeElement, op);
});

test("늦게 온 응답은 다른 세션 화면을 덮지 않는다", opt, async () => {
  let rel!: (v: StaffSessionView) => void;
  const slow = new Promise<StaffSessionView>((r) => (rel = r));
  let n = 0;
  const { doc, v } = setup(() => (n++ === 0 ? slow : Promise.resolve(view({ session_id: "s2", release_id: "rel-2" }))));
  const p1 = v.open("s1");
  await v.open("s2");
  rel(view({ release_id: "rel-OLD" }));
  await p1;
  assert.ok(doc.getElementById("record-body")!.textContent!.includes("rel-2"));
  assert.ok(!doc.getElementById("record-body")!.textContent!.includes("rel-OLD"));
});

test("열린 알림마다 결정 버튼이 있고, 결정은 decide 콜백(확인 단계 포함)을 거친 뒤 다시 불러온다", opt, async () => {
  const calls: string[] = []; let loads = 0;
  const { doc, v } = setup(async () => { loads++; return view(); }, async (a, s, d) => { calls.push(`${a}:${s}:${d}`); return true; });
  await v.open("s1");
  const btns = [...doc.querySelectorAll('[aria-label="개입 결정"] button')] as HTMLButtonElement[];
  assert.deepEqual(btns.map((b) => b.textContent), ["이어서 진행", "종료"]); // a1(OPEN)만
  btns[0].click();
  await new Promise((r) => setTimeout(r, 10));
  assert.deepEqual(calls, ["a1:s1:RESUME"]);
  assert.equal(loads, 2);
  // 거절(확인에서 취소)이면 다시 불러오지 않는다
  const r2 = setup(async () => { loads++; return view(); }, async () => false);
  await r2.v.open("s1"); loads = 0;
  (r2.doc.querySelector('[aria-label="개입 결정"] button') as HTMLButtonElement).click();
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(loads, 0);
});

test("환자 참조와 해결한 직원: 값이 없으면 '(없음)', HTML은 글자로만 보인다", opt, async () => {
  const { doc, v, text } = setup(async () => view({ subject_ref: null, alerts: [{ alert_id: "a1", kind: "RISK", status: "OPEN", created_at: "x", rule_id: null, resolved_by: null }, { alert_id: "a2", kind: "RISK", status: "RESOLVED", created_at: "y", rule_id: null, resolved_by: "<i>staff-1</i>" }] }));
  await v.open("s1");
  assert.deepEqual(text("dl.info dt").slice(-1), ["환자 참조"]);
  assert.deepEqual(text("dl.info dd").slice(-1), ["(없음)"]);
  const rows = [...doc.querySelectorAll('table[aria-label="이 세션의 알림"] tbody tr')].map((r) => r.lastElementChild!.textContent);
  assert.deepEqual(rows, ["(없음)", "<i>staff-1</i>"]);
  assert.equal(doc.querySelectorAll("#record i").length, 0);
});
