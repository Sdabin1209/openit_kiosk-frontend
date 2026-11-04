// docker 환경 한 곳(scripts/docker-env.mjs)의 시험: (1) 호출자가 준 DOCKER_CONFIG 는 그대로 쓰인다(deploy 의 인증 설정), (2) 안 주면 사용자 전역 설정의
// 망가진 자격 도우미를 거치지 않는다. 둘 다 변이가 있다. 실제 docker 를 부른다(HANG_GUARD 외에 시간을 재지 않는다). 사용자 ~/.docker 는 건드리지 않고 HOME 을 임시 폴더로 바꿔 흉내 낸다.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir, homedir } from "node:os";
import { join } from "node:path";
import { dockerEnv } from "../scripts/docker-env.mjs";

const tmp = mkdtempSync(join(tmpdir(), "docker-env-"));
const BROKEN = JSON.stringify({ credsStore: "nonexistent-helper-xyz" });      // 없는 자격 도우미: 부르는 순간 "error getting credentials"
const fakeHome = join(tmp, "home"); mkdirSync(join(fakeHome, ".docker"), { recursive: true });
writeFileSync(join(fakeHome, ".docker", "config.json"), BROKEN);               // 망가진 "사용자 전역 설정"(진짜 ~/.docker 가 아니다)
const givenOk = join(tmp, "given-ok"); mkdirSync(givenOk); writeFileSync(join(givenOk, "config.json"), "{}");       // 호출자(deploy)가 주는 정상 설정
const givenBroken = join(tmp, "given-broken"); mkdirSync(givenBroken); writeFileSync(join(givenBroken, "config.json"), BROKEN);
const ctx = join(tmp, "ctx"); mkdirSync(ctx);
writeFileSync(join(ctx, "Dockerfile"), "# syntax=docker/dockerfile:1\nFROM scratch\nLABEL io.openit.test=docker-env\n");   // syntax 줄: 프런트엔드 이미지를 레지스트리에서 풀어 자격 도우미를 부르는 경로(실제 실패가 난 곳)
const TAG = `docker-env-test-${process.pid}`;
const build = (env: NodeJS.ProcessEnv) => spawnSync("docker", ["build", "-q", "--no-cache", "-t", TAG, ctx], { encoding: "utf8", env });
const noCfg = (extra: NodeJS.ProcessEnv = {}) => { const e = { ...process.env, ...extra }; delete e.DOCKER_CONFIG; return e; };
after(() => { spawnSync("docker", ["rmi", "-f", TAG], { env: dockerEnv() }); rmSync(tmp, { recursive: true, force: true }); });

test("주어진 DOCKER_CONFIG 는 그대로 쓰인다(바꾸지 않고, 리포 안 빈 설정으로 덮지 않는다)", () => {
  assert.equal(dockerEnv({ ...process.env, DOCKER_CONFIG: givenOk }).DOCKER_CONFIG, givenOk);
});

test("주어진 DOCKER_CONFIG 로 docker build 가 돈다(변이: 주어진 설정이 망가졌다면 그 설정 때문에 실패해야 한다 = 실제로 그 설정을 쓴다는 증거)", () => {
  assert.equal(build(dockerEnv({ ...process.env, DOCKER_CONFIG: givenOk })).status, 0);
  const bad = build(dockerEnv({ ...process.env, DOCKER_CONFIG: givenBroken }));
  assert.notEqual(bad.status, 0);
  assert.match(bad.stderr, /credentials/);
});

test("안 주면 리포 안 빈 설정을 쓰고 사용자 ~/.docker 를 쓰지 않는다", () => {
  const e = dockerEnv(noCfg());
  assert.match(e.DOCKER_CONFIG!, /\/build\/docker-config$/);
  assert.ok(!e.DOCKER_CONFIG!.startsWith(join(homedir(), ".docker")));
  assert.deepEqual(JSON.parse(readFileSync(join(e.DOCKER_CONFIG!, "config.json"), "utf8")), {});
});

test("안 주면 망가진 사용자 전역 설정(HOME/.docker)을 거치지 않아 docker build 가 성공한다", () => {
  const r = build(dockerEnv(noCfg({ HOME: fakeHome })));
  assert.equal(r.status, 0, r.stderr);
});

test("변이: 이 환경을 빼면 같은 망가진 사용자 전역 설정으로 docker build 가 자격 오류로 실패한다", () => {
  const r = build(noCfg({ HOME: fakeHome }));
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /credentials/);
});
