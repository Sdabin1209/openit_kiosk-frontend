// docker 를 부르는 모든 스크립트·시험이 쓰는 환경 한 곳. 사용자 전역 ~/.docker 설정(Windows 자격 도우미 credsStore)에 기대지 않게 한다.
// 왜: 이 영역이 받는 기반 이미지는 공개 이미지를 digest 로 고정한 것이라 레지스트리 자격이 필요 없다. 그런데 전역 설정의 자격 도우미가 응답하지 않으면
//     (Docker Desktop vsock 110) `docker build` 가 "error getting credentials" 로 실패했다. 표준 환경 변수 DOCKER_CONFIG 로 리포 안 빈 설정({})을 주면 도우미를 부르지 않는다(deploy D10(5) 와 같은 결정).
// 왜 DOCKER_HOST: DOCKER_CONFIG 를 바꾸면 사용자의 docker 컨텍스트(예: 다른 소켓·원격 엔진)도 안 보인다. 기본(unix:///var/run/docker.sock)이 아닐 때만 그 엔드포인트를 DOCKER_HOST 로 넘긴다.
// 호출자가 DOCKER_CONFIG 를 이미 주었으면 그대로 쓴다(deploy 가 인증이 필요한 레지스트리용 자기 설정 폴더를 넘기는 경우, deploy 의 DEPLOY_DOCKER_CONFIG 와 같은 규칙). 없을 때만 아래 빈 설정을 쓴다.
// 사용자 ~/.docker 는 이 파일이 읽지도 고치지도 않는다(컨텍스트 엔드포인트는 docker CLI 에게 묻는다). 설정 폴더는 git 제외 폴더 build/docker-config 다.
// 사용: Node 는 `dockerEnv()` 를 spawn 의 env 로, 셸은 `eval "$(node scripts/docker-env.mjs --sh)"`.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DEFAULT_HOST = "unix:///var/run/docker.sock";
const CONFIG_DIR = fileURLToPath(new URL("../build/docker-config/", import.meta.url));

export function dockerEnv(base = process.env) {
  const env = { ...base };
  if (!env.DOCKER_HOST) {
    let host = "";
    // 컨텍스트는 호출자의 DOCKER_CONFIG(없으면 사용자 기본)로 묻는다: 바꾸기 전의 설정이 가리키는 엔진을 알아야 한다. 묻지 못하면(엔진 없음) 기본 소켓으로 둔다.
    try { host = execFileSync(env.DOCKER || "docker", ["context", "inspect", "--format", "{{.Endpoints.docker.Host}}"], { env, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { /* 기본 */ }
    if (host && host !== DEFAULT_HOST) env.DOCKER_HOST = host;
  }
  if (!env.DOCKER_CONFIG) {
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(`${CONFIG_DIR}config.json`, "{}\n");
    env.DOCKER_CONFIG = CONFIG_DIR.replace(/\/$/, "");
  }
  return env;
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv.includes("--sh")) {
  const e = dockerEnv();
  const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
  process.stdout.write(`export DOCKER_CONFIG=${q(e.DOCKER_CONFIG)}\n${e.DOCKER_HOST ? `export DOCKER_HOST=${q(e.DOCKER_HOST)}\n` : ""}`);
}
