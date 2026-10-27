// 브라우저 시험(test:e2e)의 전제 점검. 부족하면 해결 명령을 말하고 비0으로 끝낸다.
// 해결은 표준 설치 명령만 안내한다(환경별 우회 없음).
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** 순수 함수: 점검 입력(이미 수집된 사실)으로 문제 목록을 만든다. 시험에서 가짜 입력을 넣는다. */
export function diagnose({ browserPath, browserExists, lddOutput, fontList }) {
  const problems = [];
  if (!browserExists) {
    problems.push({ what: `Playwright Chromium이 설치되어 있지 않습니다 (${browserPath ?? "경로 모름"})`, fix: "npx playwright install chromium" });
  } else if (lddOutput !== null) {
    const missing = [...lddOutput.matchAll(/^\s*(\S+)\s+=>\s+not found/gm)].map((m) => m[1]);
    if (missing.length) problems.push({ what: `Chromium이 필요로 하는 공유 라이브러리가 없습니다: ${[...new Set(missing)].join(", ")}`, fix: "sudo npx playwright install-deps chromium" });
  }
  if (!/Noto.*CJK|Nanum|Korean|UnDotum|Baekmuk/i.test(fontList ?? "")) {
    problems.push({ what: "한글 글꼴이 없습니다(스크린샷의 한글이 네모로 찍힙니다)", fix: "sudo apt-get install -y fonts-noto-cjk" });
  }
  return problems;
}

export function report(problems) {
  if (!problems.length) return { code: 0, text: "OK: 전제 충족 (Chromium 설치, 공유 라이브러리, 한글 글꼴)" };
  const lines = ["FAIL: 전제 미충족"];
  for (const p of problems) lines.push(`- ${p.what}`, `  해결: ${p.fix}`);
  lines.push("자세한 내용은 docs/runbook.md의 '전제 설치'를 보세요.");
  return { code: 1, text: lines.join("\n") };
}

async function gather() {
  let browserPath = null, browserExists = false, lddOutput = null, fontList = "";
  try {
    const { chromium } = await import("playwright");
    browserPath = chromium.executablePath();
    browserExists = !!browserPath && existsSync(browserPath);
  } catch { browserPath = "playwright 패키지 없음: npm ci 먼저"; }
  if (browserExists) {
    try { lddOutput = execFileSync("ldd", [browserPath], { encoding: "utf8" }); }
    catch (e) { lddOutput = String(e.stdout ?? ""); }
  }
  try { fontList = execFileSync("fc-list", [":lang=ko"], { encoding: "utf8" }); } catch { /* fc-list 없음 = 글꼴 없음으로 본다 */ }
  return { browserPath, browserExists, lddOutput, fontList };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = report(diagnose(await gather()));
  (r.code ? console.error : console.log)(r.text);
  process.exit(r.code);
}
