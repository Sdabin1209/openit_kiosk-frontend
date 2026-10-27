// ../survey-service/schema/schemas(읽기 전용)의 열거값이 api/types.ts와 같은지 대조한다. 스키마 복사본은 두지 않는다.
import { existsSync, readFileSync } from "node:fs";
const dir = new URL("../../survey-service/schema/schemas/", import.meta.url);
const bdir = new URL("../../boundary-contracts/schemas/", import.meta.url);
const read = (n) => JSON.parse(readFileSync(new URL(n, dir), "utf8"));
const consts = (o) => (o.oneOf ?? []).map((x) => x.const);
const fi = read("FrontendInput.json").$defs.TurnFailureSignal.properties;
const iv = read("InterventionDecision.json").$defs.Decision;
const bread = (n) => JSON.parse(readFileSync(new URL(n, bdir), "utf8"));
const ss = bread("SessionState.schema.json");
const st = bread("StaffAlert.schema.json");
const src = readFileSync(new URL("../api/types.ts", import.meta.url), "utf8");
const arr = (name) => JSON.parse(src.match(new RegExp(`${name} = (\\[[^\\]]*\\])`))[1].replace(/'/g, '"'));
const eq = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
let bad = 0;
for (const [name, want] of [["WRITE_COMMITTED", consts(fi.write_committed)], ["STAFF_ALERT", consts(fi.staff_alert)], ["DECISIONS", consts(iv)], ["SESSION_STATES", ss.properties.state.enum], ["ALERT_STATUS", st.properties.status.enum]]) {
  if (!eq(arr(name), want)) { console.error(`불일치 ${name}: types.ts=${arr(name)} schema=${want}`); bad++; }
}
// 계약 버전 대조: 기준 계약(../boundary-contracts)의 패키지 버전과 pipeline_schema_version이 이 영역의 표기와 같아야 한다.
const bc = (n) => readFileSync(new URL(`../../boundary-contracts/${n}`, import.meta.url), "utf8");
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
console.log(`스키마 열거값 일치, 계약 v${ver}(pipeline ${pipe}) 표기 일치`);
