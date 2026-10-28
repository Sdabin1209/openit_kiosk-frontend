import { PublicApiClient } from "../../api/client.ts";
import { StaffApi } from "../../api/staff.ts";
import type { StaffAlert } from "../../api/types.ts";
import { deliveryLines, pauseLabel } from "./alertinfo.ts";
import { InterventionDeciding } from "./decide.ts";
import { disablePush, enablePush, hasPush } from "./push.ts";
import { createRecordViewer } from "./record.ts";
import { createAlertSync, type SyncStatus } from "./sync.ts";

const client = new PublicApiClient({ baseUrl: "/v1" });
const api = new StaffApi(client);
const alerts = new Map<string, StaffAlert>();
const $ = (id: string) => document.getElementById(id) as HTMLElement;

const dlg = $("confirm") as HTMLDialogElement;
function confirmDialog(msg: string): Promise<boolean> {
  return new Promise((res) => {
    $("confirm-text").textContent = msg;
    const done = (v: boolean) => { dlg.close(); res(v); };
    $("confirm-yes").onclick = () => done(true);
    $("confirm-no").onclick = () => done(false);
    dlg.showModal();
  });
}
const deciding = new InterventionDeciding((s, d, t) => api.intervene(s, d, t), confirmDialog);

const viewer = createRecordViewer({
  doc: document,
  dialog: $("record") as HTMLDialogElement,
  fetchSession: (id) => api.getSession(id),
  decide: async (alertId, sessionId, d) => {
    const r = await deciding.decide(alertId, sessionId, d);
    if (!r) return false;
    const a = alerts.get(alertId);
    if (a) { a.status = "RESOLVED"; a.resolved_by_decision = d; draw(); }
    return true;
  },
});

function row(a: StaffAlert): HTMLLIElement {
  const li = document.createElement("li");
  const meta = document.createElement("span");
  meta.className = "meta";
  // textContent만 쓴다. 모르는 kind/status도 그대로 보인다.
  meta.textContent = `${a.kind} · 세션 ${a.session_id} · ${a.created_at}` + (a.status !== "OPEN" ? ` · ${a.status}/${a.resolved_by_decision ?? "-"}` : "");
  li.append(meta);
  // 2.1.0: 정지 사유와 전달 상태. 글자 접두로 구분하고 색은 보조(.pause-RISK 등)다. 필드가 없으면 아무것도 붙지 않는다.
  const pl = pauseLabel(a);
  if (pl) { const p = document.createElement("strong"); p.className = `pause pause-${pl.reason}`; p.textContent = pl.text; li.append(p); li.dataset.pauseReason = pl.reason; }
  for (const t of deliveryLines(a)) { const d = document.createElement("span"); d.className = "delivery"; d.textContent = t; if (a.last_delivery_status === "DELIVERY_FAILED") d.classList.add("delivery-failed"); li.append(d); }
  const rec = document.createElement("button");
  rec.type = "button"; rec.className = "alt"; rec.textContent = "기록 보기";
  rec.setAttribute("aria-label", `세션 ${a.session_id} 기록 보기`);
  rec.onclick = () => { void viewer.open(a.session_id, rec); };
  li.append(rec);
  if (a.status === "OPEN") {
    for (const [d, label, cls] of [["RESUME", "이어서 진행", ""], ["END", "종료", "alt"]] as const) {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = label; b.className = cls;
      b.onclick = async () => {
        b.disabled = true;
        try { if (await deciding.decide(a.alert_id, a.session_id, d)) { a.status = "RESOLVED"; a.resolved_by_decision = d; draw(); } }
        catch (e) { banner("결정을 보내지 못했습니다. 다시 눌러 주세요."); }
        finally { b.disabled = false; }
      };
      li.append(b);
    }
  }
  return li;
}
function draw() {
  const open = $("open"), res = $("resolved");
  open.replaceChildren(); res.replaceChildren();
  const all = [...alerts.values()].sort((x, y) => (x.created_at < y.created_at ? 1 : -1));
  for (const a of all) (a.status === "OPEN" ? open : res).append(row(a));
}
function banner(t: string) { const b = $("banner"); b.textContent = t; b.hidden = false; }

function drawStatus(s: SyncStatus) {
  const conn = $("conn");
  conn.textContent = s.conn === "CONNECTED" ? "실시간 연결됨"
    : s.conn === "CONNECTING" ? "연결 중"
    : `연결 끊김 - 다시 연결 중${s.nextRetryMs !== null ? ` (${Math.max(1, Math.round(s.nextRetryMs / 1000))}초 뒤)` : ""}. 새 알림이 바로 보이지 않을 수 있습니다.`;
  conn.className = s.conn === "DISCONNECTED" ? "bad" : "";
  conn.setAttribute("role", s.conn === "DISCONNECTED" ? "alert" : "status");
  const ls = $("list-status");
  ls.hidden = !s.listStale;
  ls.textContent = s.listLoaded ? "알림 목록을 새로 읽지 못했습니다. 화면이 최신이 아닐 수 있습니다. 다시 시도하는 중입니다."
    : "알림 목록을 불러오지 못했습니다. 비어 있는 것이 아닙니다. 다시 시도하는 중입니다.";
}
const sync = createAlertSync({
  api,
  onChange: (m) => { alerts.clear(); for (const [k, v] of m) alerts.set(k, v); draw(); },
  onNew: (a) => banner(`새 알림: ${a.kind} 세션 ${a.session_id}`),
  onRedelivery: (a) => banner(`재전달 알림(환자가 다시 불렀습니다, ${a.delivery_attempts}회째): ${a.kind} 세션 ${a.session_id}`), // role=alert 배너가 낭독된다
  onStatus: drawStatus,
});
void sync;
// 푸시 구독 실패는 알림 배너와 섞지 않는다(실시간 화면 알림은 푸시와 무관하게 동작한다).
$("push").onclick = async () => {
  const ps = $("push-status"); ps.hidden = true;
  try { await enablePush(async () => (await api.pushConfig()).vapid_public_key, (s) => api.registerPush(s)); $("push").textContent = "푸시 알림 켜짐"; $("push-off").hidden = false; }
  catch (e) { ps.textContent = `푸시 알림을 켜지 못했습니다: ${(e as Error).message}. 이 화면의 실시간 알림은 그대로 동작합니다.`; ps.hidden = false; }
};
$("push-off").onclick = async () => {
  const ps = $("push-status");
  try { if (await disablePush((e) => api.unregisterPush(e))) { $("push").textContent = "푸시 알림 켜기"; $("push-off").hidden = true; ps.hidden = true; } }
  catch (e) { ps.textContent = `푸시 알림을 끄지 못했습니다: ${(e as Error).message}`; ps.hidden = false; }
};
void hasPush().then((on) => { if (on) { $("push").textContent = "푸시 알림 켜짐"; $("push-off").hidden = false; } });
// 푸시가 꺼져 있으면(공개키 null) 버튼을 숨기고 SSE만 쓴다.
api.pushConfig().then((c) => { if (!c.vapid_public_key) $("push").hidden = true; }).catch(() => { /* 설정을 못 읽으면 버튼은 두고 누를 때 오류를 보인다 */ });
