import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error 스크립트는 JS 모듈
import { diagnose, report } from "../scripts/doctor.mjs";

const okFont = "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc: Noto Sans CJK KR:style=Regular";
const lddOk = "\tlibc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x1)\n";
const lddBad = "\tlibnss3.so => not found\n\tlibnspr4.so => not found\n\tlibasound.so.2 => not found\n\tlibc.so.6 => /lib/libc.so.6 (0x1)\n";

test("doctor: 모두 충족하면 통과(코드 0)", () => {
  const r = report(diagnose({ browserPath: "/x/chrome", browserExists: true, lddOutput: lddOk, fontList: okFont }));
  assert.equal(r.code, 0);
  assert.match(r.text, /^OK/);
});
test("doctor: 빠진 라이브러리를 이름으로 나열하고 표준 해결 명령을 낸다", () => {
  const r = report(diagnose({ browserPath: "/x/chrome", browserExists: true, lddOutput: lddBad, fontList: okFont }));
  assert.equal(r.code, 1);
  assert.match(r.text, /^FAIL: 전제 미충족/);
  for (const n of ["libnss3.so", "libnspr4.so", "libasound.so.2"]) assert.ok(r.text.includes(n), n);
  assert.ok(!r.text.includes("libc.so.6"));
  assert.ok(r.text.includes("sudo npx playwright install-deps chromium"));
});
test("doctor: 글꼴 없음", () => {
  const r = report(diagnose({ browserPath: "/x/chrome", browserExists: true, lddOutput: lddOk, fontList: "" }));
  assert.equal(r.code, 1);
  assert.ok(r.text.includes("sudo apt-get install -y fonts-noto-cjk"));
});
test("doctor: 브라우저 미설치면 설치 명령을 안내하고 ldd는 보지 않는다", () => {
  const r = report(diagnose({ browserPath: "/x/chrome", browserExists: false, lddOutput: null, fontList: okFont }));
  assert.equal(r.code, 1);
  assert.ok(r.text.includes("npx playwright install chromium"));
  assert.ok(!r.text.includes("install-deps"));
});
test("doctor: 여러 문제는 모두 보고한다", () => {
  const r = report(diagnose({ browserPath: "/x/chrome", browserExists: true, lddOutput: lddBad, fontList: "" }));
  assert.ok(r.text.includes("install-deps") && r.text.includes("fonts-noto-cjk"));
});
