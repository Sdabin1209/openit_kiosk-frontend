// contract-validators.gen.cjs의 형. 생성 파일의 export 이름은 scripts/gen-validators.mjs의 USED와 같다.
export interface ErrorObject { instancePath: string; keyword: string; params: Record<string, unknown>; message?: string }
export interface ValidateFn { (data: unknown): boolean; errors?: ErrorObject[] | null }
export const DeviceConfig: ValidateFn;
export const KioskStartFragment: ValidateFn;
export const StaffPushPayload: ValidateFn;
