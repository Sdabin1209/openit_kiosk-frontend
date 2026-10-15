import { createMock, type Scenario } from "../mock-server/app.ts";
import type { AddressInfo } from "node:net";

export async function startMock(initial: Partial<Scenario> = {}) {
  const m = createMock(initial);
  await new Promise<void>((r) => m.server.listen(0, "127.0.0.1", r)); // 고정 포트 금지
  const port = (m.server.address() as AddressInfo).port;
  return { ...m, port, base: `http://127.0.0.1:${port}`, close: () => { m.reset(); m.server.closeAllConnections(); return new Promise<void>((r) => m.server.close(() => r())); } };
}

export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
export const ok = (text: string | null = "응답", sig: unknown = null) => json({ response_text: text, turn_failure_signal: sig });
/** 신호(abort)를 따르는 응답 없는 fetch. */
export const hang = (init?: RequestInit) => new Promise<Response>((_, rej) => init?.signal?.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError"))));
