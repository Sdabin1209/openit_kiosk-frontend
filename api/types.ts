// PUBLIC_API.md (I10)와 문진 스키마 FrontendInput/TurnFailureSignal에 대응하는 타입.
// scripts/check-schema.mjs가 열거값을 ../survey-service/schema/schemas와 대조한다.
export const WRITE_COMMITTED = ["COMMITTED", "NOT_COMMITTED"] as const;
export const STAFF_ALERT = ["NONE", "DELIVERED", "DELIVERY_FAILED"] as const;
export const DECISIONS = ["RESUME", "END"] as const;

export type WriteCommitted = (typeof WRITE_COMMITTED)[number];
export type StaffAlertState = (typeof STAFF_ALERT)[number];
export type Decision = (typeof DECISIONS)[number];

export interface TurnFailureSignal {
  session_id: string;
  write_committed: WriteCommitted;
  staff_alert: StaffAlertState;
}
export interface FrontendInput {
  response_text: string | null;
  turn_failure_signal: TurnFailureSignal | null;
}
export const SESSION_STATES = ["ACTIVE", "PAUSED_RISK", "ENDED"] as const;
export const ALERT_STATUS = ["OPEN", "RESOLVED"] as const;

// StaffAlert / StaffAlertPage / SessionState / PushConfig: boundary-contracts v2.0.2 schemas.
// 읽을 때는 관대하게: kind, status, state에 모르는 값이 올 수 있다.
export interface StaffAlert {
  alert_id: string;
  session_id: string;
  kind: string;
  created_at: string;
  status: "OPEN" | "RESOLVED" | (string & {});
  resolved_by_decision?: "RESUME" | "END" | (string & {}) | null;
  resolved_at?: string | null;
}
export interface StaffAlertPage {
  items: StaffAlert[];
  next_cursor: string | null;
}
export interface SessionState {
  session_id: string;
  state: "ACTIVE" | "PAUSED_RISK" | "ENDED" | (string & {});
  resume_text: string | null;
}
export interface PushConfig {
  vapid_public_key: string | null;
}
export interface PushSubscriptionJson {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  [k: string]: unknown;
}
export interface BoundaryError {
  pipeline_schema_version?: string;
  code: string;
  message: string;
  retryable: boolean;
  details?: unknown;
}
