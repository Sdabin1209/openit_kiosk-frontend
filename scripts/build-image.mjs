// 영역 빌드 진입점의 본체. 요청을 계약 검증기(BuildImageRequest)로 검증하고, source_dir만 빌드 컨텍스트로 이미지를 만들고,
// 이미지에 실제로 붙은 io.openit.* 라벨을 읽어 BuildImageResult 한 줄을 표준 출력 마지막 줄에 낸다. 진행 기록은 표준 오류. ADR 0026.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";

const gen = createRequire(import.meta.url)("./build-validators.gen.cjs"); // 계약 스키마에서 생성(scripts/gen-validators.mjs). npm 설치가 필요 없다
const DOCKER = process.env.DOCKER || "docker";
const fail = (msg) => { console.error(`build-image: ${msg}`); process.exit(1); };

let req;
try { req = JSON.parse(readFileSync(process.argv[2], "utf8")); } catch (e) { fail(`요청 파일을 JSON으로 읽지 못했습니다: ${e.message}`); }
if (!gen.BuildImageRequest(req)) fail(`요청이 계약 BuildImageRequest를 어깁니다: ${JSON.stringify(gen.BuildImageRequest.errors)}`);

// 이 영역이 쓰는 versions 키: boundary(스키마 필수), survey_schema(라벨). 없으면 기본값을 두지 않고 실패한다(기준표와 어긋나지 않게).
if (req.variant !== undefined) fail(`이 영역은 variant를 모릅니다(이미지가 하나): ${req.variant}`);
if (!req.versions.survey_schema) fail("versions.survey_schema가 없습니다(라벨 io.openit.contracts.survey-schema에 쓴다)");
// 라벨 survey-schema는 주 버전 하나다(ImageLabels): 태그 vX.Y.Z의 X.
const surveyMajor = req.versions.survey_schema.slice(1).split(".")[0];

const expected = {
  "io.openit.service": "kiosk-frontend",
  "io.openit.revision": req.revision,
  "io.openit.contracts.boundary": req.versions.boundary,
  "io.openit.contracts.survey-schema": surveyMajor,
};
const run = (args, opts = {}) => spawnSync(DOCKER, args, { encoding: "utf8", ...opts });

console.error(`build-image: ${DOCKER} build ${req.image_tag} (source ${req.source_dir})`);
// 빌드 출력은 표준 오류로 보낸다(표준 출력은 결과 한 줄 전용). app-version 라벨은 Dockerfile 기본값이다(ADR 0025).
const b = run(["build", "-t", req.image_tag, "--build-arg", `REVISION=${req.revision}`, "--build-arg", `BOUNDARY_CONTRACT=${req.versions.boundary}`, "--build-arg", `SURVEY_SCHEMA=${surveyMajor}`, req.source_dir], { stdio: ["ignore", 2, 2], encoding: undefined });
if (b.status !== 0) fail(`docker build 실패(종료 ${b.status})`);

const id = run(["inspect", "-f", "{{.Id}}", req.image_tag]);
const lab = run(["inspect", "-f", "{{json .Config.Labels}}", req.image_tag]);
if (id.status !== 0 || lab.status !== 0) fail("docker inspect 실패");
const all = JSON.parse(lab.stdout.trim() || "{}") ?? {};
const labels = Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith("io.openit.")).sort(([a], [c]) => (a < c ? -1 : 1)));

// 요청 값이 라벨에 그대로 박혔는지 확인한다(빌드 인자 이름이 Dockerfile과 어긋났을 때 조용히 틀린 라벨이 나가지 않게).
for (const [k, v] of Object.entries(expected)) if (labels[k] !== v) fail(`이미지 라벨 ${k}=${labels[k]} 가 요청 값 ${v} 와 다릅니다`);
const result = { image: req.image_tag, image_id: id.stdout.trim(), labels };
if (!gen.BuildImageResult(result)) fail(`결과가 계약 BuildImageResult를 어깁니다(라벨이 ImageLabels를 어김?): ${JSON.stringify(gen.BuildImageResult.errors)}`);
process.stdout.write(JSON.stringify(result) + "\n");
