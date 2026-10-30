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

/** 시험이 쥔 가짜 타이머(시계 주입, ADR 0034): 시간은 시험이 advance할 때만 흐른다. 실제 시간을 기다리지 않는다. */
export function fakeTimers() {
  type T = { id: number; fn: () => void; at: number };
  let q: T[] = [], id = 0, now = 0;
  return {
    setTimeout(fn: () => void, ms: number): unknown { q.push({ id: ++id, fn, at: now + ms }); return id; },
    clearTimeout(h: unknown): void { q = q.filter((x) => x.id !== h); },
    /** ms만큼 시간을 흘리고 만기가 된 타이머를 시각 순서로 실행한다. */
    advance(ms: number): void {
      const end = now + ms;
      for (;;) { const due = q.filter((x) => x.at <= end).sort((a, b) => a.at - b.at || a.id - b.id)[0]; if (!due) break; q = q.filter((x) => x !== due); now = Math.max(now, due.at); due.fn(); }
      now = end;
    },
    pending: () => q.length,
  };
}
/** 가짜 의존이 즉시 시간 초과를 낸다: 클라이언트 자신의 타이머가 발동했을 때 fetch가 내는 AbortError와 같은 것. 시간을 재지 않는다(U421). */
export const timesOut = () => Promise.reject(new DOMException("timeout", "AbortError"));

/** 타이머 없이 마이크로태스크·I/O 콜백이 모두 처리될 때까지 이벤트 루프를 몇 바퀴 돌린다(부하와 무관하게 결정적). */
export const settle = async (rounds = 20) => { for (let i = 0; i < rounds; i++) await new Promise<void>((r) => setImmediate(r)); };

/** 조건이 참이 될 때까지 기다린다. 시간은 상한(실패 시에만 쓰임)일 뿐 통과 조건이 아니다. */
/** 매달림 감시(U422): 시험이 자기 가짜에게서 신호를 기다리는 대기의 바깥 마감(초). 정상이면 즉시(이벤트 루프 몇 바퀴) 끝나고 코드가 진짜로 멈췄을 때만 걸린다.
 * 판정(옳고 그름)이 아니다. 숫자를 시험마다 쓰지 않고 이 상수 하나로 통일한다. 300초는 헤드 지시(U422)가 정한 값이다. */
export const HANG_GUARD_SECONDS = 300;
export async function waitFor(cond: () => boolean, what = "조건", timeoutMs = HANG_GUARD_SECONDS * 1000) {
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
