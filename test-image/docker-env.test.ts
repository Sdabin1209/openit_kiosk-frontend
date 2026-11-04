// docker 환경 한 곳(scripts/docker-env.mjs)의 재현 시험: 사용자 전역 설정의 자격 도우미가 망가져도 이 영역의 docker 호출은 성공하고,
// 이 환경을 빼면(변이) 같은 호출이 자격 오류로 실패한다. 실제 docker 를 부른다(HANG_GUARD 외에 시간을 재지 않는다).
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir, homedir } from "node:os";
import { join } from "node:path";
import { dockerEnv } from "../scripts/docker-env.mjs";

const broken = mkdtempSync(join(tmpdir(), "docker-broken-"));
writeFileSync(join(broken, "config.json"), JSON.stringify({ credsStore: "nonexistent-helper-xyz" }));   // 없는 자격 도우미: 부르는 순간 "error getting credentials"
const ctx = mkdtempSync(join(tmpdir(), "docker-ctx-"));
writeFileSync(join(ctx, "Dockerfile"), "# syntax=docker/dockerfile:1\nFROM scratch\nLABEL io.openit.test=docker-env\n");   // syntax 줄: 프런트엔드 이미지를 레지스트리에서 풀어 자격 도우미를 부르는 경로(실제 실패가 난 곳)
after(() => { rmSync(broken, { recursive: true, force: true }); rmSync(ctx, { recursive: true, force: true }); });
const build = (env: NodeJS.ProcessEnv) => spawnSync("docker", ["build", "-q", "--no-cache", "-t", `docker-env-test-${process.pid}`, ctx], { encoding: "utf8", env });
after(() => { spawnSync("docker", ["rmi", "-f", `docker-env-test-${process.pid}`], { env: dockerEnv() }); });

test("환경은 리포 안 빈 설정을 가리키고 호출자의 DOCKER_CONFIG 와 사용자 ~/.docker 를 쓰지 않는다", () => {
  const e = dockerEnv({ ...process.env, DOCKER_CONFIG: broken });
  assert.match(e.DOCKER_CONFIG!, /\/build\/docker-config$/);
  assert.notEqual(e.DOCKER_CONFIG, broken);
  assert.ok(!e.DOCKER_CONFIG!.startsWith(join(homedir(), ".docker")));
  assert.deepEqual(JSON.parse(readFileSync(join(e.DOCKER_CONFIG!, "config.json"), "utf8")), {});
});

test("망가진 credsStore 설정이 주어져도 docker build 가 성공한다", () => {
  const r = build(dockerEnv({ ...process.env, DOCKER_CONFIG: broken }));
  assert.equal(r.status, 0, r.stderr);
});

test("변이: 빈 설정을 빼면(망가진 설정 그대로) 같은 docker build 가 자격 오류로 실패한다", () => {
  const r = build({ ...process.env, DOCKER_CONFIG: broken });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /credentials/);
});
