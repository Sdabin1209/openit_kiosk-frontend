import { test } from "node:test";
import assert from "node:assert/strict";
import { InterventionDeciding } from "../apps/staff/decide.ts";
import { ok, settle } from "./helpers.ts";

test("확인을 거절하면 보내지 않는다", async () => {
  let n = 0;
  const d = new InterventionDeciding(async () => { n++; return { response_text: null, turn_failure_signal: null }; }, async () => false);
  assert.equal(await d.decide("a1", "s1", "END"), null);
  assert.equal(n, 0);
});

test("같은 알림의 중복 클릭은 같은 turn_id로 한 번만 간다", async () => {
  const ids: string[] = [];
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const d = new InterventionDeciding(async (_s, _d, t) => { ids.push(t); await gate; return { response_text: "이어서", turn_failure_signal: null }; }, async () => true);
  const p = [d.decide("a1", "s1", "RESUME"), d.decide("a1", "s1", "RESUME"), d.decide("a1", "s1", "RESUME")];
  await settle(); // 중복 클릭이 모두 처리 경로에 들어갈 때까지 이벤트 루프를 돌린다
  release();
  await Promise.all(p);
  assert.equal(ids.length, 1);
});

test("실패 후 다시 눌러도 같은 turn_id, 성공하면 다음엔 새 ID", async () => {
  const ids: string[] = [];
  let fail = true;
  const d = new InterventionDeciding(async (_s, _d, t) => { ids.push(t); if (fail) throw new Error("net"); return { response_text: null, turn_failure_signal: null }; }, async () => true);
  await assert.rejects(d.decide("a1", "s1", "END"));
  fail = false;
  await d.decide("a1", "s1", "END");
  assert.equal(ids[0], ids[1]);
  await d.decide("a1", "s1", "END");
  assert.notEqual(ids[1], ids[2]);
  void ok;
});
