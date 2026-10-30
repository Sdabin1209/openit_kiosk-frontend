// 계약 v2.2.0 핀 올리기(wo-bc220): pipeline_schema_version은 한 곳(mock-server/app.ts의 PIPELINE_SCHEMA_VERSION, check-schema가 계약과 대조)에서만 정한다.
// 시험·코드가 버전 문자열을 따로 박아 두면 핀을 올릴 때 어긋난다. 기준: 헤드 지시 "계약 상수에서 파생, 하드코딩 금지".
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

test("pipeline_schema_version 값을 문자열로 박아 둔 시험·소스가 없다(모의 서버 상수 한 곳만)", () => {
  const found: string[] = [];
  for (const d of ["test", "mock-server", "src/components", "src/wiring"]) {
    for (const f of readdirSync(d)) {
      if (!f.endsWith(".ts")) continue;
      const s = readFileSync(`${d}/${f}`, "utf8");
      for (const m of s.matchAll(/pipeline_schema_version:\s*"[^"]*"/g)) found.push(`${d}/${f}: ${m[0]}`);
      if (!(d === "mock-server" && f === "app.ts")) for (const m of s.matchAll(/PIPELINE_SCHEMA_VERSION\s*=\s*"[^"]*"/g)) found.push(`${d}/${f}: ${m[0]}`);
    }
  }
  assert.deepEqual(found, []);
});
