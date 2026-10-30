// 통신 컴포넌트(받는 쪽): 기기 설정 `GET /config.json`(계약 DeviceConfig)과 시작 URL 조각(#...)을 읽어 온다.
// 입력: 창(location·history). 출력: 조각 문자열, 설정 본문 또는 null(StartInput의 두 칸). 값의 검증·결정은 start_values 컴포넌트가 한다.
// 조각은 한 번 읽고 주소창과 기록에서 지운다(history.replaceState): 쿼리 문자열과 달리 서버 로그에 남지 않고, 값이 화면 기록에 남지 않게 한다.
// 설정을 읽을지는 wiring이 start_values의 판단(needsConfig)으로 정한다.

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

/** 기기 설정 본문. 없거나 JSON이 아니면 null(없는 것으로 본다). */
export async function readConfig(fetchFn: typeof fetch = (...a) => globalThis.fetch(...a)): Promise<unknown> {
  try {
    const res = await fetchFn("/config.json", { cache: "no-store", credentials: "same-origin" });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}
