// 계약 2.6.0 SetupEnvReport(OPEN_GAPS U43): `bash scripts/setup-env.sh`는 표준 출력 마지막 줄에 보고 JSON 한 줄을 낸다. 진행 기록은 표준 오류.
// 실제 npm ci를 시험 안에서 돌리면 node_modules를 지우고 다시 깔아 이 시험 자체가 흔들리므로, 가짜 npm(PATH)으로 스크립트 동작만 확인한다.
// 실제 환경에서 test_command를 돌리는 것은 영역 전체 시험(npm test)을 도는 것과 같다(여기서 부르면 자기 자신을 부르는 재귀가 된다).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { contractJson } from "../scripts/contract-source.mjs";

const gen = createRequire(import.meta.url)("../scripts/build-validators.gen.cjs");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));

/** 리포 루트를 흉내 낸 임시 폴더(스크립트, package.json, 잠금 파일만)와 가짜 npm. fakeNpm은 bash 본문. */
function fixture(fakeNpm: string) {
  const d = mkdtempSync(join(tmpdir(), "kf-setupenv-"));
  mkdirSync(join(d, "scripts")); mkdirSync(join(d, "bin"));
  for (const f of ["package.json", "package-lock.json"]) copyFileSync(f, join(d, f));
  copyFileSync("scripts/setup-env.sh", join(d, "scripts/setup-env.sh"));
  writeFileSync(join(d, "bin/npm"), `#!/usr/bin/env bash\n${fakeNpm}\n`); chmodSync(join(d, "bin/npm"), 0o755);
  return d;
}
const run = (d: string) => spawnSync("bash", [join(d, "scripts/setup-env.sh")], { cwd: tmpdir(), encoding: "utf8", env: { ...process.env, PATH: `${join(d, "bin")}:${process.env.PATH}` } });
const lastLine = (s: string) => s.trimEnd().split("\n").pop()!;

test("setup-env.sh: 성공하면 마지막 줄이 SetupEnvReport(ok, node-modules, npm test)이고 npm의 표준 출력 소음은 앞줄이 아니라 표준 오류로 간다", () => {
  const d = fixture('echo "npm 소음: added 99 packages"; mkdir -p "$PWD/node_modules"; exit 0'); // npm ci가 표준 출력으로 내는 진행 줄을 흉내
  try {
    const r = run(d);
    assert.equal(r.status, 0, r.stderr);
    const rep = JSON.parse(lastLine(r.stdout));
    assert.equal(gen.SetupEnvReport(rep), true, JSON.stringify(gen.SetupEnvReport.errors));
    assert.equal(rep.area, "kiosk-frontend");
    assert.deepEqual([rep.status, rep.exit_code], ["ok", 0]);
    assert.deepEqual(rep.environment, { kind: "node-modules", path: "node_modules", test_command: ["npm", "test"] });
    assert.equal(r.stdout.trim().split("\n").length, 1, "표준 출력에는 보고 한 줄뿐(진행 기록은 표준 오류)");
    assert.match(r.stderr, /npm 소음/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("setup-env.sh: 실패해도(npm ci 두 번 실패) 마지막 줄은 status fail과 같은 종료 코드의 보고이고 스크립트는 비0으로 끝난다", () => {
  const d = fixture("exit 1");
  try {
    const r = spawnSync("bash", ["-c", `sleep() { :; }; export -f sleep; bash '${join(d, "scripts/setup-env.sh")}'`], { cwd: tmpdir(), encoding: "utf8", env: { ...process.env, PATH: `${join(d, "bin")}:${process.env.PATH}` } });
    assert.notEqual(r.status, 0);
    const rep = JSON.parse(lastLine(r.stdout));
    assert.equal(gen.SetupEnvReport(rep), true, JSON.stringify(gen.SetupEnvReport.errors));
    assert.deepEqual([rep.status, rep.exit_code], ["fail", r.status]);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("setup-env.sh: 이미 준비돼 있으면(node_modules가 잠금 파일보다 새것) npm을 부르지 않고 같은 보고를 낸다(멱등)", () => {
  const d = fixture("exit 1"); // npm을 부르면 실패한다
  try {
    mkdirSync(join(d, "node_modules"));
    const lock = join(d, "package-lock.json");
    writeFileSync(join(d, "node_modules/.package-lock.json"), "{}");
    // 고정된 과거(시계를 읽지 않는다): 잠금 파일이 설치 표지보다 오래됐다
    const old = new Date("2000-01-01T00:00:00Z"); utimesSync(lock, old, old);
    const r = run(d);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(JSON.parse(lastLine(r.stdout)).status, "ok");
    assert.match(r.stderr, /이미 준비/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("계약 SetupEnvReport 예시는 통과하고 거부 예시는 거부한다(생성 검증기가 계약과 같다)", () => {
  assert.equal(gen.SetupEnvReport(contractJson("examples/SetupEnvReport.json")), true);
  assert.equal(gen.SetupEnvReport(contractJson("conformance/examples_invalid/SetupEnvReport.json")), false);
});

test("선언한 환경이 실제와 맞다: path가 리포 루트의 존재하는 폴더이고 test_command(npm test)가 package.json의 test 스크립트다", () => {
  assert.ok(existsSync("node_modules"));
  assert.ok(pkg.scripts?.test, "package.json에 test 스크립트가 있어야 npm test가 영역 시험 전체다");
});
