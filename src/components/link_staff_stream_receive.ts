// 통신 컴포넌트(받는 쪽): 직원 알림 실시간 스트림(SSE, GET /v1/staff/alerts/stream, PUBLIC_API.md)을 받는다.
// 입력: 스트림 주소와 재연결·하트비트 판단 함수(wiring이 retry_policy와 config 값으로 만든다). 출력: StaffAlert 이벤트와 연결 상태.
// 재연결은 EventSource에 맡기지 않고 직접 한다: 브라우저는 HTTP 오류(502·503·504 등)를 받으면 재연결 없이 CLOSED로 끝내고, 재연결 간격에도 백오프·지터가 없다.
// 그래서 오류가 나면 늘 닫고 지수 백오프(+지터, 예산 없음)로 새로 연다. 새 EventSource는 Last-Event-ID를 보내지 않으므로 놓친 알림은 호출자가 onState(true) 때 목록 API로 보충해야 한다.
// 모르는 형식의 이벤트는 무시한다(죽지 않음).
import type { StaffAlert } from "../types/contract/StaffAlert.ts";

export interface StreamOptions {
  /** 같은 출처의 /v1. */
  baseUrl?: string;
  eventSource?: (url: string) => EventSource;
  /** n번째 재연결(1부터) 앞의 대기(ms). wiring이 retry_policy.backoffMs에 직원 스트림 정책을 넣어 준다. */
  backoffMs: (attempt: number) => number;
  /** 하트비트가 이만큼 없으면 죽은 연결로 본다(ms). wiring이 config의 STAFF_HEARTBEAT로 만든다. */
  heartbeatTimeoutMs: () => number;
  /**
   * EventSource는 상태 코드를 알려 주지 않으므로(WHATWG) 연결이 닫혀 스스로 다시 열리지 않으면 같은 인증으로 `GET /v1/staff/alerts?status=OPEN&limit=1`을 한 번 불러 상태와 Retry-After만 읽는다
   * (PUBLIC_API 직원 콘솔 SSE). 구독이 아니다. 없으면 상태를 모르는 채 백오프로만 다시 연결한다.
   */
  probe?: () => Promise<{ status: number; retryAfterMs: number | null }>;
}
export type StreamTimers = { setTimeout: (fn: () => void, ms: number) => unknown; clearTimeout: (h: unknown) => void };

export function openStaffStream(
  o: StreamOptions,
  onAlert: (a: StaffAlert) => void,
  onState: (connected: boolean, info?: { attempt: number; nextRetryMs: number | null }) => void,
  t: StreamTimers,
  hooks: { onResync?: () => void; /** 탐침이 401: 로그인 세션이 끝났다. 다시 연결하지 않고 로그인으로 보낸다. */ onLogin?: () => void } = {},
): () => void {
  const base = (o.baseUrl ?? "/v1").replace(/\/$/, "");
  const url = base + "/staff/alerts/stream";
  const setT = t.setTimeout, clearT = t.clearTimeout;
  let es: EventSource | null = null, timer: unknown = null, attempt = 0, stopped = false, hbTimer: unknown = null;
  const clearHb = () => { if (hbTimer !== null) { clearT(hbTimer); hbTimer = null; } };
  const handle = (ev: MessageEvent) => {
    try {
      const a = JSON.parse(ev.data) as StaffAlert;
      if (a && typeof a.alert_id === "string") onAlert(a);
    } catch { /* 무시 */ }
  };
  const open = () => {
    timer = null;
    let cur: EventSource;
    try { cur = es = o.eventSource ? o.eventSource(url) : new EventSource(url); }
    catch { return fail(); }
    cur.onopen = () => { if (cur !== es || stopped) return; attempt = 0; onState(true); };
    cur.onerror = () => { if (cur !== es || stopped) return; clearHb(); cur.close(); es = null; void failProbed(); };
    // heartbeat: 첫 하트비트를 받은 연결부터 무음 감시를 켠다. 시간 안에 다음 하트비트가 없으면 조용히 죽은 연결로 보고 직접 닫아 재연결 경로로 간다.
    cur.addEventListener("heartbeat", (() => {
      if (cur !== es || stopped) return;
      clearHb();
      hbTimer = setT(() => { hbTimer = null; if (cur !== es || stopped) return; cur.close(); es = null; void failProbed(); }, o.heartbeatTimeoutMs());
    }) as EventListener);
    // resync: Last-Event-ID로 이어 받지 못한 재연결. 호출자가 목록으로 다시 맞춘다.
    cur.addEventListener("resync", (() => { if (cur === es && !stopped) hooks.onResync?.(); }) as EventListener);
    // 계약: 이벤트 이름 alert(새 알림), resolved(해결). 이름 없는 이벤트도 받는다.
    cur.onmessage = handle;
    for (const name of ["alert", "resolved"]) cur.addEventListener(name, handle as EventListener);
  };
  /** 닫힌 연결: 탐침으로 이유를 읽는다. 401 -> 로그인, 429·503 -> Retry-After 뒤 새 연결(백오프보다 짧게 기다리지 않는다), 그 밖 -> 백오프. */
  const failProbed = async () => {
    if (!o.probe) return fail();
    let r: { status: number; retryAfterMs: number | null } = { status: 0, retryAfterMs: null };
    try { r = await o.probe(); } catch { /* 탐침 실패는 상태 불명 */ }
    if (stopped) return;
    if (r.status === 401) { onState(false, { attempt, nextRetryMs: null }); hooks.onLogin?.(); return; }
    fail(r.status === 429 || r.status === 503 ? r.retryAfterMs : null);
  };
  const fail = (retryAfterMs: number | null = null) => {
    clearHb();
    attempt++;
    const ms = Math.max(o.backoffMs(attempt), retryAfterMs ?? 0);
    onState(false, { attempt, nextRetryMs: ms });
    timer = setT(open, ms);
  };
  open();
  return () => { stopped = true; if (timer !== null) clearT(timer); clearHb(); es?.close(); es = null; };
}
