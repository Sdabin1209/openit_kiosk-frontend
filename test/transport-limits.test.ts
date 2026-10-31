// 계약 CONVENTIONS 9절(2.2.2): HTTP 서버(waitress 등)가 앱 전에 내는 413/414/431은 본문이 BoundaryError가 아닐 수 있다(text/plain).
// 클라이언트는 본문과 무관하게 INVALID_RECORD(재시도 안 함)로 읽는다. 환자에게는 기존 실패 안내(직원 호출)가 나간다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createPublicApiClient } from "../src/wiring/public_api.ts";
import { ApiError } from "../src/components/link_public_api_send.ts";
import { createKioskFlow } from "../src/wiring/kiosk.ts";
import { settle, started } from "./helpers.ts";

const plain = (status: number) => new Response(`${status} transport limit`, { status, headers: { "content-type": "text/plain" } });
function make(status: number) {
  let n = 0; const waits: number[] = [];
  const api = createPublicApiClient({ sleep: async (ms) => { waits.push(ms); }, rand: () => 0.5, fetch: (async (_u: string, init: RequestInit) => {
    n++;
    return JSON.parse(init.body as string).kind === "SESSION_START" ? started("질문") : plain(status);
  }) as any });
  return { api, count: () => n, waits };
}

for (const status of [413, 414, 431]) {
  test(`${status} text/plain 응답: 재시도 0회, ApiError code는 INVALID_RECORD(계약 CONVENTIONS 9절)`, async () => {
    const { api, count, waits } = make(status);
    const id = (await api.startSession(null)).session_id;
    const before = count();
    await assert.rejects(api.sendUtterance(id, "머리가 아파요", "t-1"), (e: unknown) => {
      assert.ok(e instanceof ApiError);
      assert.equal(e.status, status);
      assert.equal(e.code, "INVALID_RECORD");
      return true;
    });
    assert.equal(count() - before, 1, "재시도하지 않는다");
    assert.deepEqual(waits, []);
  });

  test(`${status} text/plain 응답: 환자에게는 기존 실패 안내(직원 호출 화면)가 나가고 다시 보내지 않는다`, async () => {
    const { api, count } = make(status);
    const flow = createKioskFlow(api);
    await flow.start(); await settle();
    const before = count();
    await flow.hear({ text: "머리가 아파요", confidence: 0.9 }); await settle();
    assert.equal(flow.current.state, "CALL_STAFF");
    assert.equal(flow.current.callStaffReason, "RETRY_EXHAUSTED");
    assert.equal(count() - before, 1);
  });
}

test("JSON 본문이 있는 BoundaryError의 code는 그대로 쓴다", () => {
  assert.equal(new ApiError(400, { code: "INVALID_RECORD", message: "x", retryable: false } as any).code, "INVALID_RECORD");
  assert.equal(new ApiError(404, { code: "NOT_FOUND", message: "x", retryable: false } as any).code, "NOT_FOUND");
  assert.equal(new ApiError(500, null).code, null);
});
