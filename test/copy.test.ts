// #61 (표준성 점검 2026-10-29, D89 임상 문구 통제): 환자에게 보이는 문구는 한 모듈(apps/kiosk/messages.ts)에만 있고,
// 항목마다 임상 검토 여부(reviewed: boolean)를 가진다. 다른 소스(apps/kiosk/*.ts)에는 한글 문자열 리터럴이 없다.
// 기대값의 출처: 결정표 standards-decisions-2026-10-29.md 2절 kiosk-frontend #61. 이 시험이 쓴 구현이 아니라 그 결정이 기준이다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const DIR = new URL("../apps/kiosk/", import.meta.url);
const HANGUL = /[가-힣]/;
/** 주석을 지운다(문자열 안의 // 는 한글 리터럴 검사에 영향이 없어 단순 처리). */
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
/** 한글이 든 문자열 리터럴(따옴표, 작은따옴표, 템플릿). */
const literals = (s: string) => [...s.matchAll(/(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g)].map((m) => m[2]).filter((t) => HANGUL.test(t));

test("환자 노출 문구가 문구 모듈(messages.ts) 밖의 소스에 리터럴로 없다", () => {
  const files = readdirSync(DIR).filter((f) => f.endsWith(".ts") && f !== "messages.ts");
  assert.ok(files.length >= 5, "키오스크 소스를 읽었다");
  const found: string[] = [];
  for (const f of files) for (const t of literals(stripComments(readFileSync(new URL(f, DIR), "utf8")))) found.push(`${f}: ${t}`);
  assert.deepEqual(found, [], "문구 모듈 밖의 한글 리터럴");
});

test("index.html에도 환자 노출 문구가 직접 박혀 있지 않다(제목 태그 제외)", () => {
  const html = readFileSync(new URL("index.html", DIR), "utf8").replace(/<title>[\s\S]*?<\/title>/, "");
  assert.equal(HANGUL.test(html), false, "index.html의 본문·속성에 한글이 있다");
});

test("문구 모듈의 모든 항목은 text(문자열)와 reviewed(불리언)를 가진다", async () => {
  const m: any = await import("../apps/kiosk/messages.ts");
  assert.ok(m.MSG && typeof m.MSG === "object", "MSG 내보내기");
  const keys = Object.keys(m.MSG);
  assert.ok(keys.length >= 30, `항목 수 ${keys.length}`);
  for (const k of keys) {
    const e = m.MSG[k];
    assert.equal(typeof e.text, "string", `${k}.text`);
    assert.equal(typeof e.reviewed, "boolean", `${k}.reviewed`);
    assert.ok(e.text.length > 0, `${k}.text 비어 있음`);
  }
});

test("지금 임상 검토를 받은 문구는 없다: 모든 항목이 reviewed=false", async () => {
  // 사실 확인용: 검토 기록이 생기면(헤드가 확인) 이 시험을 고친다. 검토 없이 true로 바꾸는 것을 막는다.
  const m: any = await import("../apps/kiosk/messages.ts");
  const yes = Object.entries<any>(m.MSG).filter(([, e]) => e.reviewed).map(([k]) => k);
  assert.deepEqual(yes, []);
});
