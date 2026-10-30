// 시작 값 컴포넌트: 키오스크 시작 값(환자 참조 subject_ref, 기기 토큰, 외부 음성 인식 허용)을 정한다(PUBLIC_API.md 추가 인터페이스 A, F).
// 입력 StartInput(주소창 조각 문자열 + 기기 설정 본문 또는 null) -> 출력 KioskStart. 읽어 오는 일(주소창, /config.json)은 link_device_config_receive가 한다.
// 두 값 모두 메모리에만 둔다. 로그·콘솔·스토리지에 쓰지 않고, 쿼리 문자열은 서버 로그에 남으므로 쓰지 않는다.
// 조각과 설정은 계약 스키마(DeviceConfig, KioskStartFragment)로 검증한다: 모르는 키가 있으면 그 출처를 통째로 쓰지 않는다. 조각이 설정보다 먼저다.
// 형식(토큰 1~512자 보이는 ASCII, 환자 참조 1~128자)은 계약 스키마가 정한다. 여기에 정규식을 되풀이하지 않는다(R7, ADR 0021).
import { DeviceConfig as vDeviceConfig, KioskStart as vKioskStart, KioskStartFragment as vFragment, StartInput as vStartInput, type ValidateFn } from "../types/validators.gen.cjs";
import type { KioskStart } from "../types/KioskStart.ts";
import type { StartInput } from "../types/StartInput.ts";

export type { KioskStart, StartInput };
/** 보관소가 내주는 값: KioskStart + 시작이 서버에 접수된 뒤 부르는 confirm. */
export type HeldStart = KioskStart & { confirm?: () => void };

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

/**
 * 계약을 어긴 객체에서 쓸 수 있는 키를 가린다. 스키마 규칙은 그대로 따르고, 어긴 범위만 정한다:
 * 객체 전체를 어긴 것(모르는 키, 객체 아님)은 통째로 쓰지 않고(fail closed), 한 키만 어긴 것은 그 키만 뺀다.
 * 왜: 한 키의 형식 오류(예: 환자 참조)를 이유로 다른 키(기기 토큰)까지 버리면 원인 구분이 사라지고, 모르는 키는 쓰는 쪽이 계약과 다르다는 신호라 믿지 않는다.
 */
function usableKeys(validate: ValidateFn, obj: unknown): { ok: Record<string, unknown>; bad: Set<string>; whole: boolean } {
  if (validate(obj)) return { ok: obj as Record<string, unknown>, bad: new Set(), whole: false };
  const bad = new Set<string>();
  let whole = false;
  for (const e of validate.errors ?? []) {
    const key = e.instancePath.split("/")[1];
    if (key === undefined) whole = true; else bad.add(key);
  }
  if (whole || typeof obj !== "object" || obj === null || Array.isArray(obj)) return { ok: {}, bad, whole: true };
  const ok = Object.fromEntries(Object.entries(obj).filter(([k]) => !bad.has(k)));
  return { ok, bad, whole: false };
}

function fromFragment(hash: string) {
  const raw = parseFragment(hash);
  const frag = usableKeys(vFragment, raw);
  // 환자 참조가 있었는데 쓸 수 없게 됐으면(형식 오류, 조각 전체 거부) 참조 없이 시작하지 않고 직원을 부르게 한다.
  return { device: frag.ok.device, subject: frag.ok.subject_ref, subjectBad: frag.bad.has("subject_ref") || (frag.whole && "subject_ref" in raw) };
}

/** 조각만으로 두 값이 모두 정해졌으면 기기 설정을 읽을 필요가 없다. */
export function needsConfig(hash: string): boolean {
  const f = fromFragment(hash);
  return f.device === undefined || f.subject === undefined;
}

export function resolveStart(input: StartInput): KioskStart {
  if (!vStartInput(input)) throw new Error("StartInput schema violation");
  const f = fromFragment(input.hash);
  let { device, subject, subjectBad } = f;
  let allowRemote = false;
  if (input.config !== null && (device === undefined || subject === undefined)) {
    const raw = input.config, c = usableKeys(vDeviceConfig, raw);
    if (device === undefined && typeof c.ok.device_token === "string") device = c.ok.device_token;
    if (subject === undefined && !subjectBad) {
      if (typeof c.ok.subject_ref === "string") subject = c.ok.subject_ref;
      else if (c.bad.has("subject_ref") || (c.whole && typeof raw === "object" && raw !== null && "subject_ref" in raw)) subjectBad = true;
    }
    if (c.ok.allow_remote_stt === true) allowRemote = true;
  }
  const out: KioskStart = {
    deviceToken: typeof device === "string" ? device : null,
    subjectRef: typeof subject === "string" ? subject : null,
    subjectInvalid: subjectBad,
    ...(allowRemote ? { allowRemoteStt: true as const } : {}),
  };
  if (!vKioskStart(out)) throw new Error("KioskStart schema violation");
  return out;
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
    async take(): Promise<HeldStart> {
      await ready;
      const ref = held.subjectRef, invalid = held.subjectInvalid;
      // 비우는 것은 시작이 서버에 접수된 뒤(confirm)다. 시작이 실패하면 같은 참조로 다시 시작할 수 있고, 성공한 시작에 쓴 값은 다음 시작에 다시 나오지 않는다.
      const confirm = () => { if (held.subjectRef === ref) held.subjectRef = null; if (held.subjectInvalid === invalid) held.subjectInvalid = false; };
      return { deviceToken: held.deviceToken, subjectRef: ref, subjectInvalid: invalid, ...(held.allowRemoteStt ? { allowRemoteStt: true as const } : {}), confirm };
    },
  };
}
