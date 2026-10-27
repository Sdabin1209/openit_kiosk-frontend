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
  /** 기기 설정(/config.json allow_remote_stt: true)에서만 켠다. 없으면 필드를 두지 않는다(기본 꺼짐, D88 U3). */
  allowRemoteStt?: boolean;
  /** 시작 요청이 서버에 접수된 뒤 부른다. 그때에야 한 번 쓴 환자 참조를 비운다. */
  confirm?: () => void;
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
  let allowRemote = false;
  if (device === undefined || subject === undefined) {
    try {
      const res = await fetchFn("/config.json", { cache: "no-store", credentials: "same-origin" });
      if (res.ok) {
        const c = (await res.json()) as Record<string, unknown>;
        if (device === undefined && typeof c?.device_token === "string") device = c.device_token;
        if (subject === undefined && typeof c?.subject_ref === "string") subject = c.subject_ref;
        if (c?.allow_remote_stt === true) allowRemote = true;
      }
    } catch { /* 설정이 없거나 JSON이 아니면 없는 것으로 본다 */ }
  }
  return {
    deviceToken: isValidDeviceToken(device) ? device : null,
    subjectRef: subject !== undefined && isValidSubjectRef(subject) ? subject : null,
    subjectInvalid: subject !== undefined && !isValidSubjectRef(subject),
    ...(allowRemote ? { allowRemoteStt: true } : {}),
  };
}

/**
 * 시작 값 보관소. 기기 토큰은 계속 쓰지만 환자 참조(subject_ref)는 한 번 꺼내면 비운다:
 * 새로고침 없이 다음 환자가 시작할 때 이전 환자의 참조가 다시 쓰이면 건강 정보가 다른 사람 기록에 붙는다(감사 P1).
 * 다음 시작에 새 참조가 없으면 null로 돌려주고, 키오스크는 참조 없이 시작한다.
 * 접수 연동이 기기당 고정 참조인지 환자마다 새 URL인지는 사용자 확인 대기이며, 그 전의 안전한 기본이다.
 */
export function createStartHolder(load: () => Promise<KioskStart>) {
  const held: KioskStart = { deviceToken: null, subjectRef: null, subjectInvalid: false };
  const ready = load().then((s) => { Object.assign(held, s); return held; });
  return {
    /** 기기 설정이 읽힌 뒤 풀리는 약속(STT 설정 등에 쓴다). 환자 참조는 담지 않고 take()만 소비한다. */
    loaded: ready.then((h) => ({ allowRemoteStt: h.allowRemoteStt === true })),
    /** 기기 토큰(요청 헤더용, 계속 유지). */
    deviceToken: (): string | null => held.deviceToken,
    /** 시작할 때마다 부른다. 돌려준 confirm()을 시작 성공 뒤에 부르면 참조와 형식 오류 표시를 비운다. */
    async take(): Promise<KioskStart> {
      await ready;
      const ref = held.subjectRef, invalid = held.subjectInvalid;
      // 비우는 것은 시작이 서버에 접수된 뒤(confirm)다. 시작이 실패하면 같은 참조로 다시 시작할 수 있고, 성공한 시작에 쓴 값은 다음 시작에 다시 나오지 않는다.
      const confirm = () => { if (held.subjectRef === ref) held.subjectRef = null; if (held.subjectInvalid === invalid) held.subjectInvalid = false; };
      return { deviceToken: held.deviceToken, subjectRef: ref, subjectInvalid: invalid, ...(held.allowRemoteStt ? { allowRemoteStt: true } : {}), confirm };
    },
  };
}
