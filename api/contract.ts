// 계약(boundary-contracts)에 승격된 이 영역 경계 스키마의 검증기(D107). 손으로 쓴 키·형식 검사를 대신한다.
// 검증기 코드는 계약 스키마에서 생성한다(scripts/gen-validators.mjs, ADR 0021). 스키마는 모르는 키를 거부한다(MANIFEST note).
import gen from "./contract-validators.gen.cjs";
import type { ValidateFn } from "./contract-validators.gen.cjs";

export type { ValidateFn };
export const validateDeviceConfig: ValidateFn = gen.DeviceConfig;
export const validateKioskStartFragment: ValidateFn = gen.KioskStartFragment;
export const validateStaffPushPayload: ValidateFn = gen.StaffPushPayload;

/**
 * 계약을 어긴 객체에서 쓸 수 있는 키를 가린다. 스키마 규칙은 그대로 따르고, 어긴 범위만 정한다:
 * 객체 전체를 어긴 것(모르는 키, 객체 아님)은 통째로 쓰지 않고(fail closed), 한 키만 어긴 것은 그 키만 뺀다.
 * 왜: 한 키의 형식 오류(예: 환자 참조)를 이유로 다른 키(기기 토큰)까지 버리면 원인 구분이 사라지고, 모르는 키는 쓰는 쪽이 계약과 다르다는 신호라 믿지 않는다.
 */
export function usableKeys(validate: ValidateFn, obj: unknown): { ok: Record<string, unknown>; bad: Set<string>; whole: boolean } {
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
