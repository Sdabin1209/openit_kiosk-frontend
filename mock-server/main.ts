import { SCENARIO_PRESETS, createMock } from "./app.ts";
import { makeStaticHandler } from "../server/static.mjs";

const name = process.env.MOCK_SCENARIO ?? "normal";
const { server } = createMock({ ...(SCENARIO_PRESETS[name] ?? {}), vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? null, deviceToken: process.env.MOCK_DEVICE_TOKEN || null, requireSubjectRef: process.env.MOCK_REQUIRE_SUBJECT_REF === "1" });
const staticDir = process.env.STATIC_DIR;
if (staticDir) {
  // 시연용: 같은 출처에서 정적 파일과 /v1을 함께 낸다(게이트웨이 대역).
  const api = server.listeners("request")[0] as (...a: any[]) => void;
  server.removeAllListeners("request");
  const st = makeStaticHandler({ dir: staticDir });
  server.on("request", (req, res) => {
    const p = req.url ?? "";
    if (p.startsWith("/v1/") || p.startsWith("/__mock/")) api(req, res); else void st(req, res);
  });
}
const port = Number(process.env.PORT ?? 0);
server.listen(port, "127.0.0.1", () => {
  const a = server.address();
  console.log(JSON.stringify({ msg: "mock listening", port: typeof a === "object" && a ? a.port : port, scenario: name }));
});
