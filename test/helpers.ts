import { createMock, type Scenario } from "../mock-server/app.ts";
import type { AddressInfo } from "node:net";

export async function startMock(initial: Partial<Scenario> = {}, opt: { pingMs?: number } = {}) {
  const m = createMock(initial, opt);
  await new Promise<void>((r) => m.server.listen(0, "127.0.0.1", r)); // 고정 포트 금지
  const port = (m.server.address() as AddressInfo).port;
  return { ...m, port, base: `http://127.0.0.1:${port}`, close: () => { m.reset(); m.server.closeAllConnections(); return new Promise<void>((r) => m.server.close(() => r())); } };
}

export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
export const ok = (text: string | null = "응답", sig: unknown = null) => json({ response_text: text, turn_failure_signal: sig });
/** 신호(abort)를 따르는 응답 없는 fetch. */
export const hang = (init?: RequestInit) => new Promise<Response>((_, rej) => init?.signal?.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError"))));

/** 타이머 없이 마이크로태스크·I/O 콜백이 모두 처리될 때까지 이벤트 루프를 몇 바퀴 돌린다(부하와 무관하게 결정적). */
export const settle = async (rounds = 20) => { for (let i = 0; i < rounds; i++) await new Promise<void>((r) => setImmediate(r)); };

/** 조건이 참이 될 때까지 기다린다. 시간은 상한(실패 시에만 쓰임)일 뿐 통과 조건이 아니다. */
export async function waitFor(cond: () => boolean, what = "조건", timeoutMs = 10_000) {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > timeoutMs) throw new Error(`시간 초과: ${what}`);
    await new Promise<void>((r) => setImmediate(r));
  }
}

/** 세션 시작 응답(계약 2.2.0 D106): 서버가 발급한 session_id가 응답에 실린다. */
export const SERVER_SESSION_ID = "srv-Abc_123-xyz";
export const started = (text: string | null = "첫 질문", sig: unknown = null, sessionId: string = SERVER_SESSION_ID) => json({ response_text: text, turn_failure_signal: sig, session_id: sessionId });
/** 시작 응답에 서버 발급 session_id가 없으면 채워 준다(시작 종류와 상관없이 같은 응답을 주는 가짜 서버용). */
export async function asStarted(res: Response | Promise<Response>): Promise<Response> {
  const r = await res;
  if (!r.ok) return r;
  const b = await r.clone().json().catch(() => null);
  return b && typeof b === "object" && !("session_id" in b) ? json({ ...b, session_id: SERVER_SESSION_ID }) : r;
}
