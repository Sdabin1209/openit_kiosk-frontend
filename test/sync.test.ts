// 직원 콘솔 스트림 재연결(백오프+지터)과 목록 보충(catch-up), 연결 끊김 표시 (FAULT_POLICY 7·12)
import { test } from "node:test";
import assert from "node:assert/strict";
import { PublicApiClient } from "../api/client.ts";
import { StaffApi } from "../api/staff.ts";
import { STAFF_STREAM_RETRY } from "../api/retry.ts";
import { createAlertSync, type SyncStatus } from "../apps/staff/sync.ts";
import { settle } from "./helpers.ts";
import type { StaffAlert } from "../api/types.ts";

class FakeES {
  static all: FakeES[] = [];
  onopen: (() => void) | null = null; onerror: (() => void) | null = null; onmessage: ((e: any) => void) | null = null;
  listeners = new Map<string, (e: any) => void>(); closed = false; readyState = 0;
  url: string;
  constructor(url: string) { this.url = url; FakeES.all.push(this); }
  addEventListener(n: string, f: any) { this.listeners.set(n, f); }
  close() { this.closed = true; this.readyState = 2; }
  open() { this.readyState = 1; this.onopen?.(); }
  error() { this.onerror?.(); } // 브라우저는 HTTP 오류 때 CLOSED로 끝낸다
  emit(a: Partial<StaffAlert>, name = "alert") { this.listeners.get(name)?.({ data: JSON.stringify(a) }); }
}
const al = (id: string, status = "OPEN"): StaffAlert => ({ alert_id: id, session_id: "s" + id, kind: "RISK", status, created_at: "2026-01-01T00:00:0" + id + "Z", resolved_by_decision: null } as any);

function timers() {
  const q: Array<{ fn: () => void; ms: number; id: number }> = []; let id = 0;
  return { q, setTimeout: (fn: () => void, ms: number) => { q.push({ fn, ms, id: ++id }); return id; }, clearTimeout: (h: unknown) => { const i = q.findIndex((x) => x.id === h); if (i >= 0) q.splice(i, 1); },
    fire() { const t = q.shift()!; t.fn(); return t.ms; } };
}
function setup(list: () => StaffAlert[] | Error, rand = () => 0) {
  FakeES.all = [];
  const tm = timers();
  const client = new PublicApiClient({ fetch: (async (u: string) => {
    const r = list(); if (r instanceof Error) throw r;
    const open = u.includes("status=OPEN");
    return new Response(JSON.stringify({ items: r.filter((a) => (a.status === "OPEN") === open), next_cursor: null }));
  }) as any, retry: { maxAttempts: 1 }, sleep: async () => {} });
  const api = new StaffApi(client, { eventSource: (u) => new FakeES(u) as any });
  const statuses: SyncStatus[] = []; const news: string[] = [];
  const sync = createAlertSync({ api, onChange: () => {}, onNew: (a) => news.push(a.alert_id), onStatus: (s) => statuses.push(s), refreshMs: 0, streamTimers: { setTimeout: tm.setTimeout, clearTimeout: tm.clearTimeout, rand } });
  return { sync, tm, statuses, news };
}
const flush = () => settle();

test("스트림 오류(HTTP 오류로 CLOSED)면 닫고 지수 백오프로 새로 연다, 붙으면 시도 횟수 초기화", async () => {
  const { sync, tm, statuses } = setup(() => []);
  assert.equal(FakeES.all.length, 1);
  const delays: number[] = [];
  for (let i = 0; i < 7; i++) { FakeES.all.at(-1)!.error(); delays.push(tm.fire()); }
  assert.deepEqual(delays, [500, 1000, 2000, 4000, 7500, 7500, 7500]); // 기준 1초 x2, 상한 15초, rand=0이면 지터 하한 50%
  assert.equal(FakeES.all.length, 8);
  assert.ok(FakeES.all.slice(0, 7).every((e) => e.closed));
  const last = statuses.at(-1)!; assert.equal(last.conn, "DISCONNECTED"); assert.equal(last.nextRetryMs, 7500);
  FakeES.all.at(-1)!.open(); await flush();
  assert.equal(sync.status().conn, "CONNECTED");
  FakeES.all.at(-1)!.error(); assert.equal(tm.fire(), 500, "연결에 성공하면 백오프가 처음부터");
  sync.stop();
});

