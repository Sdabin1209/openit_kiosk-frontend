import { build } from "esbuild";
import { cpSync, mkdirSync, rmSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist/staff", { recursive: true });
const common = { bundle: true, minify: true, target: "es2022", format: "iife", logLevel: "info", legalComments: "none" };
await build({ ...common, entryPoints: ["apps/kiosk/main.ts"], outfile: "dist/kiosk.js" });
await build({ ...common, entryPoints: ["apps/staff/main.ts"], outfile: "dist/staff/staff.js" });
await build({ ...common, entryPoints: ["apps/staff/sw.ts"], outfile: "dist/staff/sw.js" });
cpSync("apps/kiosk/index.html", "dist/index.html");
cpSync("apps/kiosk/kiosk.css", "dist/kiosk.css");
cpSync("apps/staff/index.html", "dist/staff/index.html");
cpSync("apps/staff/staff.css", "dist/staff/staff.css");
// 오프라인 글꼴(OFL 1.1, assets/fonts/README.md). 외부 CDN을 쓰지 않으므로 이미지에 같이 넣는다(브리프 5절, #60).
cpSync("assets/fonts", "dist/fonts", { recursive: true });
