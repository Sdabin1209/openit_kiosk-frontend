import { PublicApiClient } from "../../api/client.ts";
import { StaffApi } from "../../api/staff.ts";
import type { StaffAlert } from "../../api/types.ts";
import { InterventionDeciding } from "./decide.ts";
import { enablePush } from "./push.ts";
import { createRecordViewer } from "./record.ts";

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

async function load() {
  try {
    for (const s of ["OPEN", "RESOLVED"] as const) for (const a of (await api.listAlerts(s)).items) alerts.set(a.alert_id, a);
    draw();
  } catch { banner("알림 목록을 불러오지 못했습니다."); }
}
api.stream(
  (a) => { const isNew = !alerts.has(a.alert_id) && a.status === "OPEN"; alerts.set(a.alert_id, a); draw(); if (isNew) banner(`새 알림: ${a.kind} 세션 ${a.session_id}`); },
  (ok) => { $("conn").textContent = ok ? "실시간 연결됨" : "연결 끊김(다시 연결 중)"; if (ok) void load(); },
);
$("push").onclick = async () => {
  try { await enablePush(async () => (await api.pushConfig()).vapid_public_key, (s) => api.registerPush(s)); $("push").textContent = "푸시 알림 켜짐"; }
  catch (e) { banner((e as Error).message); }
};
void load();
// 푸시가 꺼져 있으면(공개키 null) 버튼을 숨기고 SSE만 쓴다.
api.pushConfig().then((c) => { if (!c.vapid_public_key) $("push").hidden = true; }).catch(() => { /* 설정을 못 읽으면 버튼은 두고 누를 때 오류를 보인다 */ });
