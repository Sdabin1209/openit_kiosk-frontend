// 계약 2.3.0(PUBLIC_API.md F절, ADR 0012, D113): 키오스크 기기 인증은 게이트웨이의 mTLS다. 앱은 기기 자격을 보내지 않는다.
// 기기 토큰이 없어도 세션 시작~종료가 되고, 토큰이 있으면 2.x 호환으로 Bearer를 싣는다. 모의 서버는 게이트웨이를 흉내 내
// X-Openit-Device를 기기 ID로 받는다(없거나 형식이 틀리면 401, 다른 기기의 세션은 404).
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createPublicApiClient } from "../src/wiring/public_api.ts";
import type { PublicApiClient } from "../src/components/link_public_api_send.ts";
import { createKioskFlow } from "../src/wiring/kiosk.ts";
import type { KioskFlow } from "../src/components/kiosk_flow.ts";
import { startMock } from "./helpers.ts";

const open: Array<() => Promise<void>> = [];
after(async () => { for (const c of open) await c(); });
const fast = { retry: { maxAttempts: 3 }, sleep: async () => {} };

async function gateway() {
  const m = await startMock({ gatewayDevice: true } as any);
  open.push(async () => { m.server.closeAllConnections(); await new Promise<void>((r) => m.server.close(() => r())); });
  return m;
}
/** 게이트웨이 흉내: 클라이언트가 보낸 X-Openit-Device를 지우고 인증된 기기 ID를 붙인다. */
const viaGateway = (base: string, deviceId: string | null) => ((u: string, init: RequestInit) => {
  const h = new Headers(init.headers); h.delete("x-openit-device"); if (deviceId) h.set("x-openit-device", deviceId);
  return fetch(u, { ...init, headers: h });
}) as any;

test("토큰 없이 게이트웨이(기기 ID 헤더)를 거치면 세션 시작, 발화, 종료까지 된다", async () => {
  const m = await gateway();
  const api = createPublicApiClient({ baseUrl: m.base + "/v1", ...fast, fetch: viaGateway(m.base, "kiosk-01") });
  const flow = createKioskFlow(api, { startValues: async () => ({ deviceToken: null, subjectRef: null, subjectInvalid: false }) });
  await flow.start();
  assert.equal(flow.current.state, "LISTENING");
  await flow.hear({ text: "머리가 아파요", confidence: 0.9 });
  assert.equal(flow.current.state, "LISTENING");
  await flow.end();
  assert.equal(flow.current.state, "ENDED");
  assert.equal(flow.current.endFailed, undefined);
});

test("모의 게이트웨이: 기기 ID 헤더가 없거나 형식이 틀리면 401, 다른 기기의 세션은 404", async () => {
  const m = await gateway();
  const start = (dev: string | null) => viaGateway(m.base, dev)(m.base + "/v1/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "SESSION_START" }) }) as Promise<Response>;
  assert.equal((await start(null)).status, 401);
  assert.equal((await start("bad id!")).status, 401);
  const ok = await start("kiosk-01");
  assert.equal(ok.status, 200);
  const sid = ((await ok.json()) as any).session_id;
  const turn = (dev: string) => viaGateway(m.base, dev)(`${m.base}/v1/sessions/${sid}/turns`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ session_id: sid, kind: "UTTERANCE", utterance: "안녕", turn_id: "t-1" }) }) as Promise<Response>;
  assert.equal((await turn("kiosk-02")).status, 404, "다른 기기는 그 세션에 접근할 수 없다");
  assert.equal((await turn("kiosk-01")).status, 200);
});
