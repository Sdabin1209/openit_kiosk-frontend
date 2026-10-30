// 문진이 서버에서 끝난 경우: 응답 뒤 세션 상태 조회가 ENDED이면 키오스크는 종료 화면으로 간다(PUBLIC_API.md 세션 상태 행: 서버가 끝내면 ENDED).
// FrontendInput에는 "끝났다"는 필드가 없어 상태 조회(정지 확인용으로 이미 하던 호출)의 값을 쓴다. 새 요청은 늘지 않는다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createPublicApiClient } from "../src/wiring/public_api.ts";
import type { PublicApiClient } from "../src/components/link_public_api_send.ts";
import { createKioskFlow } from "../src/wiring/kiosk.ts";
import type { KioskFlow } from "../src/components/kiosk_flow.ts";
import { ok, settle, started } from "./helpers.ts";

function make(stateValue: "ACTIVE" | "ENDED") {
  const calls: string[] = [];
  const api = createPublicApiClient({ sleep: async () => {}, fetch: (async (u: string, init: RequestInit) => {
    calls.push(`${init.method} ${u}`);
    if (u.endsWith("/state")) return new Response(JSON.stringify({ session_id: "s-1", state: stateValue, resume_text: null }), { status: 200 });
    const b = init.body ? JSON.parse(init.body as string) : {};
    return b.kind === "SESSION_START" ? started("첫 질문") : ok("문진이 끝났습니다. 감사합니다.");
  }) as any });
  return { api, calls };
}

test("서버가 세션을 끝냈으면(상태 ENDED) 종료 화면으로 가고 마지막 안내 문장을 보이며 종료 요청을 다시 보내지 않는다", async () => {
  const { api, calls } = make("ENDED");
  const flow = createKioskFlow(api);
  const convo: string[] = [];
  flow.subscribeConversation((e) => convo.push(e.type));
  await flow.start(); await settle();
  await flow.hear({ text: "열은 없어요", confidence: 0.9 }); await settle();
  assert.equal(flow.current.state, "ENDED");
  assert.equal(flow.current.text, "문진이 끝났습니다. 감사합니다.");
  assert.equal(flow.current.endFailed, undefined);
  assert.equal(calls.some((c) => c.includes("/end")), false);
  assert.equal(convo[convo.length - 1], "CLEAR", "종료하면 대화를 지운다(ADR 0015)");
});

test("상태가 ACTIVE이면 기존대로 계속 듣는다", async () => {
  const { api } = make("ACTIVE");
  const flow = createKioskFlow(api);
  await flow.start(); await settle();
  await flow.hear({ text: "열은 없어요", confidence: 0.9 }); await settle();
  assert.equal(flow.current.state, "LISTENING");
});
