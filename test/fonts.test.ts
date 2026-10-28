// #60 (표준성 점검 2026-10-29): 오프라인 글꼴을 이미지에 포함한다. 기대값의 출처:
//  - 브리프 5절 "번들은 작게, 오프라인 폰트 포함" / 4절 "외부 CDN을 쓰지 않는다"
//  - 결정표 2절 kiosk-frontend #60 "오프라인 글꼴(OFL 등 재배포 가능한 것)을 이미지에 포함", 지시 5항 "라이선스 파일을 함께 넣는다"
//  - SIL Open Font License 1.1 조건: 글꼴을 재배포할 때 저작권 고지와 라이선스 전문을 함께 둔다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");

test("글꼴 라이선스 전문(OFL 1.1)과 저작권 고지가 소스 트리와 dist에 함께 있다", () => {
  for (const p of ["assets/fonts/OFL.txt", "dist/fonts/OFL.txt"]) {
    assert.ok(existsSync(p), `${p} 없음`);
    const t = read(p);
    assert.match(t, /SIL OPEN FONT LICENSE Version 1\.1/i, `${p}: OFL 1.1 전문`);
    assert.match(t, /Copyright/i, `${p}: 저작권 고지`);
    assert.match(t, /PERMISSION & CONDITIONS/i, `${p}: 조건 절`);
  }
});

test("dist/fonts에 woff2 글꼴 파일이 들어 있고, 글꼴 CSS의 모든 url()이 실제 파일을 가리킨다", () => {
  assert.ok(existsSync("dist/fonts/fonts.css"), "dist/fonts/fonts.css");
  const css = read("dist/fonts/fonts.css");
  const urls = [...css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1].replace(/["']/g, ""));
  assert.ok(urls.length > 0, "url() 없음");
  for (const u of urls) {
    assert.ok(!/^[a-z]+:\/\//i.test(u) && !u.startsWith("//"), `외부 URL 금지: ${u}`);
    assert.ok(existsSync(`dist/fonts/${u.replace(/^\.\//, "")}`), `파일 없음: ${u}`);
  }
  assert.ok(readdirSync("dist/fonts/files").some((f) => f.endsWith(".woff2")));
  assert.match(css, /Noto Sans KR/);
  assert.match(css, /unicode-range/, "한글 글꼴은 조각(unicode-range)으로 나눠 필요한 것만 받는다");
});

test("글꼴 CSS가 두 앱의 HTML에서 불려 오고, 글꼴 스택의 첫 항목이 포함한 글꼴이다", () => {
  assert.match(read("dist/index.html"), /fonts\/fonts\.css/);
  assert.match(read("dist/staff/index.html"), /fonts\/fonts\.css/);
  assert.match(read("dist/kiosk.css"), /font:[^;]*"Noto Sans KR Variable"/);
});

test("포함한 글꼴의 출처와 라이선스가 assets/fonts/README.md에 적혀 있다", () => {
  const t = read("assets/fonts/README.md");
  assert.match(t, /@fontsource-variable\/noto-sans-kr/);
  assert.match(t, /5\.3\.1/);
  assert.match(t, /OFL/);
});

test("Dockerfile이 글꼴 자산을 빌드 단계로 복사한다", () => {
  assert.match(read("Dockerfile"), /COPY assets \.\/assets/);
});
