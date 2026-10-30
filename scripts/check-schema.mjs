// ../survey-service/schema/schemas(읽기 전용)의 이 영역의 표기(계약 버전, 모의 서버 pipeline 버전)와 서버 스키마(StaffSessionView)를 대조한다. 스키마 복사본은 두지 않는다.
import { existsSync, readFileSync } from "node:fs";
import { contractFile } from "./contract-source.mjs";
// 왜: 이 대조는 이웃 폴더(문진 스키마, 계약)를 읽기 전용으로 읽는다. 없을 때 ENOENT 스택 대신 이유와 해결을 내고 비0으로 끝낸다.
for (const rel of ["../../survey-service/schema/schemas/", "../../boundary-contracts/schemas/"]) { // 계약은 git 태그에서 읽고 폴더는 그 저장소가 있는지 보려는 것이다
  if (!existsSync(new URL(rel, import.meta.url))) {
    console.error(`check-schema: 필요한 이웃 폴더가 없습니다 (이 리포 기준 ${rel.slice(3)}). 워크스페이스 구조(survey-service, boundary-contracts가 이 리포와 같은 상위 폴더에 있음)에서 실행하세요.`);
    process.exit(1);
  }
}
const dir = new URL("../../survey-service/schema/schemas/", import.meta.url);
// 열거값 대조는 하지 않는다: 공개 API 본문 타입은 문진 스키마와 계약에서 생성한다(scripts/gen-types.mjs --check가 최신인지 본다, D117).
let bad = 0;
// 계약 버전 대조: 기준 계약(../boundary-contracts)의 패키지 버전과 pipeline_schema_version이 이 영역의 표기와 같아야 한다.
const bc = (n) => contractFile(n);
const ver = bc("pyproject.toml").match(/^version\s*=\s*"([^"]+)"/m)?.[1];
const pipe = bc("boundary_contracts/schemas_api.py").match(/PIPELINE_SCHEMA_VERSION\s*=\s*"([^"]+)"/)?.[1];
const docker = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8").match(/ARG BOUNDARY_CONTRACT=(\S+)/)?.[1];
const mock = readFileSync(new URL("../mock-server/app.ts", import.meta.url), "utf8").match(/PIPELINE_SCHEMA_VERSION = "([^"]+)"/)?.[1];
if (docker !== `v${ver}`) { console.error(`불일치 Dockerfile BOUNDARY_CONTRACT=${docker} 계약=v${ver}`); bad++; }
if (mock !== pipe) { console.error(`불일치 모의 서버 pipeline_schema_version=${mock} 계약=${pipe}`); bad++; }
// StaffSessionView: 서버 스키마가 아직 없으면 대조하지 않는다. PASS로 세지 않는다.
let sessionViewNote = "StaffSessionView: 대상 아님(서버 스키마 대기) - PASS로 세지 않음";
const svUrl = new URL("StaffSessionView.json", dir);
if (existsSync(svUrl)) {
  const { Ajv2020 } = await import("ajv/dist/2020.js");
  const { createMock } = await import("../mock-server/app.ts");
  const validateSv = new Ajv2020({ strict: false }).compile(JSON.parse(readFileSync(svUrl, "utf8")));
  const m = createMock({}); await new Promise((r) => m.server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${m.server.address().port}`;
  const post = (p, b, h = {}) => fetch(base + p, { method: "POST", headers: h, body: JSON.stringify(b) }).then((r) => r.json());
  await post("/v1/sessions", { kind: "SESSION_START", session_id: "chk", subject_ref: "visit:chk/1" });
  await post("/v1/sessions/chk/turns", { kind: "UTTERANCE", session_id: "chk", utterance: "가짜", turn_id: "t1" });
  await post("/v1/sessions/chk/turns", { kind: "UTTERANCE", session_id: "chk", utterance: "위험", turn_id: "t2" });
  const views = [await (await fetch(`${base}/v1/staff/sessions/chk`)).json()]; // 열린 알림(resolved_by null)
  await post("/v1/sessions/chk/intervention", { session_id: "chk", decision: "RESUME", turn_id: "t3" }, { "x-openit-user": "staff-chk" });
  views.push(await (await fetch(`${base}/v1/staff/sessions/chk`)).json()); // 해결된 알림(resolved_by 문자열)
  await post("/v1/sessions", { kind: "SESSION_START", session_id: "chk2" });
  views.push(await (await fetch(`${base}/v1/staff/sessions/chk2`)).json()); // subject_ref null
  if (views[1].subject_ref !== "visit:chk/1" || views[1].alerts[0].resolved_by !== "staff-chk" || views[2].subject_ref !== null) { console.error("모의 서버가 subject_ref·resolved_by를 채우지 않음"); bad++; }
  m.reset(); m.server.closeAllConnections(); m.server.close();
  if (views.every((v) => validateSv(v))) sessionViewNote = "StaffSessionView: 모의 서버 응답이 서버 스키마와 일치(PASS)";
  else { const v = views.find((x) => !validateSv(x)); validateSv(v); console.error("불일치 StaffSessionView:", JSON.stringify(validateSv.errors)); bad++; }
}
if (bad) process.exit(1);
console.log(sessionViewNote);
console.log(`계약 v${ver}(pipeline ${pipe}) 표기 일치`);
