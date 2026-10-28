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
/** POST /v1/sessions 본문. subject_ref는 병원이 정한 불투명 환자 참조(없으면 필드 생략). */
export interface SessionStart {
  session_id: string;
  kind: "SESSION_START";
  subject_ref?: string;
  turn_id?: string;
}
export interface FrontendInput {
  response_text: string | null;
  turn_failure_signal: TurnFailureSignal | null;
}
export const PAUSE_REASONS = ["RISK", "REASK_LIMIT", "OTHER"] as const;
export type PauseReason = (typeof PAUSE_REASONS)[number];
/** 읽는 쪽 규약(PUBLIC_API.md H절): 모르는 값은 OTHER. 값이 없으면(옛 서버, 정지 아님) undefined = 미상. */
export function normalizePauseReason(v: unknown): PauseReason | undefined {
  if (v === undefined || v === null) return undefined;
  return (PAUSE_REASONS as readonly unknown[]).includes(v) ? (v as PauseReason) : "OTHER";
}
export const STAFF_CALL_OUTCOMES = ["STAFF_NOTIFIED_MANUALLY", "NOT_NOTIFIED"] as const;
export type StaffCallOutcome = (typeof STAFF_CALL_OUTCOMES)[number];
/** POST /v1/sessions/{id}/staff-call/retry 응답(2.1.0, StaffCallRetryResult). */
export interface StaffCallRetryResult {
  alert_id: string;
  staff_alert: "DELIVERED" | "DELIVERY_FAILED";
  delivery_attempts: number;
  retry_after_s: number;
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
  // 2.1.0(CR-H001·H002) optional 필드. 옛 서버는 보내지 않는다.
  delivery_attempts?: number;
  last_delivery_status?: "DELIVERED" | "DELIVERY_FAILED" | (string & {});
  manual_notice_outcome?: StaffCallOutcome | (string & {}) | null;
  manual_notice_reported_at?: string | null;
  pause_reason?: PauseReason | (string & {}) | null;
}
export interface StaffAlertPage {
  items: StaffAlert[];
  next_cursor: string | null;
}
export interface SessionState {
  session_id: string;
  state: "ACTIVE" | "PAUSED_RISK" | "ENDED" | (string & {});
  resume_text: string | null;
  /** 2.1.0(CR-H002): state=PAUSED_RISK일 때의 정지 사유. 옛 서버는 보내지 않는다. 모르는 값은 OTHER로 읽는다(normalizePauseReason). */
  pause_reason?: PauseReason | (string & {}) | null;
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
  /** 해결한 직원 ID(게이트웨이 헤더에서 서비스가 기록). 열린 알림은 null. */
  resolved_by: string | null;
  // 2.1.0 optional(CR-H001·H002). 옛 서버는 보내지 않는다.
  delivery_attempts?: number;
  last_delivery_status?: string;
  manual_notice_outcome?: string | null;
  manual_notice_reported_at?: string | null;
  pause_reason?: string | null;
}
export interface StaffSessionView {
  session_id: string;
  status: string;
  release_id: string | null;
  /** 환자 참조(불투명). 환자 식별 정보이므로 화면에만 보인다. */
  subject_ref: string | null;
  created_at: string;
  turns: StaffSessionTurn[];
  values: StaffSessionValue[];
  alerts: StaffSessionAlert[];
  /** 2.1.0(CR-H002, survey-service 스키마가 정한다): 세션이 PAUSED_RISK일 때 정지 사유. */
  pause_reason?: string | null;
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
