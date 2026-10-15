// ../survey-service/schema/schemas(읽기 전용)의 열거값이 api/types.ts와 같은지 대조한다. 스키마 복사본은 두지 않는다.
import { readFileSync } from "node:fs";
const dir = new URL("../../survey-service/schema/schemas/", import.meta.url);
const read = (n) => JSON.parse(readFileSync(new URL(n, dir), "utf8"));
const consts = (o) => (o.oneOf ?? []).map((x) => x.const);
const fi = read("FrontendInput.json").$defs.TurnFailureSignal.properties;
const iv = read("InterventionDecision.json").$defs.Decision;
const src = readFileSync(new URL("../api/types.ts", import.meta.url), "utf8");
const arr = (name) => JSON.parse(src.match(new RegExp(`${name} = (\\[[^\\]]*\\])`))[1].replace(/'/g, '"'));
const eq = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
let bad = 0;
for (const [name, want] of [["WRITE_COMMITTED", consts(fi.write_committed)], ["STAFF_ALERT", consts(fi.staff_alert)], ["DECISIONS", consts(iv)]]) {
  if (!eq(arr(name), want)) { console.error(`불일치 ${name}: types.ts=${arr(name)} schema=${want}`); bad++; }
}
if (bad) process.exit(1);
console.log("스키마 열거값 일치");
