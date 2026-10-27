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
// StaffSessionView: GET /v1/staff/sessions/{session_id}. 직원이 기록을 읽기 전용으로 본다.
// 서버 스키마(StaffSessionView.json)가 배포되면 check-schema가 대조한다. 읽을 때는 관대하게: 모르는 값도 그대로 보인다.
export interface StaffSessionTurn {
  turn_index: number;
  turn_id: string;
  at: string;
  utterance: string | null;
  response_text: string | null;
  action: string | null;
}
export interface StaffSessionValue {
  key: string;
  value: unknown;
  status: string;
  precision: string;
}
export interface StaffSessionAlert {
  alert_id: string;
  kind: "RISK" | "CALL_STAFF" | "USER_CALLED_STAFF" | (string & {});
  status: "OPEN" | "RESOLVED" | (string & {});
  created_at: string;
  rule_id: string | null;
}
export interface StaffSessionView {
  session_id: string;
  status: string;
  release_id: string | null;
  created_at: string;
  turns: StaffSessionTurn[];
  values: StaffSessionValue[];
  alerts: StaffSessionAlert[];
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
