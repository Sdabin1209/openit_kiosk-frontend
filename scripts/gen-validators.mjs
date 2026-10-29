// 계약(../boundary-contracts/schemas)의 이 영역 경계 스키마에서 검증기 코드를 만들어 생성 파일에 쓴다.
//   api/contract-validators.gen.cjs  : 화면 번들이 쓰는 읽는 쪽 스키마(DeviceConfig, KioskStartFragment, StaffPushPayload)
//   scripts/build-validators.gen.cjs : 빌드 진입점(scripts/build-image.mjs)이 쓰는 BuildImageRequest, BuildImageResult (계약 2.5.0, ADR 0026)
// 왜 생성물을 커밋하나: 이미지 빌드 문맥과 deploy의 빌드 호출에는 이웃 폴더·npm 설치가 없다(진입점은 이 리포만으로 돈다). 생성물은 스키마 복사본이 아니라
// 스키마에서 만든 코드이고, `--check`(test/contract-validation.test.ts)가 계약과 같은지 매번 확인한다. ADR 0021.
// 왜 ajv standalone: 화면 번들에 ajv 전체(컴파일러)를 넣지 않고 컴파일된 함수만 싣는다(런타임 의존 0 유지, ADR 0001·0005).
import Ajv2020 from "ajv/dist/2020.js";
import standaloneCode from "ajv/dist/standalone/index.js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { contractJson, contractVersion, pinnedTag } from "./contract-source.mjs";

// 계약은 옆 폴더의 현재 작업 트리가 아니라 고정한 태그(Dockerfile ARG)에서 읽는다(scripts/contract-source.mjs, ADR 0027).
const version = contractVersion();
if (`v${version}` !== pinnedTag()) { console.error(`gen-validators: 계약 패키지 버전 v${version} 이 고정 태그 ${pinnedTag()} 와 다릅니다`); process.exit(1); }
const load = (n) => contractJson(`schemas/${n}.schema.json`);

// USED: 내보내는 검증기. DEPS: 참조를 풀기 위해 등록만 하는 스키마. StaticImageInterface는 이 영역이 내는 쪽이라 시험이 검사한다.
const TARGETS = [
  { out: new URL("../api/contract-validators.gen.cjs", import.meta.url), rel: "api/contract-validators.gen.cjs", used: ["DeviceConfig", "KioskStartFragment", "StaffPushPayload"], deps: [] },
  { out: new URL("./build-validators.gen.cjs", import.meta.url), rel: "scripts/build-validators.gen.cjs", used: ["BuildImageRequest", "BuildImageResult"], deps: ["ImageLabels", "_common", "JobsDeclaration"], unicode: false },
];

function generate(t) {
  const ajv = new Ajv2020({ code: { source: true, esm: false }, allErrors: true, strict: false, unicode: t.unicode ?? true }); // unicode:false = 문자열 길이를 .length로 센다: 생성 코드가 ajv 런타임(ucs2length)을 require하지 않아 npm 설치 없이 돈다(경로·태그는 ASCII)
  for (const n of [...t.deps, ...t.used]) ajv.addSchema(load(n), `${n}.schema.json`);
  const refs = Object.fromEntries(t.used.map((n) => [n, `${n}.schema.json`]));
  return `// 생성 파일: node scripts/gen-validators.mjs (직접 고치지 않는다). 출처: boundary-contracts ${t.used.join(", ")} (패키지 버전 ${version}).\n/* eslint-disable */\n` + standaloneCode(ajv, refs);
}

const check = process.argv.includes("--check");
let bad = false;
for (const t of TARGETS) {
  const text = generate(t);
  if (check) {
    const cur = existsSync(t.out) ? readFileSync(t.out, "utf8") : "";
    if (cur !== text) { console.error(`gen-validators --check: ${t.rel} 가 계약 스키마와 다릅니다. node scripts/gen-validators.mjs 를 실행하세요.`); bad = true; }
  } else { writeFileSync(t.out, text); console.log(`wrote ${t.rel} (계약 ${version})`); }
}
if (check) { if (bad) process.exit(1); console.log("검증기 최신 (계약 " + version + ")"); }
