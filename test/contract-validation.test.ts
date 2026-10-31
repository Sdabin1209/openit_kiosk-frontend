// 계약(boundary-contracts)에 승격된 이 영역 경계 스키마를 코드가 실제로 쓰는지 확인한다(D107, MANIFEST kiosk-frontend).
// 기대값은 계약의 examples(통과)와 conformance/examples_invalid(거부)에서 온다. 복사본은 두지 않고 읽는다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { contractJson, contractList } from "../scripts/contract-source.mjs";
import { loadKioskStart } from "../src/wiring/kiosk.ts";
import { pushNotification } from "../src/components/push_notification.ts";
import { DeviceConfig as validateDeviceConfig, KioskStartFragment as validateKioskStartFragment, StaffPushPayload as validateStaffPushPayload } from "../src/types/validators.gen.cjs";

const ex = (dir: string, name: string) => contractJson(`${dir}/${name}.json`); // 고정 태그의 내용(ADR 0027)
const names = (dir: string, prefix: string) => contractList(dir).filter((f) => f.startsWith(prefix + ".")).map((f) => f.replace(/\.json$/, ""));
const win = (hash = "") => ({ location: { hash, pathname: "/", search: "" }, history: { replaceState() {} } });
const cfg = (obj: unknown) => (async () => new Response(JSON.stringify(obj), { status: 200 })) as any;

test("생성된 검증기가 계약 스키마와 같다(최신성)", () => {
  execFileSync("node", ["scripts/gen-validators.mjs", "--check"], { stdio: "pipe" });
  execFileSync("node", ["scripts/gen-types.mjs", "--check"], { stdio: "pipe" });
});

for (const [schema, fn] of [["DeviceConfig", validateDeviceConfig], ["KioskStartFragment", validateKioskStartFragment], ["StaffPushPayload", validateStaffPushPayload]] as const) {
  test(`${schema}: 계약 예시는 통과하고 거부 예시는 거부한다`, () => {
    const good = names("examples", schema), bad = names("conformance/examples_invalid", schema);
    assert.ok(good.length > 0 && bad.length > 0);
    for (const n of good) assert.equal(fn(ex("examples", n)), true, n);
    for (const n of bad) assert.equal(fn(ex("conformance/examples_invalid", n)), false, n);
  });
}

test("/config.json: 계약이 거부하는 설정(모르는 키)은 쓰지 않는다 - 토큰도 없는 것으로 본다", async () => {
  const s = await loadKioskStart(win(), cfg(ex("conformance/examples_invalid", "DeviceConfig.unknown-key")));
  assert.equal(s.deviceToken, null);
});

test("/config.json: allow_remote_stt 문자열은 꺼짐, 비ASCII 토큰은 없음, 잘못된 subject_ref는 무효 표시", async () => {
  const stt = await loadKioskStart(win(), cfg(ex("conformance/examples_invalid", "DeviceConfig.stt-string")));
  assert.equal(stt.allowRemoteStt, undefined);
  assert.equal(stt.deviceToken, "tok-FAKE"); // 나머지 키는 계약을 지키므로 그대로 쓴다
  assert.equal((await loadKioskStart(win(), cfg(ex("conformance/examples_invalid", "DeviceConfig.token-with-non-ascii")))).deviceToken, null);
  const ref = await loadKioskStart(win(), cfg(ex("conformance/examples_invalid", "DeviceConfig.bad-subject-ref")));
  assert.equal(ref.subjectInvalid, true);
  assert.equal(ref.subjectRef, null);
});

test("/config.json: 객체가 아니면(배열, null) 쓰지 않는다", async () => {
  for (const v of [[], null, "x", 3]) assert.equal((await loadKioskStart(win(), cfg(v))).deviceToken, null);
});

test("시작 URL 조각: 계약이 거부하는 모르는 키가 있으면 조각 전체를 쓰지 않고, 환자 참조가 있었으면 무효로 표시", async () => {
  const s = await loadKioskStart(win("#device=tok-FAKE&subject_ref=p1&patient_name=x"), cfg({}));
  assert.equal(s.deviceToken, null);
  assert.equal(s.subjectRef, null);
  assert.equal(s.subjectInvalid, true);
  const d = await loadKioskStart(win("#device=" + encodeURIComponent("토큰")), cfg({}));
  assert.equal(d.deviceToken, null);
});

test("푸시 본문: 계약을 지키면 세션·종류·alert_id를 쓰고, 어기면(모르는 키, session_id 없음) 일반 문구와 고정 tag", () => {
  assert.deepEqual(pushNotification(ex("examples", "StaffPushPayload.full")), { body: `세션 ${ex("examples", "StaffPushPayload.full").session_id} (${ex("examples", "StaffPushPayload.full").kind})`, tag: ex("examples", "StaffPushPayload.full").alert_id });
  for (const n of names("conformance/examples_invalid", "StaffPushPayload")) {
    assert.deepEqual(pushNotification(ex("conformance/examples_invalid", n)), { body: "새 알림이 있습니다", tag: "staff-alert" }, n);
  }
  assert.deepEqual(pushNotification(null), { body: "새 알림이 있습니다", tag: "staff-alert" });
});

// 옆 폴더 ../boundary-contracts의 작업 트리가 고정 태그보다 앞서 있어도(다른 영역이 새 태그로 올라간 경우) 이 영역의 시험은 고정 태그의 내용과 비교한다(ADR 0027).
import { contractVersion, pinnedTag } from "../scripts/contract-source.mjs";
test("계약은 고정 태그에서 읽는다: 읽은 패키지 버전이 Dockerfile 고정 태그와 같다(옆 폴더 작업 트리의 버전이 아니다)", () => {
  assert.equal(`v${contractVersion()}`, pinnedTag());
});
