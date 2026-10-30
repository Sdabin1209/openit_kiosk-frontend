/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: survey-service survey-schema-v3.0.0 schema/schemas/StaffSessionView.json */


export type SessionId = string
export type SessionStatus = ("IN_PROGRESS" | "PAUSED_RISK" | "ENDED_COMPLETE" | "ENDED_STAFF" | "ENDED_LEFT" | "ENDED_USER_STOP")
/**
 * UTC ISO 8601, 초 단위, 끝에 Z.
 */
export type Timestamp = string
/**
 * 공개 알림 종류 이름. 목록 StaffAlert와 세션 보기가 같은 이름을 쓴다(PUBLIC_API.md 2.2.0). 내부 위험 알림 종류 RISK는 공개할 때 RISK_STOP이다.
 */
export type AlertKind = ("RISK_STOP" | "CALL_STAFF" | "USER_CALLED_STAFF")
/**
 * 병원이 정한 불투명 환자·방문 참조.
 */
export type SubjectRef = string

/**
 * GET /v1/staff/sessions/{session_id}의 응답. 직원이 세션의 대화 기록과 저장된 값을 읽는다(읽기 전용). 세션 문서(SessionStore)와 직원 알림 저장소에서 만든다. 세션 문서에 시각이 없어 서비스가 따로 남긴 시각이 없는 항목(이 기능 이전의 세션)은 turn_id·at·created_at이 null이다.
 */
export interface StaffSessionView {
session_id: SessionId
status: SessionStatus
release_id: (string | null)
created_at: (Timestamp | null)
turns: StaffTurn[]
values: StaffValue[]
alerts: StaffViewAlert[]
subject_ref: (SubjectRef | null)
/**
 * 정지 사유(2.1.0, CR-H002). 위험 신호/위험 규칙은 RISK, 되묻기 한도 초과는 REASK_LIMIT, 그 밖은 OTHER. optional: 없으면 미상. 읽는 쪽은 모르는 값을 OTHER로 취급한다.
 */
pause_reason?: ("RISK" | "REASK_LIMIT" | "OTHER" | null)
}
/**
 * 대화 로그 한 항목. turn_index는 로그의 위치(0부터). 시작·종료·개입 항목은 utterance가 null일 수 있다.
 */
export interface StaffTurn {
turn_index: number
turn_id: (string | null)
at: (Timestamp | null)
utterance: (string | null)
response_text: (string | null)
action: (string | null)
}
/**
 * 저장된 값 한 칸(값이 없는 칸은 나오지 않는다). key는 모델 키(Q7_1[soju].amount). status는 ANSWERED, 정정된 적이 있으면 CORRECTION.
 */
export interface StaffValue {
key: string
value: unknown
status: string
precision: ("exact" | "approximate" | "unspecified")
}
/**
 * 직원 알림. rule_id는 위험 규칙 엔진이 낸 알림에만 있고 나머지는 null(발화 원문이 아니다).
 */
export interface StaffViewAlert {
alert_id: string
kind: AlertKind
status: ("OPEN" | "RESOLVED")
created_at: Timestamp
rule_id: (string | null)
/**
 * 알림을 해결한 직원 계정 ID. 열려 있거나 개입 없이(이탈 등) 해결됐으면 null.
 */
resolved_by: (string | null)
/**
 * 정지 사유(2.1.0, CR-H002). 위험 신호/위험 규칙은 RISK, 되묻기 한도 초과는 REASK_LIMIT, 그 밖은 OTHER. optional: 없으면 미상. 읽는 쪽은 모르는 값을 OTHER로 취급한다.
 */
pause_reason?: ("RISK" | "REASK_LIMIT" | "OTHER" | null)
delivery_attempts?: number
last_delivery_status?: ("DELIVERED" | "DELIVERY_FAILED" | null)
manual_notice_outcome?: ("STAFF_NOTIFIED_MANUALLY" | "NOT_NOTIFIED" | null)
manual_notice_reported_at?: (Timestamp | null)
}
