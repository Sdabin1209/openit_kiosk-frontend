// 이미지가 계약에 약속하는 것: 이미지 라벨(ImageLabels)과 이미지 설정(EXPOSE·USER·ENV).
// 두 스키마는 고정 계약 태그에서 읽는다(복사본 없음, ADR 0027).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { contractJson, contractList } from "../scripts/contract-source.mjs";
import Ajv2020 from "ajv/dist/2020.js";

const ajv = new Ajv2020({ allErrors: true, strict: false });
for (const f of contractList("schemas")) {
  if (!f.endsWith(".schema.json")) continue;
  const s = contractJson(`schemas/${f}`);
  if (s.$id) ajv.addSchema(s); // $id가 없는 스키마는 이 시험이 쓰지 않는다
}
const validator = (name: string) => ajv.getSchema(`${name}.schema.json`)!;
const dockerfile = readFileSync("Dockerfile", "utf8");
const ex = (dir: string, n: string) => contractJson(`${dir}/${n}.json`);

// StaticImageInterface는 계약 3.0.0에서 없어졌다(포트·사용자·환경 변수는 OCI 이미지 설정 EXPOSE·USER·ENV가 표준이고 경로는 Exposure 라벨이 담는다, ADR 0030).
test("이미지 설정이 정본이다: EXPOSE 8080, root가 아닌 USER, PORT·STATIC_DIR 기본값", () => {
  assert.equal(dockerfile.match(/^EXPOSE (\d+)/m)![1], "8080");
  assert.doesNotMatch(dockerfile.match(/^USER (\S+)/m)![1], /^(root|0)$/);
  const env = Object.fromEntries(dockerfile.match(/^ENV (.+)$/m)![1].split(/\s+/).map((kv) => kv.split("=") as [string, string]));
  assert.equal(env.PORT, "8080");
  assert.equal(env.STATIC_DIR, "/app/dist");
});

test("Dockerfile ARG 기본값에 none/unknown/unset이 없다(값 없음은 n/a 하나)", () => {
  for (const m of dockerfile.matchAll(/^ARG (\w+)=(\S*)/gm)) assert.doesNotMatch(m[2], /^(none|unknown|unset)$/i, `ARG ${m[1]}`);
});

test("이미지 라벨이 계약 ImageLabels를 지킨다(Dockerfile LABEL에 ARG 기본값과 빌드 때 넘기는 커밋을 대입)", () => {
  const args: Record<string, string> = Object.fromEntries([...dockerfile.matchAll(/^ARG (\w+)=(\S*)/gm)].map((m) => [m[1], m[2]]));
  args.REVISION = "aa5656a"; // 빌드가 넘기는 값(scripts/smoke.sh의 git rev-parse --short HEAD)의 모양
  const block = dockerfile.match(/LABEL ([\s\S]*?)\n[A-Z]/)![1];
  const labels: Record<string, string> = {};
  for (const m of block.matchAll(/(io\.openit\.[\w.-]+)="([^"]*)"/g)) labels[m[1]] = m[2].replace(/\$\{(\w+)\}/g, (_, a) => args[a]);
  const v = validator("ImageLabels");
  assert.equal(v(labels), true, JSON.stringify(v.errors) + JSON.stringify(labels));
  // 기본 REVISION(빌드 인자 없이 빌드)은 revision이 hex가 아니므로 계약이 거부한다: 게시 이미지는 항상 커밋을 넘겨야 한다.
  assert.equal(v({ ...labels, "io.openit.revision": args.REVISION && "n/a" }), false);
});

// CR-D29: deploy는 package.json을 읽지 않고 APP_VERSION 빌드 인자도 넘기지 않는다. 그래서 라벨 io.openit.app-version은 Dockerfile ARG 기본값이다.
// Docker LABEL은 파일 내용으로 값을 정할 수 없으므로(ADR 0025) 기본값과 package.json version이 같은지를 시험으로 강제한다.
import { dockerfileAppVersion } from "../scripts/app-version.mjs";
test("Dockerfile ARG APP_VERSION 기본값이 package.json version과 같다", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8")).version;
  assert.equal(dockerfileAppVersion(dockerfile), pkg);
});
test("두 값이 어긋나면 위 검사가 실패한다(검사기 자체의 시험)", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8")).version;
  const skewed = dockerfile.replace(/^ARG APP_VERSION=\S+/m, "ARG APP_VERSION=9.9.9");
  assert.notEqual(dockerfileAppVersion(skewed), pkg);
  assert.equal(dockerfileAppVersion("FROM x\n"), null, "ARG가 없으면 null(없는 것을 통과시키지 않는다)");
});
test("라벨 io.openit.app-version이 ARG APP_VERSION을 쓴다(라벨이 다른 값을 박지 않는다)", () => {
  assert.match(dockerfile, /io\.openit\.app-version="\$\{APP_VERSION\}"/);
});
