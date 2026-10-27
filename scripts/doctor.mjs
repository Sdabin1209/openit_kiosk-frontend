// 브라우저 시험의 전제 점검. 기본 전제는 Docker 하나(없으면 FAIL, 비0).
// --host: 호스트 직접 실행(선택)용 라이브러리·글꼴 안내. 경고만 내고 FAIL로 만들지 않는다.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Docker 전제(표준 경로). 못 쓰면 FAIL(level "fail"). */
export function diagnoseDocker({ hasDocker, daemonOk }) {
  if (!hasDocker) return [{ level: "fail", what: "docker 명령이 없습니다", fix: "Docker를 설치하세요" }];
  if (!daemonOk) return [{ level: "fail", what: "Docker 데몬에 연결할 수 없습니다", fix: "데몬을 시작하고 현재 사용자에게 접근 권한을 주세요" }];
  return [];
}

/** 호스트 직접 실행(test:e2e:host, 선택 사항)용 안내. 모두 경고(level "warn")이며 점검 결과를 FAIL로 만들지 않는다. */
export function diagnoseHost({ browserPath, browserExists, lddOutput, fontList }) {
  const notes = [];
  if (!browserExists) {
    notes.push({ level: "warn", what: `Playwright Chromium이 설치되어 있지 않습니다 (${browserPath ?? "경로 모름"})`, fix: "npx playwright install chromium" });
  } else if (lddOutput !== null) {
    const missing = [...lddOutput.matchAll(/^\s*(\S+)\s+=>\s+not found/gm)].map((m) => m[1]);
    if (missing.length) notes.push({ level: "warn", what: `Chromium이 필요로 하는 공유 라이브러리가 없습니다: ${[...new Set(missing)].join(", ")}`, fix: "sudo npx playwright install-deps chromium" });
  }
  if (!/Noto.*CJK|Nanum|Korean|UnDotum|Baekmuk/i.test(fontList ?? "")) {
    notes.push({ level: "warn", what: "한글 글꼴이 없습니다(스크린샷의 한글이 네모로 찍힙니다. 시험 통과에는 영향 없음)", fix: "sudo apt-get install -y fonts-noto-cjk" });
  }
  return notes;
}

export function report(items) {
  const fails = items.filter((i) => i.level === "fail");
  const lines = [];
  if (fails.length) lines.push("FAIL: 전제 미충족");
  else if (items.length) lines.push("OK (경고 있음, 안내만)");
  else lines.push("OK: 전제 충족");
  for (const p of items) lines.push(`- ${p.level === "fail" ? "" : "경고: "}${p.what}`, `  해결: ${p.fix}`);
  if (items.length) lines.push("자세한 내용은 docs/runbook.md의 '전제'를 보세요.");
  return { code: fails.length ? 1 : 0, text: lines.join("\n") };
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
  let items;
  if (process.argv.includes("--host")) items = diagnoseHost(await gather());
  else {
    const has = (() => { try { execFileSync("docker", ["--version"], { stdio: "ignore" }); return true; } catch { return false; } })();
    const up = has && (() => { try { execFileSync("docker", ["info"], { stdio: "ignore" }); return true; } catch { return false; } })();
    items = diagnoseDocker({ hasDocker: has, daemonOk: !!up });
  }
  const r = report(items);
  (r.code ? console.error : console.log)(r.text);
  process.exit(r.code);
}