test("지터: 같은 시도 번호에서도 [50%,100%] 안에서 흩어진다", () => {
  const seen = new Set<number>();
  for (let i = 0; i < 40; i++) {
    const { sync, tm } = setup(() => [], Math.random);
    FakeES.all[0]!.error(); const ms = tm.fire(); seen.add(ms);
    assert.ok(ms >= STAFF_STREAM_RETRY.baseMs * 0.5 && ms <= STAFF_STREAM_RETRY.baseMs);
    sync.stop();
  }
  assert.ok(seen.size > 5);
});

test("재연결 직후 목록을 다시 읽어 끊긴 사이의 알림을 보충하고, 새 알림으로 알린다", async () => {
  let server = [al("1")];
  const { sync, tm, news } = setup(() => server);
  FakeES.all[0]!.open(); await flush();
  assert.deepEqual([...sync.alerts.keys()], ["1"]);
  assert.deepEqual(news, [], "처음 읽을 때는 새 알림 배너 없음");
  FakeES.all[0]!.error();
  server = [al("1"), al("2"), al("3", "RESOLVED")]; // 끊긴 사이 생김
  tm.fire(); FakeES.all[1]!.open(); await flush();
  assert.deepEqual([...sync.alerts.keys()].sort(), ["1", "2", "3"]);
  assert.deepEqual(news, ["2"]);
  sync.stop();
});

test("목록을 못 읽으면 listStale로 표시하고(빈 화면과 구분), 복구되면 해제한다", async () => {
  let fail: Error | null = new Error("503");
  const { sync, statuses } = setup(() => fail ?? []);
  await flush();
  assert.equal(sync.status().listStale, true);
  assert.equal(sync.status().listLoaded, false);
  fail = null; await sync.refresh();
  assert.equal(sync.status().listStale, false);
  assert.equal(sync.status().listLoaded, true);
  assert.ok(statuses.some((s) => s.listStale));
  sync.stop();
});

test("스트림 이벤트(alert·resolved)는 반영하고 모르는 형식은 무시한다", async () => {
  const { sync, news } = setup(() => []);
  const es = FakeES.all[0]!; es.open(); await flush();
  es.emit(al("9")); es.emit({ ...al("9"), status: "RESOLVED" }, "resolved");
  es.onmessage?.({ data: "{깨짐" }); es.onmessage?.({ data: JSON.stringify({ x: 1 }) });
  assert.equal(sync.alerts.get("9")?.status, "RESOLVED");
  assert.deepEqual(news, ["9"]);
  sync.stop();
});

test("stop하면 재연결 타이머를 지우고 이후 오류를 무시한다", () => {
  const { sync, tm } = setup(() => []);
  const es = FakeES.all[0]!; es.error(); assert.equal(tm.q.length, 1);
  sync.stop(); assert.equal(tm.q.length, 0);
  es.error(); assert.equal(tm.q.length, 0);
});

// ---- 하트비트 감시와 resync (PUBLIC_API.md 43행, D87) ----
test("하트비트가 없는 구버전 서버: 무음 감시를 켜지 않는다(타이머 없음)", async () => {
  const { sync, tm } = setup(() => []);
  FakeES.all[0]!.open(); await flush();
  assert.equal(tm.q.length, 0);
  assert.equal(sync.status().conn, "CONNECTED");
  sync.stop();
});

test("첫 하트비트부터 감시가 켜지고, 30~35초 안에 다음 하트비트가 없으면 닫고 재연결 경로로 간다", async () => {
  const { sync, tm, statuses } = setup(() => [], Math.random);
  const es = FakeES.all[0]!; es.open(); await flush();
  es.emit({ ts: "x" } as any, "heartbeat");
  assert.equal(tm.q.length, 1);
  const wd = tm.q[0]!.ms; assert.ok(wd >= 30_000 && wd <= 35_000, `${wd}`);
  es.emit({ ts: "y" } as any, "heartbeat"); // 하트비트가 오면 타이머를 새로 건다
  assert.equal(tm.q.length, 1);
  tm.fire(); // 무음
  assert.equal(es.closed, true);
  assert.equal(statuses.at(-1)!.conn, "DISCONNECTED");
  assert.equal(tm.q.length, 1, "재연결 백오프 타이머");
  const delay = tm.fire();
  assert.ok(delay >= 500 && delay <= 1000);
  assert.equal(FakeES.all.length, 2);
  FakeES.all[1]!.open(); await flush();
  assert.equal(sync.status().conn, "CONNECTED");
  assert.equal(tm.q.length, 0, "새 연결은 첫 하트비트 전까지 감시하지 않는다");
  sync.stop();
});

