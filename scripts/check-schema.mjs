import addFormats from "ajv-formats";
// 문진 스키마(고정 태그)의 이 영역의 표기(계약 버전, 모의 서버 pipeline 버전)와 서버 스키마(StaffSessionView)를 대조한다. 스키마 복사본은 두지 않는다.
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { contractFile, registerContractSchemas, surveySchemaJson } from "./contract-source.mjs";
// 문진 스키마와 계약은 고정 태그에서 읽는다(contract-source.mjs: 환경 변수 → 옆 폴더 → 원격 태그 캐시). 옆 폴더의 작업 트리는 읽지 않는다.
// 열거값 대조는 하지 않는다: 공개 API 본문 타입은 문진 스키마와 계약에서 생성한다(scripts/gen-types.mjs --check가 최신인지 본다, D117).
let bad = 0;
// 계약 버전 대조: 기준 계약(../boundary-contracts)의 패키지 버전과 pipeline_schema_version이 이 영역의 표기와 같아야 한다.
const bc = (n) => contractFile(n);
const ver = bc("pyproject.toml").match(/^version\s*=\s*"([^"]+)"/m)?.[1];
const pipe = bc("boundary_contracts/schemas_api.py").match(/PIPELINE_SCHEMA_VERSION\s*=\s*"([^"]+)"/)?.[1];
const docker = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8").match(/ARG BOUNDARY_CONTRACT=(\S+)/)?.[1];
const { createMock, PIPELINE_SCHEMA_VERSION: mock } = await import("../mock-server/app.ts");
if (docker !== `v${ver}`) { console.error(`불일치 Dockerfile BOUNDARY_CONTRACT=${docker} 계약=v${ver}`); bad++; }
if (mock !== pipe) { console.error(`불일치 모의 서버 pipeline_schema_version=${mock} 계약=${pipe}`); bad++; }
// 고정 태그의 스키마가 없거나 모의 서버 응답이 어긋나면 실패한다.
const svSchema = surveySchemaJson("StaffSessionView");
const { Ajv2020 } = await import("ajv/dist/2020.js");
const ajv = addFormats(new Ajv2020({ strict: false }));
registerContractSchemas(ajv); // 문진 스키마 5.0.0 의 계약 안정 URI $ref 를 고정 태그 계약에서 푼다
const validateSv = ajv.compile(svSchema);
const validateInput = ajv.compile(surveySchemaJson("FrontendInput"));
const m = createMock({});
await new Promise((r) => m.server.listen(0, "127.0.0.1", r));
try {
  const base = `http://127.0.0.1:${m.server.address().port}`;
  const request = async (method, path, body, headers = {}) => {
    const response = await fetch(base + path, { method, headers: { "Content-Type": "application/json", ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    assert.equal(response.status, 200, `모의 서버 상태 불일치: ${method} ${path}`);
    return response.json();
  };
  const post = async (path, body, headers) => {
    const out = await request("POST", path, body, headers);
    assert.ok(validateInput(out), `FrontendInput 불일치: ${JSON.stringify(validateInput.errors)}`);
    return out;
  };
  const view = async (sid) => {
    const out = await request("GET", `/v1/staff/sessions/${encodeURIComponent(sid)}`);
    assert.ok(validateSv(out), `StaffSessionView 불일치: ${JSON.stringify(validateSv.errors)}`);
    assert.equal(out.session_id, sid);
    return out;
  };
  const start = await post("/v1/sessions", { kind: "SESSION_START", subject_ref: "visit:chk/1" });
  assert.equal(typeof start.session_id, "string");
  assert.ok(start.session_id.length > 0);
  const sid = start.session_id;
  const path = `/v1/sessions/${encodeURIComponent(sid)}`;
  await post(`${path}/turns`, { kind: "UTTERANCE", session_id: sid, utterance: "가짜", turn_id: "t1" });
  await post(`${path}/turns`, { kind: "UTTERANCE", session_id: sid, utterance: "위험", turn_id: "t2" });
  const opened = await view(sid);
  assert.equal(opened.alerts.length, 1);
  assert.equal(opened.alerts[0].resolved_by, null);
  await post(`${path}/intervention`, { session_id: sid, decision: "RESUME", turn_id: "t3" }, { "x-openit-user": "staff-chk" });
  const resolved = await view(sid);
  assert.equal(resolved.subject_ref, "visit:chk/1");
  assert.equal(resolved.alerts[0].resolved_by, "staff-chk");
  const second = await post("/v1/sessions", { kind: "SESSION_START" });
  assert.equal(typeof second.session_id, "string");
  assert.notEqual(second.session_id, sid);
  assert.equal((await view(second.session_id)).subject_ref, null);
} finally {
  m.reset();
  m.server.closeAllConnections();
  await new Promise((r) => m.server.close(r));
}
const sessionViewNote = "StaffSessionView: 모의 서버 응답이 서버 스키마와 일치(PASS)";
if (bad) process.exit(1);
console.log(sessionViewNote);
console.log(`계약 v${ver}(pipeline ${pipe}) 표기 일치`);
