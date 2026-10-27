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