test("하트비트는 알림으로 처리되지 않고, 연결이 오류로 끊기면 감시 타이머도 지운다", async () => {
  const { sync, tm, news } = setup(() => []);
  const es = FakeES.all[0]!; es.open(); await flush();
  es.emit({ ts: "x" } as any, "heartbeat");
  assert.deepEqual([...sync.alerts.keys()], []); assert.deepEqual(news, []);
  es.error();
  assert.equal(tm.q.length, 1, "감시 타이머는 지워지고 재연결 타이머만 남는다");
  sync.stop(); assert.equal(tm.q.length, 0);
});

test("resync를 받으면 목록을 즉시 다시 읽어 놓친 알림을 채운다", async () => {
  let server: StaffAlert[] = [];
  const { sync, news } = setup(() => server);
  const es = FakeES.all[0]!; es.open(); await flush();
  server = [al("7")];
  es.emit({ reason: "EVENTS_NOT_RESUMABLE" } as any, "resync"); await flush();
  assert.deepEqual([...sync.alerts.keys()], ["7"]);
  assert.deepEqual(news, ["7"]);
  sync.stop();
});

// 같은 alert_id의 재전달은 delivery_attempts가 커졌을 때만 배너(onRedelivery). 목록은 한 건으로 합친다.
test("재알림 이벤트: 같은 alert_id에서 delivery_attempts가 커지면 재전달 알림, 같은/오래된 번호는 조용히", async () => {
  FakeES.all = [];
  const client = new PublicApiClient({ fetch: (async () => new Response(JSON.stringify({ items: [], next_cursor: null }))) as any, retry: { maxAttempts: 1 }, sleep: async () => {} });
  const api = new StaffApi(client, { eventSource: (u) => new FakeES(u) as any });
  const news: string[] = [], again: number[] = []; let last: ReadonlyMap<string, StaffAlert> = new Map();
  const sync = createAlertSync({ api, onChange: (m) => { last = m; }, onNew: (a) => news.push(a.alert_id), onRedelivery: (a) => again.push(a.delivery_attempts!), onStatus: () => {}, refreshMs: 0 });
  await flush(); const es = FakeES.all[0]; es.open(); await flush();
  const base = al("1");
  es.emit({ ...base, delivery_attempts: 1 }); assert.deepEqual(news, ["1"]); assert.deepEqual(again, []);
  es.emit({ ...base, delivery_attempts: 2 }); assert.deepEqual(again, [2], "시도 횟수가 커졌다 = 재전달");
  es.emit({ ...base, delivery_attempts: 2 }); assert.deepEqual(again, [2], "같은 번호(이어받기로 다시 온 이벤트)는 조용히");
  es.emit({ ...base, delivery_attempts: 1 }); assert.deepEqual(again, [2], "오래된 번호도 조용히");
  assert.equal(last.get("1")!.delivery_attempts, 2, "오래된 이벤트가 저장값을 되돌리지 않는다");
  assert.equal(last.size, 1, "목록은 한 건으로 합친다");
  es.emit({ ...al("2") }); es.emit({ ...al("2") }); assert.deepEqual(again, [2], "필드 없는 옛 서버는 기존 동작(재전달 판정 없음)");
  es.emit({ ...base, status: "RESOLVED", delivery_attempts: 5 }); assert.deepEqual(again, [2], "해결된 알림은 재전달이 아니다");
  sync.stop();
});

test("서비스 워커: 같은 tag의 재알림도 소리·진동을 내도록 renotify를 켠다", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../apps/staff/sw.ts", import.meta.url), "utf8");
  assert.match(src, /tag: d\.alert_id[^}]*renotify: true/);
});
