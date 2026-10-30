// 직원 콘솔 알림 동기화: 실시간 스트림 + 목록 API 보충(catch-up). UI를 모른다.
// 원칙(FAULT_POLICY 7·12): 끊기면 재연결하고, 붙을 때마다 목록을 다시 읽어 놓친 알림을 채우며,
// 연결·목록 상태를 항상 밖으로 알린다(조용히 비어 있는 화면 금지).
// 입력: 공개 API의 알림 목록(listAlerts)과 실시간 스트림(stream)을 함수 모양으로 받는다(wiring이 두 링크를 이어 넣는다). 출력: SyncStatus(schemas/SyncStatus.json)와 알림 맵.
import { SyncStatus as vStatus } from "../types/validators.gen.cjs";
import type { StaffAlert } from "../types/StaffAlert.ts";
import type { StaffAlertPage } from "../types/StaffAlertPage.ts";
import type { SyncStatus } from "../types/SyncStatus.ts";

export type { SyncStatus };
export type ConnState = SyncStatus["conn"];
/** 동기화가 바라는 서버 면. stream은 연결 상태와 알림을 콜백으로 주고 해제 함수를 돌려준다. */
export interface AlertSource {
  listAlerts(status: "OPEN" | "RESOLVED", limit?: number, cursor?: string): Promise<StaffAlertPage>;
  stream(
    onAlert: (a: StaffAlert) => void,
    onState: (connected: boolean, info?: { attempt: number; nextRetryMs: number | null }) => void,
    t?: { setTimeout?: (fn: () => void, ms: number) => unknown; clearTimeout?: (h: unknown) => void; rand?: () => number },
    hooks?: { onResync?: () => void },
  ): () => void;
}

export interface SyncDeps {
  api: AlertSource;
  onChange: (alerts: ReadonlyMap<string, StaffAlert>) => void;
  onNew: (a: StaffAlert) => void;
  /** 같은 alert_id가 다시 전달되었다(키오스크 재알림, CR-H001): 배너·소리용. 목록은 계속 한 건으로 합친다. */
  onRedelivery?: (a: StaffAlert) => void;
  onStatus: (s: SyncStatus) => void;
  /** 목록을 주기적으로 다시 읽는다. 스트림이 소리 없이 죽은 경우(EventSource는 `: ping` 주석을 보여 주지 않아 무음을 감지할 수 없다)의 안전망이고,
   * 읽기에 실패한 목록을 스스로 복구하는 경로이기도 하다. 기본 15초(임의 값: 직원이 놓친 알림을 늦어도 이 정도 안에 보게 한다). */
  refreshMs?: number;
  timers?: { setInterval: (fn: () => void, ms: number) => unknown; clearInterval: (h: unknown) => void };
  streamTimers?: Parameters<AlertSource["stream"]>[2];
}

/**
 * 재전달 판정(M-1). 서버는 재알림을 새 이벤트 이름 없이 같은 alert_id의 `alert` 이벤트로 다시 보낸다(PUBLIC_API.md G절). 그래서 목록에 이미 있는 열린 알림이
 * `delivery_attempts`가 저장된 값보다 **커졌을 때만** 재전달로 본다. Last-Event-ID 이어받기로 다시 온 같은 시도 번호(오래된 이벤트)는 같거나 작아서 제외된다.
 * (전달 시각 필드는 계약에 없다. 시도 횟수가 단조 증가하는 유일한 신호다.) 필드가 없는 옛 서버는 재전달을 알 수 없고 기존 동작(조용한 합침)이다.
 */
export function isRedelivery(prev: StaffAlert | undefined, next: StaffAlert): boolean {
  return !!prev && prev.status === "OPEN" && next.status === "OPEN" && typeof next.delivery_attempts === "number" && next.delivery_attempts > (prev.delivery_attempts ?? 0);
}

export function createAlertSync(d: SyncDeps) {
  const alerts = new Map<string, StaffAlert>();
  const st: SyncStatus = { conn: "CONNECTING", nextRetryMs: null, listStale: false, listLoaded: false };
  const T = d.timers ?? { setInterval: (fn, ms) => setInterval(fn, ms), clearInterval: (h) => clearInterval(h as number) };
  let loading: Promise<void> | null = null, pending = false;
  const emit = () => { const s: SyncStatus = { ...st }; if (!vStatus(s)) throw new Error("SyncStatus 스키마 위반"); d.onStatus(s); }; // 내는 쪽이 검증한다

  async function readAll() {
    const fresh = new Map<string, StaffAlert>();
    for (const status of ["OPEN", "RESOLVED"] as const) {
      let cursor: string | undefined;
      for (let page = 0; page < 20; page++) { // 상한: 무한 커서 방지
        const r = await d.api.listAlerts(status, 50, cursor);
        for (const a of r.items) fresh.set(a.alert_id, a);
        if (!r.next_cursor) break;
        cursor = r.next_cursor;
      }
    }
    for (const [id, a] of fresh) {
      const isNew = !alerts.has(id) && a.status === "OPEN" && st.listLoaded; // 처음 읽을 때는 새 알림 배너를 띄우지 않는다
      alerts.set(id, a);
      if (isNew) d.onNew(a);
    }
  }

  /** 목록 다시 읽기. 동시에 하나만 돌고, 도중에 또 요청되면 끝난 뒤 한 번 더 한다. */
  function load(): Promise<void> {
    if (loading) { pending = true; return loading; }
    loading = (async () => {
      try {
        await readAll();
        st.listStale = false; st.listLoaded = true;
      } catch { st.listStale = true; }
      d.onChange(alerts); emit();
    })().finally(() => {
      loading = null;
      if (pending) { pending = false; void load(); }
    });
    return loading;
  }

  const stop1 = d.api.stream(
    (a) => {
      const prev = alerts.get(a.alert_id);
      const isNew = !prev && a.status === "OPEN", again = isRedelivery(prev, a);
      // 오래된 이벤트가 최신 시도 횟수를 되돌리지 않게, 같은 알림의 더 낮은 시도 번호는 저장값을 덮지 않는다.
      const stale = !!prev && typeof a.delivery_attempts === "number" && typeof prev.delivery_attempts === "number" && a.delivery_attempts < prev.delivery_attempts && a.status === prev.status;
      if (!stale) alerts.set(a.alert_id, a);
      d.onChange(alerts); if (isNew) d.onNew(a); else if (again) d.onRedelivery?.(a);
    },
    (ok, info) => {
      st.conn = ok ? "CONNECTED" : "DISCONNECTED"; st.nextRetryMs = ok ? null : info?.nextRetryMs ?? null;
      emit();
      if (ok) void load(); // 재연결 직후 놓친 알림 보충
    },
    d.streamTimers,
    { onResync: () => void load() }, // 이어 받을 수 없는 재연결: 목록으로 즉시 다시 맞춘다
  );
  const tick = (d.refreshMs ?? 15_000) > 0 ? T.setInterval(() => void load(), d.refreshMs ?? 15_000) : null;
  void load();
  emit();
  return { alerts, refresh: load, status: () => ({ ...st }), stop: () => { stop1(); if (tick !== null) T.clearInterval(tick); } };
}
