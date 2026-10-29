// 고정한 계약 태그(Dockerfile ARG BOUNDARY_CONTRACT)의 내용을 읽는다. 옆 폴더 ../boundary-contracts의 현재 작업 트리가 아니라
// `git show <태그>:<경로>`로 읽는다: 옆 폴더가 더 앞서 가도(다른 영역이 새 태그로 올라가도) 이 영역의 시험과 생성물은 고정한 태그와 비교된다(구조 규칙 1, ADR 0027).
// 읽기 전용이다. 이 모듈은 이웃 폴더를 수정하지 않는다.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const BC_DIR = new URL("../../boundary-contracts/", import.meta.url).pathname;

export function pinnedTag() {
  const tag = readFileSync(new URL("Dockerfile", ROOT), "utf8").match(/^ARG BOUNDARY_CONTRACT=(\S+)/m)?.[1];
  if (!tag) throw new Error("Dockerfile에 ARG BOUNDARY_CONTRACT가 없습니다");
  return tag;
}
// 계약 리포의 schemas/는 boundary_contracts/schemas/로 가는 심볼릭 링크라 git show가 링크 너머 경로를 읽지 못한다: 실제 위치로 바꿔 읽는다.
const real = (p) => p.replace(/^schemas(\/|$)/, "boundary_contracts/schemas$1");
const git = (args) => {
  try { return execFileSync("git", ["-C", BC_DIR, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] }); }
  catch (e) { throw new Error(`계약 ${pinnedTag()}를 ${BC_DIR}에서 읽지 못했습니다(워크스페이스 구조와 태그 존재 확인): ${String(e.stderr ?? e.message).trim()}`); }
};
/** 고정 태그의 파일 내용(문자열). path는 계약 리포 루트 기준(예: "schemas/DeviceConfig.schema.json"). */
export const contractFile = (path) => git(["show", `${pinnedTag()}:${real(path)}`]);
export const contractJson = (path) => JSON.parse(contractFile(path));
/** 고정 태그의 디렉터리 항목 이름들(예: "examples"). */
export const contractList = (dir) => git(["ls-tree", "--name-only", `${pinnedTag()}:${real(dir)}`]).split("\n").filter(Boolean).map((p) => p.split("/").pop());
/** 고정 태그의 패키지 버전(pyproject.toml). */
export const contractVersion = () => contractFile("pyproject.toml").match(/^version\s*=\s*"([^"]+)"/m)?.[1] ?? "n/a";
