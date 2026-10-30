// schemas/(영역 내부 타입)과 계약·문진 스키마에서 src/types/를 만든다. 손으로 고치지 않는다(DESIGN.md 3절, D117).
//   src/types/<이름>.ts            : json-schema-to-typescript가 만든 코드 타입. 영역 타입은 schemas/<이름>.json, 공개 API 본문 타입은
//                                    문진 스키마(survey-service 리포의 고정 태그 survey-schema-v3.0.0, 읽기 전용)와 고정 태그의 계약(scripts/contract-source.mjs)에서 만든다.
//   src/types/validators.gen.cjs   : 위 스키마 검증기(ajv standalone). 컴포넌트의 입력 검사는 이 검증기 하나다(DESIGN.md 5절).
//   src/types/validators.gen.d.cts : 검증기 이름 목록의 형.
// 사용: node scripts/gen-types.mjs [--check]   (--check: 쓰지 않고 현재 파일이 생성 결과와 같은지만 본다)
// 왜 영역 타입 파일을 하나씩 만드나: 파일마다 참조된 타입을 안에 다시 선언해도 서로 겹치지 않고, 파일 이름 = 타입 이름이 된다.
import { compile } from "json-schema-to-typescript";
import Ajv2020 from "ajv/dist/2020.js";
import standaloneCode from "ajv/dist/standalone/index.js";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { contractJson, contractVersion, surveySchemaJson, SURVEY_SCHEMA_TAG } from "./contract-source.mjs";

const ROOT = new URL("../", import.meta.url);
const OUT = new URL("src/types/", ROOT);
const check = process.argv.includes("--check");

// 공개 API 본문 타입의 출처. 계약은 고정 태그에서, 문진 스키마는 옆 폴더에서(읽기 전용) 읽는다.
const CONTRACT_TYPES = ["StaffAlert", "StaffAlertPage", "SessionState", "PushConfig", "StaffCallRetryResult", "StaffCallReport", "StaffCallRetryRequest", "BoundaryError", "DeviceConfig", "KioskStartFragment", "StaffPushPayload"];
const SURVEY_TYPES = ["FrontendInput", "StaffSessionView"];
// 계약에서 검증기까지 만드는 것(경계 스키마: 읽는 쪽이 계약 그대로 검사한다, ADR 0021).
const CONTRACT_VALIDATORS = ["DeviceConfig", "KioskStartFragment", "StaffPushPayload"];
const CONTRACT_DEPS = ["SessionState", "StaffCallReport"]; // 영역 스키마가 $ref로 가리키는 계약 스키마

const readJson = (url) => JSON.parse(readFileSync(url, "utf8"));
const internal = Object.fromEntries(readdirSync(new URL("schemas/", ROOT)).filter((f) => f.endsWith(".json")).map((f) => [f.replace(/\.json$/, ""), readJson(new URL(`schemas/${f}`, ROOT))]));
const contract = (n) => contractJson(`schemas/${n}.schema.json`);

/** $ref를 제자리에 풀어 한 파일로 만든다(타입 생성용). "X.json" = 영역 스키마, "Y.schema.json#/..." = 계약 스키마의 일부. */
function inline(node, seen = []) {
  if (Array.isArray(node)) return node.map((n) => inline(n, seen));
  if (node === null || typeof node !== "object") return node;
  if (typeof node.$ref === "string" && !node.$ref.startsWith("#")) {
    const [file, frag = ""] = node.$ref.split("#");
    const base = file.endsWith(".schema.json") ? contract(file.replace(/\.schema\.json$/, "")) : internal[file.replace(/\.json$/, "")];
    if (!base) throw new Error(`gen-types: 풀 수 없는 $ref ${node.$ref}`);
    if (seen.includes(node.$ref)) throw new Error(`gen-types: 순환 $ref ${node.$ref}`);
    let target = base;
    for (const k of frag.split("/").filter(Boolean)) target = target[k];
    const { $id, $schema, ...rest } = target;
    return inline(rest, [...seen, node.$ref]);
  }
  const out = {};
  for (const [k, v] of Object.entries(node)) if (!(k === "$id" && seen.length > 0)) out[k] = inline(v, seen);
  return out;
}

