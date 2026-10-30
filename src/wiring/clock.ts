// 실제 시계와 타이머. 컴포넌트는 시간을 직접 읽거나 기다리지 않고 이것을 인자로 받는다(시계 주입, ADR 0034).
// 시험은 가짜 시계를 넣고 시간을 직접 흘린다. 이 파일만 전역 setTimeout·Date.now를 쓴다.
export interface Timers {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}
export const realNow = (): number => Date.now();
export const realSleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
export const realTimers: Timers = { setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: (h) => clearTimeout(h as number) };
/** 키오스크 상태 기계용: Node 시험 프로세스가 타이머 때문에 끝나지 않는 일이 없게 unref한다(브라우저의 타이머는 숫자라 unref가 없다). */
export const realFlowTimers = {
  set: (fn: () => void, ms: number): unknown => { const h = setTimeout(fn, ms) as unknown as { unref?: () => void }; h.unref?.(); return h; },
  clear: (h: unknown): void => clearTimeout(h as number),
};
export const realIntervals = { setInterval: (fn: () => void, ms: number): unknown => setInterval(fn, ms), clearInterval: (h: unknown): void => clearInterval(h as number) };
