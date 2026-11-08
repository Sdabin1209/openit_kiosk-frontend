import { test } from "node:test";
import { minEnv, CONTRACT_SOURCE_NAMES } from "../scripts/min-env.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("스키마 점검은 정상 모의 응답을 허용한다", () => {
  const result = spawnSync(process.execPath, ["scripts/check-schema.mjs"], { encoding: "utf8", timeout: 30000, env: minEnv({}, CONTRACT_SOURCE_NAMES) });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /StaffSessionView:.*PASS/);
});

for (const field of ["session_id", "subject_ref", "resolved_by"]) {
  test(`스키마 점검은 ${field} 필수 필드를 뺀 실제 모의 응답을 거부한다`, () => {
    // 자식 프로세스의 fetch 응답만 변형한다. 운영 모의 서버에 시험용 분기를 넣지 않는다.
    const preload = `const original = globalThis.fetch;
      globalThis.fetch = async (...args) => {
        const response = await original(...args);
        if (!String(args[0]).includes('/v1/staff/sessions/')) return response;
        const body = await response.json();
        ${field === "resolved_by" ? "if (body.alerts?.length) delete body.alerts[0].resolved_by;" : `delete body.${field};`}
        return new Response(JSON.stringify(body), {status: response.status, headers: {'Content-Type': 'application/json'}});
      };`;
    const result = spawnSync(process.execPath,
      ["--import", `data:text/javascript,${encodeURIComponent(preload)}`, "scripts/check-schema.mjs"],
      { encoding: "utf8", timeout: 30000, env: minEnv({}, CONTRACT_SOURCE_NAMES) });
    assert.ifError(result.error);
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /StaffSessionView 불일치/);
    assert.ok(result.stderr.includes(`"missingProperty":"${field}"`), result.stderr);
  });
}
