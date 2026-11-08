// 통신 컴포넌트(받는 쪽): 기기 설정 `GET /config.json`(계약 DeviceConfig)과 시작 URL 조각(#...)을 읽어 온다.
// 입력: 창(location·history). 출력: 조각 문자열, 설정 본문 또는 null(StartInput의 두 칸). 값의 검증·결정은 start_values 컴포넌트가 한다.
// 조각은 한 번 읽고 주소창과 기록에서 지운다(history.replaceState): 쿼리 문자열과 달리 서버 로그에 남지 않고, 값이 화면 기록에 남지 않게 한다.
// 설정은 조각과 무관하게 항상 읽는다(allow_remote_stt 가 설정에만 있다).
export interface FragmentWindow {
  location: { hash: string; pathname: string; search: string };
  history: { replaceState(data: unknown, unused: string, url?: string | null): void };
}

/** 시작 URL 조각을 읽고 주소창·기록에서 지운다. 값은 문자열(`#a=b&...`) 그대로 돌려준다(해석은 start_values). */
export function readFragment(win: FragmentWindow): string {
  const hash = win.location.hash;
  if (hash) win.history.replaceState(null, "", win.location.pathname + win.location.search); // 값을 주소창과 기록에서 지운다
  return hash;
}

export interface ConfigTimers { setTimeout(fn: () => void, ms: number): unknown; clearTimeout(handle: unknown): void }

/** 기기 설정 본문. 없거나 JSON이 아니거나 시간 안에 오지 않으면 null(없는 것으로 본다). 타이머와 상한은 기본값이 없다: wiring이 넣는다(시계 주입, ADR 0034). */
export async function readConfig(fetchFn: typeof fetch = (...a) => globalThis.fetch(...a), timers: ConfigTimers, timeoutMs: number): Promise<unknown> {
  // 왜 상한: 시작이 이 읽기를 기다리므로(wiring/kiosk.ts) 응답이 멈추면 재시도 예산·직원 호출 화면 전에 시작이 멈춘다. 설정은 선택이라 못 읽으면 없는 것으로 본다(ADR 0043).
  // 왜 신호만이 아니라 경쟁: fetch 가 signal 을 무시해도(대역·옛 구현) 끝나게 하고, 타이머를 끝에 지운다.
  const ctl = new AbortController();
  let timer: unknown;
  const timedOut = new Promise<null>((resolve) => { timer = timers.setTimeout(() => { ctl.abort(); resolve(null); }, timeoutMs); });
  const read = (async () => {
    try {
      const res = await fetchFn("/config.json", { cache: "no-store", credentials: "same-origin", signal: ctl.signal });
      return res.ok ? await res.json() as unknown : null;
    } catch { return null; }
  })();
  try { return await Promise.race([read, timedOut]); } finally { timers.clearTimeout(timer); }
}
