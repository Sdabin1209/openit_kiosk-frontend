// 영역 빌드 진입점 `bash scripts/build-image.sh <요청 JSON>` (계약 2.5.0 BuildImageRequest/BuildImageResult, OPEN_GAPS U42, ADR 0026).
// 이 시험은 가짜 docker(DOCKER 환경 변수)로 요청 검증·빌드 인자·결과 JSON을 확인한다. 실제 빌드는 test-image/build-image.test.ts.
// 기대값은 계약의 examples(통과)와 conformance/examples_invalid(거부)에서 온다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { contractJson } from "../scripts/contract-source.mjs";

const ex = (dir: string, n: string) => contractJson(`${dir}/${n}.json`); // 고정 태그의 내용(옆 폴더 작업 트리가 아님, ADR 0027)
const gen = createRequire(import.meta.url)("../scripts/build-validators.gen.cjs");
const REPO = process.cwd();

// 노출 선언 라벨의 기대값: 정본 파일(deploy-exposure.json)을 한 줄로 줄인 JSON(ADR 0029).
const EXPOSURE_LABEL = JSON.stringify(JSON.parse(readFileSync("deploy-exposure.json", "utf8")));
// 이 영역이 실제로 쓰는(고정한) 버전: Dockerfile의 ARG 기본값이다. 요청 버전이 이것과 다르면 진입점은 라벨을 찍지 않고 실패한다(U50, 라벨이 거짓이 되지 않게).
const DOCKERFILE = readFileSync("Dockerfile", "utf8");
const PIN_BOUNDARY = DOCKERFILE.match(/^ARG BOUNDARY_CONTRACT=(\S+)/m)![1];
const REQ = { source_dir: REPO, revision: "bad876c", versions: { boundary: PIN_BOUNDARY, survey_schema: "v3.0.0" }, image_tag: "kiosk-frontend-test/kiosk-frontend:bad876c" };

/** 가짜 docker: build 인자를 기록하고, inspect는 요청과 같은 라벨을 돌려준다(labelsOverride로 어긋난 이미지를 흉내 낸다). */
function fakeDocker(dir: string, labelsOverride?: Record<string, string>) {
  const log = join(dir, "docker.log"), bin = join(dir, "docker");
  const labels = JSON.stringify({ "io.openit.service": "kiosk-frontend", "io.openit.revision": REQ.revision, "io.openit.contracts.boundary": PIN_BOUNDARY, "io.openit.contracts.survey-schema": "n/a", "io.openit.app-version": "0.1.0", "io.openit.exposure": EXPOSURE_LABEL, "org.opencontainers.image.base.name": "x", ...labelsOverride });
  writeFileSync(bin, `#!/usr/bin/env bash
echo "$@" >> '${log}'
case "$1" in
  build) echo "step 1/9 (가짜 빌드 진행 기록)"; exit 0 ;;
  inspect) case "$*" in *"{{.Id}}"*) echo sha256:d81e5d2a92c016cc5802856d9e2a698ea89d7d0e41919adb6238e948090f94cd ;; *) echo '${labels}' ;; esac ;;
esac
`);
  chmodSync(bin, 0o755);
  return { bin, log };
}
function run(req: unknown, dockerBin: string | null, dir: string) {
  const f = join(dir, "req.json");
  writeFileSync(f, typeof req === "string" ? req : JSON.stringify(req));
  return spawnSync("bash", ["scripts/build-image.sh", f], { cwd: REPO, encoding: "utf8", env: { ...process.env, ...(dockerBin ? { DOCKER: dockerBin } : {}) } });
}
const tmp = () => mkdtempSync(join(tmpdir(), "kf-buildimg-"));
const lastLine = (s: string) => s.trimEnd().split("\n").pop()!;

