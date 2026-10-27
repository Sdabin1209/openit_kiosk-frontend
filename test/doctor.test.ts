import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error 스크립트는 JS 모듈
import { diagnoseDocker, diagnoseHost, report } from "../scripts/doctor.mjs";

const okFont = "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc: Noto Sans CJK KR:style=Regular";
const lddOk = "\tlibc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x1)\n";
const lddBad = "\tlibnss3.so => not found\n\tlibnspr4.so => not found\n\tlibc.so.6 => /lib/libc.so.6 (0x1)\n";
const host = (o: object) => diagnoseHost({ browserPath: "/x/chrome", browserExists: true, lddOutput: lddOk, fontList: okFont, ...o });

test("doctor: Docker 데몬이 있으면 통과", () => {
  const r = report(diagnoseDocker({ hasDocker: true, daemonOk: true }));
  assert.equal(r.code, 0); assert.match(r.text, /^OK/);
});
test("doctor: docker 명령 없음 / 데몬 접속 불가는 FAIL(비0)", () => {
  assert.equal(report(diagnoseDocker({ hasDocker: false, daemonOk: false })).code, 1);
  const r = report(diagnoseDocker({ hasDocker: true, daemonOk: false }));
  assert.equal(r.code, 1); assert.match(r.text, /^FAIL: 전제 미충족/); assert.match(r.text, /데몬/);
});
test("doctor --host: 빠진 라이브러리를 이름으로 안내하되 FAIL이 아니다", () => {
  const r = report(host({ lddOutput: lddBad }));
  assert.equal(r.code, 0);
  assert.ok(r.text.includes("libnss3.so") && r.text.includes("libnspr4.so") && !r.text.includes("libc.so.6"));
  assert.ok(r.text.includes("sudo npx playwright install-deps chromium"));
});
test("doctor --host: 글꼴 없음은 경고(통과에 영향 없음)", () => {
  const r = report(host({ fontList: "" }));
  assert.equal(r.code, 0); assert.ok(r.text.includes("fonts-noto-cjk")); assert.match(r.text, /경고/);
});
test("doctor --host: 브라우저 미설치는 설치 명령 안내, ldd는 보지 않는다", () => {
  const r = report(host({ browserExists: false, lddOutput: null }));
  assert.ok(r.text.includes("npx playwright install chromium") && !r.text.includes("install-deps"));
});
test("doctor --host: 모두 충족하면 경고 없음", () => {
  assert.match(report(host({})).text, /^OK: 전제 충족/);
});
