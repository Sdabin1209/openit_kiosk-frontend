// 노출 선언(계약 Exposure, 라벨 io.openit.exposure, OPEN_GAPS U47, ADR 0029): 정본은 리포 루트의 deploy-exposure.json이다.
// 이 시험은 선언이 계약을 지키는지와, 선언이 이 영역 이미지의 실제 라우트 규칙(Caddyfile)과 어긋나지 않는지를 본다. 실제 응답과의 일치는 test-image/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { contractJson } from "../scripts/contract-source.mjs";

const gen = createRequire(import.meta.url)("../scripts/build-validators.gen.cjs");
const exposure = JSON.parse(readFileSync("deploy-exposure.json", "utf8"));
const caddyfile = readFileSync("Caddyfile", "utf8");

test("노출 선언이 계약 Exposure를 지키고 service가 이 영역 이미지 이름이다", () => {
  assert.equal(gen.Exposure(exposure), true, JSON.stringify(gen.Exposure.errors));
  assert.equal(exposure.service, "kiosk-frontend");
});

test("계약 Exposure 예시는 통과한다(생성 검증기가 계약과 같다)", () => {
  assert.equal(gen.Exposure(contractJson("examples/Exposure.json")), true);
});

test("선언과 이미지 라우트 규칙(Caddyfile)이 어긋나지 않는다: 닫은 경로, 메서드, 직원 화면은 계정 인증", () => {
  const denied = exposure.routes.filter((r: any) => r.auth.kind === "denied").flatMap((r: any) => r.paths).sort();
  assert.deepEqual(denied, ["/config.json", "/healthz", "/readyz"], "게이트웨이 밖으로 내지 않는 경로");
  // 이 이미지는 /healthz·/readyz·/config.json을 자기가 처리한다(게이트웨이가 자기 /healthz·/readyz를 따로 내고 /config.json은 막는다)
  for (const p of denied) assert.ok(caddyfile.includes(p), `Caddyfile이 ${p}를 안다`);
  // 선언의 methods(GET)는 이미지가 GET·HEAD 외를 405로 막는 것과 같다
  assert.match(caddyfile, /not method GET HEAD/);
  for (const r of exposure.routes.filter((r: any) => r.auth.kind !== "denied")) assert.deepEqual(r.methods, ["GET"]);
  // 직원 콘솔 정적 화면(/staff/*)은 계정 인증과 staff 역할. 인증 자체는 게이트웨이 몫이고 이 이미지는 아무것도 확인하지 않는다.
  const staff = exposure.routes.find((r: any) => r.paths.includes("/staff/*"));
  assert.deepEqual(staff.auth, { kind: "account", roles: ["staff"] });
  assert.equal(staff.user_header, "strip", "정적 화면에는 사용자 헤더를 넘기지 않는다");
  // 그 밖의 모든 경로(키오스크 화면과 자산)는 인증 없음. 더 구체적인 경로 뒤에 온다.
  const last = exposure.routes[exposure.routes.length - 1];
  assert.deepEqual([last.paths, last.auth.kind], [["/*"], "none"]);
});