const banner = (src) => `/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: ${src} */\n`;
async function ts(name, schema, src) {
  const { $id, $schema, ...s } = inline(schema);
  return await compile({ ...s, title: name }, name, { bannerComment: banner(src), additionalProperties: false, format: false, strictIndexSignatures: true, unreachableDefinitions: false, style: { singleQuote: false, printWidth: 160 } });
}

const files = new Map();
for (const [n, s] of Object.entries(internal)) files.set(`${n}.ts`, await ts(n, s, `schemas/${n}.json`));
for (const n of CONTRACT_TYPES) files.set(`${n}.ts`, await ts(n, contract(n), `boundary-contracts ${n} (패키지 버전 ${contractVersion()})`));
for (const n of SURVEY_TYPES) {
  const s = surveySchemaJson(n); // 고정 태그에서 읽는다(옆 폴더 작업 트리가 아님)
  const dup = files.has(`${n}.ts`);
  if (dup) throw new Error(`gen-types: 타입 이름 충돌 ${n}`);
  files.set(`${n}.ts`, await ts(n, s, `survey-service ${SURVEY_SCHEMA_TAG} schema/schemas/${n}.json`));
}

// 검증기: 영역 스키마 전부 + 계약 경계 스키마.
// 왜 $schema를 뺀다: 생성 코드에 스키마 본문이 그대로 실려 화면 번들에 들어가는데, 메타스키마 주소(https://...)가 번들에 외부 URL로 남으면 "외부 URL 없음" 검사(test/static.test.ts)와 섞인다. Ajv2020은 기본이 2020-12라 뺀다.
const noMeta = ({ $schema, ...rest }) => rest;
const ajv = new Ajv2020({ code: { source: true, esm: false }, allErrors: true, strict: false });
for (const n of [...CONTRACT_DEPS, ...CONTRACT_VALIDATORS]) ajv.addSchema(noMeta(contract(n)), `${n}.schema.json`);
for (const [n, s] of Object.entries(internal)) ajv.addSchema(noMeta(s), `${n}.json`);
const refs = { ...Object.fromEntries(Object.keys(internal).map((n) => [n, `${n}.json`])), ...Object.fromEntries(CONTRACT_VALIDATORS.map((n) => [n, `${n}.schema.json`])) };
files.set("validators.gen.cjs", `// 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/*.json, boundary-contracts ${CONTRACT_VALIDATORS.join(", ")} (패키지 버전 ${contractVersion()}).\n/* eslint-disable */\n` + standaloneCode(ajv, refs));
const names = Object.keys(refs).sort();
files.set("validators.gen.d.cts", `// validators.gen.cjs의 형. 이름은 schemas/ 파일 이름과 계약 경계 스키마 이름이다.\nexport interface ErrorObject { instancePath: string; keyword: string; params: Record<string, unknown>; message?: string }\nexport interface ValidateFn { (data: unknown): boolean; errors?: ErrorObject[] | null }\n${names.map((n) => `export const ${n}: ValidateFn;`).join("\n")}\n`);

mkdirSync(OUT, { recursive: true });
let bad = false;
const want = new Set(files.keys());
for (const f of readdirSync(OUT)) if ((f.endsWith(".ts") || f.endsWith(".cjs") || f.endsWith(".cts")) && !want.has(f)) { if (check) { console.error(`gen-types --check: 남는 파일 ${f}`); bad = true; } else rmSync(new URL(f, OUT)); }
for (const [f, text] of files) {
  const u = new URL(f, OUT);
  if (check) { if (!existsSync(u) || readFileSync(u, "utf8") !== text) { console.error(`gen-types --check: src/types/${f} 가 스키마와 다릅니다. node scripts/gen-types.mjs 를 실행하세요.`); bad = true; } }
  else writeFileSync(u, text);
}
if (check) { if (bad) process.exit(1); console.log(`타입·검증기 최신 (계약 ${contractVersion()}, 파일 ${files.size}개)`); }
else console.log(`wrote src/types/ (${files.size}개 파일, 계약 ${contractVersion()})`);
