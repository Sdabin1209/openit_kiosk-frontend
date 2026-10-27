// 키오스크 시작 값: 환자 참조(subject_ref)와 기기 토큰(PUBLIC_API.md 추가 인터페이스 A, F).
// 두 값 모두 메모리에만 둔다. 로그·콘솔·스토리지에 쓰지 않고, 쿼리 문자열은 서버 로그에 남으므로 쓰지 않는다.
// 받는 길: 시작 URL의 조각(#subject_ref=..., #device=...) 또는 기기 설정 /config.json({"device_token","subject_ref"}).
// 조각은 한 번 읽고 주소창에서 지운다(history.replaceState). 조각이 설정보다 먼저다.

export const SUBJECT_REF_RE = /^[A-Za-z0-9._:/#=+-]{1,128}$/;
export const DEVICE_TOKEN_RE = /^[\x21-\x7e]{1,512}$/; // 헤더에 그대로 넣을 수 있는 보이는 ASCII

export function isValidSubjectRef(v: unknown): v is string { return typeof v === "string" && SUBJECT_REF_RE.test(v); }
export function isValidDeviceToken(v: unknown): v is string { return typeof v === "string" && DEVICE_TOKEN_RE.test(v); }

export interface KioskStart {
  deviceToken: string | null;
  subjectRef: string | null;
  /** 값이 있었지만 형식이 틀렸다. 이때는 세션을 시작하지 않고 직원을 부른다. */
  subjectInvalid: boolean;
}

/** '#a=b&c=d' 파싱. '+'를 공백으로 바꾸지 않는다(subject_ref에 '+'가 허용된다). 첫 '='에서만 나눈다. */
export function parseFragment(hash: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of hash.replace(/^#/, "").split("&")) {
    const i = part.indexOf("=");
    if (i <= 0) continue;
    let v = part.slice(i + 1);
    try { v = decodeURIComponent(v); } catch { /* 그대로 둔다(형식 검증에서 걸러진다) */ }
    out[part.slice(0, i)] = v;
  }
  return out;
}

export interface FragmentWindow {
  location: { hash: string; pathname: string; search: string };
  history: { replaceState(data: unknown, unused: string, url?: string | null): void };
}

export async function loadKioskStart(win: FragmentWindow, fetchFn: typeof fetch = (...a) => globalThis.fetch(...a)): Promise<KioskStart> {
  const frag = parseFragment(win.location.hash);
  if (win.location.hash) win.history.replaceState(null, "", win.location.pathname + win.location.search); // 값을 주소창과 기록에서 지운다
  let device: string | undefined = frag.device;
  let subject: string | undefined = frag.subject_ref;
  if (device === undefined || subject === undefined) {
    try {
      const res = await fetchFn("/config.json", { cache: "no-store", credentials: "same-origin" });
      if (res.ok) {
        const c = (await res.json()) as Record<string, unknown>;
        if (device === undefined && typeof c?.device_token === "string") device = c.device_token;
        if (subject === undefined && typeof c?.subject_ref === "string") subject = c.subject_ref;
      }
    } catch { /* 설정이 없거나 JSON이 아니면 없는 것으로 본다 */ }
  }
  return {
    deviceToken: isValidDeviceToken(device) ? device : null,
    subjectRef: subject !== undefined && isValidSubjectRef(subject) ? subject : null,
    subjectInvalid: subject !== undefined && !isValidSubjectRef(subject),
  };
}
