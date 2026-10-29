// 영역 빌드 진입점의 실제 docker 빌드(스모크, 계약 2.5.0 U42): 요청 JSON -> scripts/build-image.sh -> 결과 마지막 줄이 BuildImageResult.
// 이미지 이름에 리포 이름을 넣고 끝나면 지운다. 같은 요청을 두 번 내면 같은 라벨·같은 이미지 이름(멱등). image_id는 docker가 빌드 시각을 이미지에 넣어 빌드마다 다르다(ADR 0026, 바이트 동일 재현 빌드는 하지 않는다).
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const gen = createRequire(import.meta.url)("../scripts/build-validators.gen.cjs");
const REV = spawnSync("git", ["rev-parse", "--short=7", "HEAD"], { encoding: "utf8" }).stdout.trim();
const TAG = `kiosk-frontend-buildimg-test/kiosk-frontend:${REV}-${process.pid}`;
const dir = mkdtempSync(join(tmpdir(), "kf-buildimg-real-"));
after(() => { spawnSync("docker", ["rmi", "-f", TAG]); rmSync(dir, { recursive: true, force: true }); });

function build() {
  const f = join(dir, "req.json");
  writeFileSync(f, JSON.stringify({ source_dir: process.cwd(), revision: REV, versions: { boundary: "v2.5.0", survey_schema: "v1.2.0" }, image_tag: TAG }));
  return spawnSync("bash", ["scripts/build-image.sh", f], { encoding: "utf8" });
}

test("실제 docker 빌드: 결과 마지막 줄이 BuildImageResult이고 라벨이 요청 값과 같으며 같은 요청은 같은 라벨의 이미지다", () => {
  const r = build();
  assert.equal(r.status, 0, r.stderr.slice(-2000));
  const result = JSON.parse(r.stdout.trimEnd().split("\n").pop()!);
  assert.equal(gen.BuildImageResult(result), true, JSON.stringify(gen.BuildImageResult.errors));
  assert.equal(result.image, TAG);
  assert.equal(result.labels["io.openit.service"], "kiosk-frontend");
  assert.equal(result.labels["io.openit.revision"], REV);
  assert.equal(result.labels["io.openit.contracts.boundary"], "v2.5.0");
  assert.equal(result.labels["io.openit.contracts.survey-schema"], "1");
  console.error("BuildImageResult:", JSON.stringify(result)); // 보고용
  const again = JSON.parse(build().stdout.trimEnd().split("\n").pop()!);
  assert.deepEqual([again.image, again.labels], [result.image, result.labels], "같은 요청은 같은 이미지 이름과 라벨");
});
