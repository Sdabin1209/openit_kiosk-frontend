// 정적 검사(U422): 시험 코드에 실제 시간을 읽거나 기다리는 곳이 허용 목록 밖에 없다. 우리 코드의 시간은 시계 주입(ADR 0034)으로 가짜 시계를 넣는다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

// 허용: 가짜 시계 정의(helpers.ts, 매달림 감시 Date.now 하나 포함), 시험이 쥔 가짜 타이머 큐(sync.test.ts), 시계를 읽지 않는 고정 과거 날짜(setup-env.test.ts)
const ALLOW = new Set(["helpers.ts", "sync.test.ts", "setup-env.test.ts", "timing.test.ts", "test_structure.test.ts"]);
const BAD = /Date\.now|performance\.now|hrtime|setInterval|new Date|mock\.timers|\bsetTimeout\b|timeoutMs:\s*\d/;

test("시험 코드(test/*.test.ts)에 실제 시간을 읽거나 기다리는 곳이 허용 목록 밖에 없다", () => {
  const bad: string[] = [];
  for (const f of readdirSync("test").filter((n) => n.endsWith(".ts") && !ALLOW.has(n))) {
    readFileSync(`test/${f}`, "utf8").split("\n").forEach((l, i) => { if (BAD.test(l.replace(/\/\/.*$/, ""))) bad.push(`test/${f}:${i + 1}: ${l.trim().slice(0, 100)}`); });
  }
  assert.deepEqual(bad, []);
});

test("컴포넌트(src/components)는 시간을 직접 읽거나 기다리지 않는다: 시계는 인자로 받는다", () => {
  const bad: string[] = [];
  for (const f of readdirSync("src/components").filter((n) => n.endsWith(".ts"))) {
    readFileSync(`src/components/${f}`, "utf8").split("\n").forEach((l, i) => {
      const code = l.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "");
      // 인자로 받은 타이머 객체(this.timers.setTimeout, t.setTimeout, T.setInterval)와 타입 선언은 허용, 전역 호출만 금지
      if (/\((fn|h|handle): /.test(code)) return; // 타입 선언(메서드 시그니처)
      if (/(^|[^.\w])(setTimeout|setInterval|clearTimeout|clearInterval)\s*\(/.test(code) || /Date\.now|performance\.now|new Date\(/.test(code)) bad.push(`src/components/${f}:${i + 1}: ${l.trim().slice(0, 100)}`);
    });
  }
  assert.deepEqual(bad, []);
});
