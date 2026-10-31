import { test } from "node:test";
import assert from "node:assert/strict";
import { InterventionDeciding } from "../src/components/intervention_decision.ts";
import { ok, settle } from "./helpers.ts";

test("확인을 거절하면 보내지 않는다", async () => {
  let n = 0;
  const d = new InterventionDeciding(async () => { n++; return { response_text: null, turn_failure_signal: null }; }, async () => false, () => "t-fixed");
  assert.equal(await d.decide("a1", "s1", "END"), null);
  assert.equal(n, 0);
});

test("같은 알림의 중복 클릭은 같은 turn_id로 한 번만 간다", async () => {
  const ids: string[] = [];
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const d = new InterventionDeciding(async (_s, _d, t) => { ids.push(t); await gate; return { response_text: "이어서", turn_failure_signal: null }; }, async () => true, (() => { let i = 0; return () => `t-${++i}`; })());
  const p = [d.decide("a1", "s1", "RESUME"), d.decide("a1", "s1", "RESUME"), d.decide("a1", "s1", "RESUME")];
  await settle(); // 중복 클릭이 모두 처리 경로에 들어갈 때까지 이벤트 루프를 돌린다
  release();
  await Promise.all(p);
  assert.equal(ids.length, 1);
});

test("실패 후 다시 눌러도 같은 turn_id, 성공하면 다음엔 새 ID", async () => {
  const ids: string[] = [];
  let fail = true;
  const d = new InterventionDeciding(async (_s, _d, t) => { ids.push(t); if (fail) throw new Error("net"); return { response_text: null, turn_failure_signal: null }; }, async () => true, (() => { let i = 0; return () => `t-${++i}`; })());
  await assert.rejects(d.decide("a1", "s1", "END"));
  fail = false;
  await d.decide("a1", "s1", "END");
  assert.equal(ids[0], ids[1]);
  await d.decide("a1", "s1", "END");
  assert.notEqual(ids[1], ids[2]);
  void ok;
});

// 목적: 확인 창이 예·아니오 말고(Esc 등) 닫혀도 약속이 끝나 눌린 버튼이 잠긴 채 남지 않는다. 가짜 대화상자를 쓴다(실제 시간 없음).
import { makeConfirm } from "../src/ui/staff_screen.ts";
function fakeDialog() {
  const listeners: Array<() => void> = []; let open = false;
  const yes = { onclick: null as unknown }, no = { onclick: null as unknown }, text = { textContent: "" as string | null };
  const dlg = { showModal() { open = true; }, close() { if (open) { open = false; queueMicrotask(() => listeners.splice(0).forEach((f) => f())); } }, addEventListener(_t: "close", f: () => void) { listeners.push(f); } };
  return { dlg, yes, no, text, esc: () => dlg.close() };
}
test("확인 창: 예는 true, 아니오는 false, Esc로 닫으면 false로 끝난다(끝나지 않는 약속을 남기지 않음)", async () => {
  const a = fakeDialog(); const ask = makeConfirm(a.dlg, a.text, a.yes, a.no);
  const p1 = ask("계속?"); assert.equal(a.text.textContent, "계속?"); (a.yes.onclick as () => void)(); assert.equal(await p1, true);
  const b = fakeDialog(); const p2 = makeConfirm(b.dlg, b.text, b.yes, b.no)("계속?"); (b.no.onclick as () => void)(); assert.equal(await p2, false);
  const c = fakeDialog(); const p3 = makeConfirm(c.dlg, c.text, c.yes, c.no)("계속?"); c.esc(); assert.equal(await p3, false);
});
