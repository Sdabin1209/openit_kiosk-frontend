// 직원 콘솔 조립: 개입 결정 컴포넌트에 보내기·확인 창·턴 ID 발급을 주입하고, 알림 동기화에 서버 면(목록 + 스트림)을 준다.
import { InterventionDeciding } from "../components/intervention_decision.ts";
import { createAlertSync, type SyncDeps } from "../components/alert_sync.ts";
import { newTurnId } from "./ids.ts";
import { realIntervals } from "./clock.ts";
import { realTimers } from "./clock.ts";
import type { StaffApi } from "./public_api.ts";

export function createInterventionDeciding(api: Pick<StaffApi, "intervene">, confirm: (message: string) => Promise<boolean>, newId: () => string = newTurnId): InterventionDeciding {
  return new InterventionDeciding((s, d, t) => api.intervene(s, d, t), confirm, newId);
}
export function createStaffAlertSync(api: StaffApi, d: Omit<SyncDeps, "api" | "timers" | "streamTimers"> & Partial<Pick<SyncDeps, "timers" | "streamTimers">>) {
  return createAlertSync({ ...d, api, timers: d.timers ?? realIntervals, streamTimers: d.streamTimers ?? realTimers });
}
