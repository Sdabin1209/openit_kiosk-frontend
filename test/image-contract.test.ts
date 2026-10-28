// 이미지가 계약에 약속하는 것: 배포 인터페이스 선언(StaticImageInterface)과 이미지 라벨(ImageLabels).
// 두 스키마는 ../boundary-contracts/schemas를 읽어 쓴다(복사본 없음). 선언서 docs/image-interface.json은 이미지에 싣지 않는다(deploy가 읽는 방법은 정해지지 않음).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";

const BC = new URL("../../boundary-contracts/", import.meta.url);
const ajv = new Ajv2020({ allErrors: true, strict: false });
for (const f of readdirSync(new URL("schemas/", BC))) {
  if (!f.endsWith(".schema.json")) continue;
  const s = JSON.parse(readFileSync(new URL(`schemas/${f}`, BC), "utf8"));
  if (s.$id) ajv.addSchema(s); // $id가 없는 스키마는 이 시험이 쓰지 않는다
}
const validator = (name: string) => ajv.getSchema(`${name}.schema.json`)!;
const dockerfile = readFileSync("Dockerfile", "utf8");
const decl = JSON.parse(readFileSync("docs/image-interface.json", "utf8"));
const ex = (dir: string, n: string) => JSON.parse(readFileSync(new URL(`${dir}/${n}.json`, BC), "utf8"));

test("StaticImageInterface: 계약 예시는 통과하고 거부 예시는 거부한다", () => {
  const v = validator("StaticImageInterface");
  assert.equal(v(ex("examples", "StaticImageInterface.default")), true);
  for (const n of ["no-readyz", "port-string", "root-user", "secret-env", "serves-v1"]) assert.equal(v(ex("conformance/examples_invalid", `StaticImageInterface.${n}`)), false, n);
});

test("선언서 docs/image-interface.json이 계약을 지키고 Dockerfile과 같다(포트, 사용자, 환경 변수 기본값). 경로는 test-image/가 실제 이미지로 확인한다", () => {
  const v = validator("StaticImageInterface");
  assert.equal(v(decl), true, JSON.stringify(v.errors));
  assert.equal(decl.port, Number(dockerfile.match(/^EXPOSE (\d+)/m)![1]));
  assert.equal(decl.user, dockerfile.match(/^USER (\S+)/m)![1]);
  const env = dockerfile.match(/^ENV (.+)$/m)![1].split(/\s+/).map((kv) => kv.split("=") as [string, string]);
  assert.deepEqual(Object.fromEntries(env.filter(([k]) => k === "PORT" || k === "STATIC_DIR")), decl.env);
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
