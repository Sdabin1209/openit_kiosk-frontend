// 직원 콘솔 알림 동기화: 실시간 스트림 + 목록 API 보충(catch-up). UI를 모른다.
// 원칙(FAULT_POLICY 7·12): 끊기면 재연결하고, 붙을 때마다 목록을 다시 읽어 놓친 알림을 채우며,
// 연결·목록 상태를 항상 밖으로 알린다(조용히 비어 있는 화면 금지).
import type { StaffApi } from "../../api/staff.ts";
import type { StaffAlert } from "../../api/types.ts";

export type ConnState = "CONNECTING" | "CONNECTED" | "DISCONNECTED";
export interface SyncStatus {
  conn: ConnState;
  /** 끊김일 때 다음 재연결까지(ms). */
  nextRetryMs: number | null;
  /** 목록이 마지막으로 성공한 읽기 이후 실패 중이면 true. 처음부터 실패해도 true(= 비어 있는 것이 아니라 못 읽은 것). */
  listStale: boolean;
  /** 목록을 한 번이라도 읽었는지. */
  listLoaded: boolean;
}

export interface SyncDeps {
  api: Pick<StaffApi, "listAlerts" | "stream">;
  onChange: (alerts: ReadonlyMap<string, StaffAlert>) => void;
  onNew: (a: StaffAlert) => void;
  onStatus: (s: SyncStatus) => void;
  /** 목록을 주기적으로 다시 읽는다. 스트림이 소리 없이 죽은 경우(EventSource는 `: ping` 주석을 보여 주지 않아 무음을 감지할 수 없다)의 안전망이고,
   * 읽기에 실패한 목록을 스스로 복구하는 경로이기도 하다. 기본 15초(임의 값: 직원이 놓친 알림을 늦어도 이 정도 안에 보게 한다). */
  refreshMs?: number;
  timers?: { setInterval: (fn: () => void, ms: number) => unknown; clearInterval: (h: unknown) => void };
  streamTimers?: Parameters<StaffApi["stream"]>[2];
}

export function createAlertSync(d: SyncDeps) {
  const alerts = new Map<string, StaffAlert>();
  const st: SyncStatus = { conn: "CONNECTING", nextRetryMs: null, listStale: false, listLoaded: false };
  const T = d.timers ?? { setInterval: (fn, ms) => setInterval(fn, ms), clearInterval: (h) => clearInterval(h as number) };
  let loading: Promise<void> | null = null, pending = false;
  const emit = () => d.onStatus({ ...st });

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
      const isNew = !alerts.has(a.alert_id) && a.status === "OPEN";
      alerts.set(a.alert_id, a); d.onChange(alerts); if (isNew) d.onNew(a);
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
