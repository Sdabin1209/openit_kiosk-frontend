// codex C2 K2: docker 연결 이름(DOCKER_CONTEXT·TLS·ssh)은 이어지고, 그 밖의 상속 변수는 넘어가지 않는다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { minEnv, DOCKER_CONNECTION_NAMES } from "../scripts/min-env.mjs";

test("docker 연결 이름만 잇고 다른 변수는 넘기지 않는다", () => {
  const base = { PATH: "/bin", DOCKER_CONTEXT: "remote", DOCKER_TLS_VERIFY: "1", DOCKER_CERT_PATH: "/c", SSH_AUTH_SOCK: "/s", SECRET_TOKEN: "x" };
  const env = minEnv({}, DOCKER_CONNECTION_NAMES, base) as Record<string, string>;
  assert.equal(env.DOCKER_CONTEXT, "remote");
  assert.equal(env.DOCKER_TLS_VERIFY, "1");
  assert.equal(env.DOCKER_CERT_PATH, "/c");
  assert.equal(env.SSH_AUTH_SOCK, "/s");
  assert.equal(env.SECRET_TOKEN, undefined);
});
