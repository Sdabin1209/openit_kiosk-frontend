// 구조 검사(head/docs/DESIGN.md 6절, D117). 헤드의 structure-check.py와 같은 기준을 이 영역 시험으로 강제한다.
// 다른 점 하나: TypeScript 화면 리포는 화면 부품을 ui/에 둔다(DESIGN.md 3절)고 이 검사는 ui/를 허용한다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { contractJson } from "../scripts/contract-source.mjs";

const walk = (d: string, out: string[] = []): string[] => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p, out) : out.push(p); } return out; };
const code = walk("src").filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts"));
const comps = code.filter((f) => f.startsWith("src/components/"));

test("1. schemas/, src/types/, src/components/, src/wiring/, src/ui/가 있다", () => {
  for (const d of ["schemas", "src/types", "src/components", "src/wiring", "src/ui"]) assert.ok(existsSync(d) && readdirSync(d).length > 0, `${d} 없음`);
});

test("2. components/의 파일은 다른 components/ 파일을 import하지 않는다", () => {
  const names = new Set(comps.map((f) => basename(f, ".ts")));
  const bad: string[] = [];
  for (const f of comps) for (const m of readFileSync(f, "utf8").matchAll(/from\s+["']([^"']+)["']/g)) {
    const spec = m[1]!;
    if (spec.startsWith("./") || spec.includes("/components/")) bad.push(`${f}: ${spec}`);
    else if (names.has(basename(spec, ".ts")) && !spec.includes("/types/") && basename(spec, ".ts") !== "validators.gen") bad.push(`${f}: ${spec}`);
  }
  assert.deepEqual(bad, []);
});

test("3. HTTP(fetch, EventSource, node:http)는 통신 컴포넌트(link_*) 밖에 없다", () => {
  const bad = code.filter((f) => !basename(f).startsWith("link_") && !f.startsWith("src/types/"))
    .filter((f) => /\bfetch\s*\(|new EventSource\(|from\s+["'](node:)?https?["']/.test(readFileSync(f, "utf8").replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "")));
  assert.deepEqual(bad, []);
});

test("3b. 통신 컴포넌트(link_*)는 업무 컴포넌트를 import하지 않고 이름이 link_로 시작하는 것만 HTTP를 한다", () => {
  const links = comps.filter((f) => basename(f).startsWith("link_"));
  assert.ok(links.length >= 3, "link_ 컴포넌트: " + links.join(","));
});

test("4. 모든 스키마에 통과·거부 예시가 있고 결과가 맞다", () => {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  const files = readdirSync("schemas").filter((f) => f.endsWith(".json"));
  const names = files.map((f) => f.replace(/\.json$/, ""));
  // 영역 스키마가 $ref로 가리키는 계약 스키마(고정 태그)
  for (const c of ["SessionState", "StaffCallReport", "DeviceConfig"]) ajv.addSchema(contractJson(`schemas/${c}.schema.json`), `${c}.schema.json`);
  for (const f of files) ajv.addSchema(JSON.parse(readFileSync(`schemas/${f}`, "utf8")), f);
  const ex = readdirSync("schemas/examples");
  for (const n of names) {
    const valid = ex.filter((f) => f.startsWith(`${n}.valid`)), invalid = ex.filter((f) => f.startsWith(`${n}.invalid`));
    assert.ok(valid.length > 0 && invalid.length > 0, `${n}: 통과·거부 예시가 모두 있어야 한다`);
    const v = ajv.getSchema(`${n}.json`)!;
    for (const e of valid) assert.equal(v(JSON.parse(readFileSync(`schemas/examples/${e}`, "utf8"))), true, `${e} 는 통과해야 한다: ${JSON.stringify(v.errors)}`);
    for (const e of invalid) assert.equal(v(JSON.parse(readFileSync(`schemas/examples/${e}`, "utf8"))), false, `${e} 는 거부되어야 한다`);
  }
  // 예시 파일의 이름이 가리키는 스키마가 있다
  for (const e of ex) assert.ok(names.includes(e.split(".")[0]!), `${e}: 짝이 되는 스키마 없음`);
});

test("5. src/types/가 schemas/와 계약·문진 스키마에서 다시 생성한 결과와 같다", () => {
  execFileSync("node", ["scripts/gen-types.mjs", "--check"], { stdio: "pipe" });
});

test("6. 시험을 뺀 모든 코드 파일이 components/, wiring/, types/, ui/ 또는 진입점·설정에 속한다", () => {
  const ENTRY = /(^|\/)(main|index|config)\.ts$/;
  const bad = code.filter((f) => !/^src\/(components|wiring|types|ui)\//.test(f) && !ENTRY.test(f));
  assert.deepEqual(bad, []);
  // 모의 서버는 이웃(공개 API)의 대역이라 컴포넌트가 아니다: 파일은 진입점 이름(app, main, server)만 둔다.
  assert.deepEqual(readdirSync("mock-server").filter((f) => !/^(app|main|server)\.ts$/.test(f)), []);
});