test("진입점: 계약 예시 요청 모양을 받아 가짜 docker로 빌드하고, 마지막 줄이 BuildImageResult이며 라벨이 요청 값과 같다", () => {
  const d = tmp(); try {
    const { bin, log } = fakeDocker(d);
    const r = run(REQ, bin, d);
    assert.equal(r.status, 0, r.stderr);
    const result = JSON.parse(lastLine(r.stdout));
    assert.equal(gen.BuildImageResult(result), true, JSON.stringify(gen.BuildImageResult.errors));
    assert.equal(result.image, REQ.image_tag);
    assert.match(result.image_id, /^sha256:[0-9a-f]{64}$/);
    assert.equal(result.labels["io.openit.revision"], REQ.revision);
    assert.equal(result.labels["io.openit.contracts.boundary"], PIN_BOUNDARY);
    // 계약 3.0.1: 라벨은 이미지에 실제로 들어간 문진 스키마 패키지 버전의 주 번호다. 이 이미지는 문진 스키마를 담지 않으므로 요청이 survey_schema를 줘도 n/a다.
    assert.equal(result.labels["io.openit.contracts.survey-schema"], "n/a");
    assert.equal(result.labels["org.opencontainers.image.base.name"], undefined, "io.openit.* 라벨만 낸다");
    assert.equal(result.labels["io.openit.exposure"], EXPOSURE_LABEL, "노출 선언 라벨이 결과에 나온다");
    assert.equal(gen.Exposure(JSON.parse(result.labels["io.openit.exposure"])), true, "라벨 값은 계약 Exposure를 통과한다");
    assert.ok(r.stderr.includes("가짜 빌드 진행 기록"), "진행 기록은 표준 오류");
    assert.doesNotMatch(r.stdout.trimEnd().split("\n").slice(0, -1).join("\n"), /가짜 빌드/, "표준 출력에는 결과 한 줄뿐");
    const build = readFileSync(log, "utf8").split("\n").find((l) => l.startsWith("build"))!;
    assert.ok(build.includes(`--label io.openit.exposure=${EXPOSURE_LABEL}`), "빌드에 노출 선언 라벨을 단다");
    for (const a of ["REVISION=bad876c", `-t ${REQ.image_tag}`]) assert.ok(build.includes(a), `${a} in ${build}`);
    // U50: 계약·문진 스키마 버전은 요청 값을 빌드 인자로 넘기지 않는다. Dockerfile에 고정한 값이 이미지와 라벨에 들어간다.
    for (const a of ["BOUNDARY_CONTRACT", "SURVEY_SCHEMA", "survey"]) assert.ok(!build.includes(a), `${a}를 빌드 인자로 넘기지 않는다: ${build}`);
    assert.ok(build.trimEnd().endsWith(REPO), "source_dir만 빌드 컨텍스트");
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("진입점: 계약이 거부하는 요청(모르는 키, 필수 키 없음, 상대 경로)은 docker를 부르지 않고 실패한다", () => {
  const d = tmp(); try {
    const { bin, log } = fakeDocker(d);
    const bad: Array<[string, unknown]> = [
      ["계약 거부 예시(revision HEAD, 3.0.0에서 없어진 versions.turn_engine)", ex("conformance/examples_invalid", "BuildImageRequest")],
      ["모르는 키", { ...REQ, extra: 1 }],
      ["versions.boundary 없음", { ...REQ, versions: { survey_schema: "v1.2.0" } }],
      ["image_tag 없음", { source_dir: REQ.source_dir, revision: REQ.revision, versions: REQ.versions }],
      ["상대 source_dir", { ...REQ, source_dir: "kiosk-frontend" }],
      ["JSON 아님", "not json"],
    ];
    for (const [what, req] of bad) {
      const r = run(req, bin, d);
      assert.notEqual(r.status, 0, what);
      assert.equal(r.stdout.trim(), "", `${what}: 실패하면 결과 JSON을 내지 않는다`);
    }
    assert.throws(() => readFileSync(log), "docker를 한 번도 부르지 않았다");
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("진입점: 문진 스키마를 쓰지 않으므로 versions.survey_schema가 없어도 성공하고(라벨 n/a), 모르는 variant는 실패한다", () => {
  const d = tmp(); try {
    const { bin } = fakeDocker(d);
    const noSs = run({ ...REQ, versions: { boundary: PIN_BOUNDARY } }, bin, d);
    assert.equal(noSs.status, 0, noSs.stderr);
    assert.equal(JSON.parse(lastLine(noSs.stdout)).labels["io.openit.contracts.survey-schema"], "n/a");
    const v = run({ ...REQ, variant: "gpu" }, bin, d);
    assert.notEqual(v.status, 0); assert.match(v.stderr, /variant/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("진입점: 쓰지 않는 키(model_runtime, dependency_sources)는 받아도 무시한다(turn_engine은 3.0.0에서 없어져 거부된다)", () => {
  const d = tmp(); try {
    const { bin } = fakeDocker(d);
    const r = run({ ...REQ, versions: { ...REQ.versions, model_runtime: "v0.10.0" }, dependency_sources: { boundary: "/srv/x" } }, bin, d);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(JSON.parse(lastLine(r.stdout)).labels["io.openit.model-runtime"], undefined);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("진입점: 이미지에 실제로 붙은 라벨이 요청과 다르면(빌드 인자가 안 먹은 경우) 실패한다", () => {
  const d = tmp(); try {
    const { bin } = fakeDocker(d, { "io.openit.contracts.boundary": "v2.3.0" });
    const r = run(REQ, bin, d);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /contracts\.boundary/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("진입점: 계약 BuildImageResult 예시는 통과, 거부 예시는 거부(생성 검증기가 계약과 같다)", () => {
  assert.equal(gen.BuildImageResult(ex("examples", "BuildImageResult")), true);
  assert.equal(gen.BuildImageResult(ex("conformance/examples_invalid", "BuildImageResult")), false);
  assert.equal(gen.BuildImageRequest(ex("examples", "BuildImageRequest")), true);
  assert.equal(gen.BuildImageRequest(ex("conformance/examples_invalid", "BuildImageRequest")), false);
});

test("진입점: 이미지에 노출 선언 라벨이 없으면(붙이지 못한 경우) 실패한다", () => {
  const d = tmp(); try {
    const { bin } = fakeDocker(d, { "io.openit.exposure": "" });
    const r = run(REQ, bin, d);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /exposure/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

// U50(라벨 정직성): 요청 버전이 이 영역이 실제로 고정한 버전과 다르면 라벨을 찍지 않고 분명한 메시지로 실패한다.
test("진입점: 요청의 boundary 버전이 고정 버전과 다르면 docker를 부르지 않고 이유와 함께 실패한다", () => {
  const d = tmp(); try {
    const { bin, log } = fakeDocker(d);
    const other = PIN_BOUNDARY === "v9.9.9" ? "v9.9.8" : "v9.9.9";
    const r = run({ ...REQ, versions: { ...REQ.versions, boundary: other } }, bin, d);
    assert.notEqual(r.status, 0);
    assert.equal(r.stdout.trim(), "", "결과 JSON을 내지 않는다");
    assert.match(r.stderr, new RegExp(`${other}.*${PIN_BOUNDARY}|${PIN_BOUNDARY}.*${other}`));
    assert.match(r.stderr, /고정/);
    assert.throws(() => readFileSync(log), "docker를 부르지 않았다(거짓 라벨이 만들어지지 않는다)");
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("진입점: 요청이 어떤 survey_schema를 주어도 라벨은 거짓이 되지 않는다(이 이미지에 문진 스키마가 없으므로 n/a)", () => {
  const d = tmp(); try {
    const { bin } = fakeDocker(d);
    const r = run({ ...REQ, versions: { ...REQ.versions, survey_schema: "v7.0.0" } }, bin, d);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(JSON.parse(lastLine(r.stdout)).labels["io.openit.contracts.survey-schema"], "n/a");
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("이 이미지에는 문진 스키마가 들어가지 않는다(최종 단계는 dist와 Caddyfile만 담고, 화면 소스에 문진 스키마 파일이 없다)", () => {
  const final = DOCKERFILE.slice(DOCKERFILE.lastIndexOf("\nFROM "));
  const copies = [...final.matchAll(/^COPY\s+(?:--\S+\s+)*(\S+)\s+(\S+)/gm)].map((m) => m[1]);
  assert.deepEqual(copies.sort(), ["/src/dist", "Caddyfile"].sort());
  assert.doesNotMatch(DOCKERFILE, /survey-service|openit-survey-schema|SURVEY_SCHEMA/i);
});
