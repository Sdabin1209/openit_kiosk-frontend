// 고정한 계약 태그(Dockerfile ARG BOUNDARY_CONTRACT)의 내용을 읽는다. 옆 폴더 ../boundary-contracts의 현재 작업 트리가 아니라
// `git show <태그>:<경로>`로 읽는다: 옆 폴더가 더 앞서 가도(다른 영역이 새 태그로 올라가도) 이 영역의 시험과 생성물은 고정한 태그와 비교된다(구조 규칙 1, ADR 0027).
// 읽기 전용이다. 이 모듈은 이웃 폴더를 수정하지 않는다.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync } from "node:fs";

// 의존 리포 위치(pip 의 git+ssh…@태그 설치와 같은 원칙: 판은 고정 태그 하나, 위치는 정해진 순서로 찾는다):
//   1. 환경 변수(OPENIT_<이름>_REPO) 2. 옆 폴더에 그 태그가 있으면 옆 폴더 3. 원격 리포에서 그 태그만 git 제외 캐시(build/deps/<이름>.git)로 받는다
const DEPS = new URL("../build/deps/", import.meta.url).pathname;
const hasTag = (dir, tag) => { try { execFileSync("git", ["-C", dir, "rev-parse", "--verify", "--quiet", `${tag}^{commit}`], { stdio: "ignore" }); return true; } catch { return false; } };
export function depRepo(name, envName, sibling, remote, tag) {
  const env = process.env[envName];
  if (env) return env;
  if (existsSync(sibling) && hasTag(sibling, tag)) return sibling;
  const cache = DEPS + name + ".git";
  if (hasTag(cache + "-" + tag, tag)) return cache + "-" + tag;
  // 동시에 도는 시험 여럿이 같은 캐시를 받을 수 있다: 임시 폴더에 받은 뒤 rename 으로 한 번에 놓는다(원자적). 먼저 놓인 것이 있으면 그것을 쓴다
  mkdirSync(DEPS, { recursive: true });
  const tmp = mkdtempSync(DEPS + name + ".tmp-");
  execFileSync("git", ["clone", "-q", "--bare", "--depth", "1", "--branch", tag, remote, tmp + "/r.git"], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("git", ["-C", tmp + "/r.git", "tag", "-f", tag, "HEAD"], { stdio: "ignore" });
  const dst = cache + "-" + tag;
  try { renameSync(tmp + "/r.git", dst); } catch { /* 다른 프로세스가 먼저 놓았다 */ }
  rmSync(tmp, { recursive: true, force: true });
  if (!hasTag(dst, tag)) throw new Error(`계약 ${tag} 를 원격에서 받지 못했다`);
  return dst;
}

const ROOT = new URL("../", import.meta.url);
let BC_DIR_CACHE;
const bcDir = () => (BC_DIR_CACHE ??= depRepo("boundary-contracts", "OPENIT_BOUNDARY_CONTRACTS_REPO", new URL("../../boundary-contracts/", import.meta.url).pathname,
  "git@github.com:Sdabin1209/openit_boundary-contracts.git", pinnedTag()));

export function pinnedTag() {
  const tag = readFileSync(new URL("Dockerfile", ROOT), "utf8").match(/^ARG BOUNDARY_CONTRACT=(\S+)/m)?.[1];
  if (!tag) throw new Error("Dockerfile에 ARG BOUNDARY_CONTRACT가 없습니다");
  return tag;
}
// 계약 리포의 schemas/는 boundary_contracts/schemas/로 가는 심볼릭 링크라 git show가 링크 너머 경로를 읽지 못한다: 실제 위치로 바꿔 읽는다.
const real = (p) => p.replace(/^schemas(\/|$)/, "boundary_contracts/schemas$1");
const git = (args) => {
  try { return execFileSync("git", ["-C", bcDir(), ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] }); }
  catch (e) { throw new Error(`계약 ${pinnedTag()}를 ${bcDir()}에서 읽지 못했습니다(워크스페이스 구조와 태그 존재 확인): ${String(e.stderr ?? e.message).trim()}`); }
};
/** 고정 태그의 파일 내용(문자열). path는 계약 리포 루트 기준(예: "schemas/DeviceConfig.schema.json"). */
export const contractFile = (path) => git(["show", `${pinnedTag()}:${real(path)}`]);
export const contractJson = (path) => JSON.parse(contractFile(path));
/** 고정 태그의 디렉터리 항목 이름들(예: "examples"). */
export const contractList = (dir) => git(["ls-tree", "--name-only", `${pinnedTag()}:${real(dir)}`]).split("\n").filter(Boolean).map((p) => p.split("/").pop());
/** 고정 태그의 패키지 버전(pyproject.toml). */
export const contractVersion = () => contractFile("pyproject.toml").match(/^version\s*=\s*"([^"]+)"/m)?.[1] ?? "n/a";

// 문진 스키마(survey-service 리포의 태그). 공개 API 본문 타입 생성(scripts/gen-types.mjs)이 옆 폴더의 작업 트리가 아니라 이 태그에서 읽는다(U410, 계약과 같은 이유: ADR 0027).
// 이 영역은 문진 스키마를 이미지에 넣지 않으므로 이 값은 이미지 라벨이 아니다(ADR 0031).
export const SURVEY_SCHEMA_TAG = "survey-schema-v5.0.0";
let SURVEY_DIR_CACHE;
const surveyDir = () => (SURVEY_DIR_CACHE ??= depRepo("survey-service", "OPENIT_SURVEY_SERVICE_REPO", new URL("../../survey-service/", import.meta.url).pathname,
  "git@github.com:Sdabin1209/openit_survey-service.git", SURVEY_SCHEMA_TAG));
export const surveySchemaJson = (name) => {
  try { return JSON.parse(execFileSync("git", ["-C", surveyDir(), "show", `${SURVEY_SCHEMA_TAG}:schema/schemas/${name}.json`], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] })); }
  catch (e) { throw new Error(`문진 스키마 ${SURVEY_SCHEMA_TAG}를 ${surveyDir()}에서 읽지 못했습니다: ${String(e.stderr ?? e.message).trim()}`); }
};

export const surveySchemaNames = () => execFileSync("git", ["-C", surveyDir(), "ls-tree", "--name-only", `${SURVEY_SCHEMA_TAG}:schema/schemas`], { encoding: "utf8" }).split("\n").filter((name) => name.endsWith(".json")).map((name) => name.slice(0, -5));

/** 계약 안정 URI(계약 5.0.1). 문진 스키마 5.0.0 은 계약 칸을 이 주소의 $ref 로 가리킨다. */
export const contractUri = () => `https://openit.example/contracts/v${contractVersion().split(".")[0]}/`;
/** 고정 태그의 계약 스키마 전부를 안정 URI 와 파일 이름 두 이름으로, 문진 스키마를 survey/v1 주소로 ajv 에 등록한다(오프라인). 문진 스키마를 컴파일하기 전에 부른다. */
export function registerContractSchemas(ajv, transform = (s) => s) {
  for (const file of contractList("schemas").filter((f) => f.endsWith(".schema.json"))) ajv.addSchema({ ...transform(contractJson(`schemas/${file}`)), $id: contractUri() + file }, file);
  // 계약도 문진 스키마를 이 주소로 가리킨다(PublicApiRequests 등). 고정 태그의 문진 스키마를 같은 주소로 등록한다.
  for (const n of surveySchemaNames()) ajv.addSchema({ ...transform(surveySchemaJson(n)), $id: `https://openit.example/survey/v1/${n}.json` });
}
