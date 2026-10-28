// 계약(../boundary-contracts/schemas)의 이 영역 경계 스키마에서 검증기 코드를 만들어 api/contract-validators.gen.cjs에 쓴다.
// 왜 생성물을 커밋하나: 이미지 빌드 문맥에는 이웃 폴더가 없다(Dockerfile은 이 리포만 복사한다). 생성물은 스키마 복사본이 아니라
// 스키마에서 만든 코드이고, `--check`(test/contract-validation.test.ts)가 계약과 같은지 매번 확인한다. ADR 0021.
// 왜 ajv standalone: 브라우저 번들에 ajv 전체(컴파일러)를 넣지 않고 컴파일된 함수만 싣는다(런타임 의존 0 유지, ADR 0001·0005).
import Ajv2020 from "ajv/dist/2020.js";
import standaloneCode from "ajv/dist/standalone/index.js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const SCHEMAS = new URL("../../boundary-contracts/schemas/", import.meta.url);
const OUT = new URL("../api/contract-validators.gen.cjs", import.meta.url);
const USED = ["DeviceConfig", "KioskStartFragment", "StaffPushPayload"]; // StaticImageInterface는 이 영역이 쓰는 쪽이 아니라 내는 쪽이다(시험이 검사)
if (!existsSync(SCHEMAS)) { console.error("gen-validators: ../boundary-contracts/schemas 가 없습니다. 워크스페이스 구조에서 실행하세요."); process.exit(1); }

const ajv = new Ajv2020({ code: { source: true, esm: false }, allErrors: true, strict: true });
const load = (n) => JSON.parse(readFileSync(new URL(`${n}.schema.json`, SCHEMAS), "utf8"));
for (const n of USED) ajv.addSchema(load(n), `${n}.schema.json`);
const refs = Object.fromEntries(USED.map((n) => [n, `${n}.schema.json`]));
const version = readFileSync(new URL("../../boundary-contracts/pyproject.toml", import.meta.url), "utf8").match(/^version\s*=\s*"([^"]+)"/m)?.[1] ?? "n/a";
const text = `// 생성 파일: node scripts/gen-validators.mjs (직접 고치지 않는다). 출처: boundary-contracts ${USED.join(", ")} (패키지 버전 ${version}).\n/* eslint-disable */\n` + standaloneCode(ajv, refs);

if (process.argv.includes("--check")) {
  const cur = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (cur !== text) { console.error("gen-validators --check: api/contract-validators.gen.cjs 가 계약 스키마와 다릅니다. node scripts/gen-validators.mjs 를 실행하세요."); process.exit(1); }
  console.log("검증기 최신 (계약 " + version + ")");
} else {
  writeFileSync(OUT, text);
  console.log("wrote api/contract-validators.gen.cjs (계약 " + version + ")");
}
