import { test } from "node:test";
import { minEnv, CONTRACT_SOURCE_NAMES } from "../scripts/min-env.mjs";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

test("standalone 검증기 생성 결과는 호출 디렉터리에 의존하지 않는다", () => {
  const temporary = mkdtempSync(join(tmpdir(), "standalone-cwd-"));
  const module = new URL("../scripts/standalone.mjs", import.meta.url).href;
  const program = `import { bundleStandalone } from ${JSON.stringify(module)}; process.stdout.write(bundleStandalone('module.exports = require("ajv/dist/runtime/ucs2length").default;'));`;
  const generate = (cwd: string) => execFileSync(process.execPath, ["--input-type=module", "-e", program], { cwd, encoding: "utf8", env: minEnv({}, CONTRACT_SOURCE_NAMES) });
  try {
    assert.equal(generate(temporary), generate(fileURLToPath(new URL("../", import.meta.url))));
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
