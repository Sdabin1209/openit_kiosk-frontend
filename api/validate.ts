// 응답 본문 검증(FAULT_POLICY 원칙 10): 형식이 맞지 않으면 성공으로 취급하지 않고(값을 지어내지 않고)
// 재시도 가능한 실패로 다룬다. 기준은 문진 스키마 FrontendInput.json / TurnFailureSignal.json 이다.
// (스키마 파일은 복사하지 않는다. 모양이 바뀌면 scripts/check-schema.mjs가 열거값을 대조한다.)

/** 응답 본문이 비었거나 JSON이 아니거나 스키마에 맞지 않는다. 5xx와 같이 재시도한다. */
export class BadBodyError extends Error {
  constructor(what: string) { super(`응답 본문이 올바르지 않습니다: ${what}`); this.name = "BadBodyError"; }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const WRITE = ["COMMITTED", "NOT_COMMITTED"], ALERT = ["NONE", "DELIVERED", "DELIVERY_FAILED"];

export function validateFrontendInput(v: unknown): void {
  if (!isObj(v)) throw new BadBodyError("객체가 아님");
  const t = v.response_text;
  if (!(t === null || (typeof t === "string" && t.length > 0))) throw new BadBodyError("response_text");
  const s = v.turn_failure_signal;
  if (s === null) return;
  if (!isObj(s) || typeof s.session_id !== "string" || s.session_id === "" || !WRITE.includes(s.write_committed as string) || !ALERT.includes(s.staff_alert as string)) throw new BadBodyError("turn_failure_signal");
}

export function validateSessionState(v: unknown): void {
  if (!isObj(v) || typeof v.state !== "string" || !(v.resume_text === null || typeof v.resume_text === "string")) throw new BadBodyError("SessionState");
}
