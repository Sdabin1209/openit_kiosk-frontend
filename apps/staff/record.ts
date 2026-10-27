import { ApiError } from "../../api/errors.ts";
import type { Decision, StaffSessionView } from "../../api/types.ts";

/**
 * 세션 기록 보기(읽기 전용). 환자 발화가 들어 있으므로 화면(DOM)과 메모리에만 둔다.
 * 로그·콘솔·스토리지에 쓰지 않고, 오류 문구에도 내용을 넣지 않는다. 닫으면 DOM을 비운다.
 * 모든 값은 textContent로만 넣는다(모르는 값도 그대로 보인다).
 */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 404) return "이 세션의 기록을 찾을 수 없습니다. 삭제되었거나 번호가 다를 수 있습니다.";
    if (e.status === 401 || e.status === 403) return "기록을 볼 권한이 없거나 로그인이 만료되었습니다. 다시 로그인한 뒤 시도해 주세요.";
    return `서버가 기록을 돌려주지 못했습니다(상태 ${e.status}). 잠시 뒤 다시 시도해 주세요.`;
  }
  return "서버에 연결하지 못했습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.";
}

export function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "(없음)";
  if (typeof v === "string") return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

export interface RecordViewerDeps {
  doc: Document;
  dialog: HTMLDialogElement;
  fetchSession: (sessionId: string) => Promise<StaffSessionView>;
  /** 확인 단계를 가진 결정(InterventionDeciding.decide). 성공하면 true. */
  decide: (alertId: string, sessionId: string, d: Decision) => Promise<boolean>;
}

export function createRecordViewer(deps: RecordViewerDeps) {
  const { doc, dialog } = deps;
  let seq = 0;            // 늦게 온 응답이 다른 세션 화면을 덮지 않게 한다
  let opener: HTMLElement | null = null;
  let currentId = "";

  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string) => {
    const e = doc.createElement(tag);
    if (text !== undefined) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  };
  const table = (label: string, head: string[], rows: string[][]) => {
    const t = el("table"); t.setAttribute("aria-label", label);
    const tr = el("tr");
    for (const h of head) { const th = el("th", h); th.scope = "col"; tr.append(th); }
    const thead = el("thead"); thead.append(tr); t.append(thead);
    const tb = el("tbody");
    for (const r of rows) { const row = el("tr"); for (const c of r) row.append(el("td", c)); tb.append(row); }
    t.append(tb);
    return t;
  };
  const section = (id: string, title: string) => {
    const s = el("section"); const h = el("h3", title); h.id = `${id}-h`; s.setAttribute("aria-labelledby", h.id); s.append(h); return s;
  };

  function shell(): { body: HTMLElement; status: HTMLElement } {
    dialog.replaceChildren();
    const h = el("h2", `세션 기록 ${currentId}`); h.id = "record-title";
    dialog.setAttribute("aria-labelledby", "record-title");
    const close = el("button", "닫기", "alt"); close.type = "button"; close.id = "record-close";
    close.onclick = () => api.close();
    const status = el("p"); status.id = "record-status"; status.setAttribute("role", "status");
    const body = el("div"); body.id = "record-body";
    const head = el("div", undefined, "record-head"); head.append(h, close);
    dialog.append(head, status, body);
    return { body, status };
  }

  function render(view: StaffSessionView, body: HTMLElement) {
    body.replaceChildren();
    const info = el("dl", undefined, "info");
    for (const [k, v] of [["상태", view.status], ["시작 시각", view.created_at], ["릴리스", view.release_id ?? "(없음)"], ["환자 참조", view.subject_ref ?? "(없음)"]] as const) {
      info.append(el("dt", k), el("dd", v));
    }
    body.append(info);

    const conv = section("conv", "대화");
    const turns = [...(view.turns ?? [])].sort((a, b) => a.turn_index - b.turn_index);
    if (turns.length === 0) conv.append(el("p", "대화 기록이 없습니다.", "empty"));
    else {
      const ol = el("ol", undefined, "chat"); ol.setAttribute("aria-label", "대화 기록(시간순)");
      for (const t of turns) {
        const add = (who: "patient" | "system", text: string) => {
          const li = el("li", undefined, `bubble ${who}`);
          li.append(el("strong", who === "patient" ? "환자" : "시스템"), el("span", ` ${text}`), el("time", ` ${t.at}`, "at"));
          if (t.action && who === "system") li.append(el("small", ` [${t.action}]`));
          ol.append(li);
        };
        if (t.utterance !== null && t.utterance !== undefined) add("patient", t.utterance);
        if (t.response_text !== null && t.response_text !== undefined) add("system", t.response_text);
        if ((t.utterance ?? null) === null && (t.response_text ?? null) === null) add("system", "(내용 없음)");
      }
      conv.append(ol);
    }
    body.append(conv);

    const vals = section("vals", "저장된 값");
    const values = view.values ?? [];
    if (values.length === 0) vals.append(el("p", "저장된 값이 없습니다.", "empty"));
    else vals.append(table("저장된 값", ["칸", "값", "상태", "정확도"], values.map((v) => [v.key, formatValue(v.value), v.status, v.precision])));
    body.append(vals);

    const al = section("alerts", "이 세션의 알림");
    const alerts = view.alerts ?? [];
    if (alerts.length === 0) al.append(el("p", "알림이 없습니다.", "empty"));
    else {
      al.append(table("이 세션의 알림", ["종류", "상태", "시각", "규칙 id", "해결한 직원"], alerts.map((a) => [a.kind, a.status, a.created_at, a.rule_id ?? "-", a.resolved_by ?? "(없음)"])));
      const open = alerts.filter((a) => a.status === "OPEN");
      if (open.length > 0) {
        const bar = el("div", undefined, "actions"); bar.setAttribute("role", "group"); bar.setAttribute("aria-label", "개입 결정");
        for (const a of open) for (const [d, label, cls] of [["RESUME", "이어서 진행", ""], ["END", "종료", "alt"]] as const) {
          const b = el("button", label, cls); b.type = "button";
          b.onclick = async () => {
            b.disabled = true;
            try { if (await deps.decide(a.alert_id, view.session_id, d)) await load(); }
            catch { const s = doc.getElementById("record-status"); if (s) s.textContent = "결정을 보내지 못했습니다. 다시 눌러 주세요."; }
            finally { b.disabled = false; }
          };
          bar.append(b);
        }
        al.append(bar);
      }
    }
    body.append(al);
  }

  async function load() {
    const my = ++seq;
    const id = currentId;
    const { body, status } = (doc.getElementById("record-body") && doc.getElementById("record-status"))
      ? { body: doc.getElementById("record-body")!, status: doc.getElementById("record-status")! }
      : shell();
    status.textContent = "불러오는 중…";
    try {
      const view = await deps.fetchSession(id);
      if (my !== seq) return;
      status.textContent = "";
      render(view, body);
    } catch (e) {
      if (my !== seq) return;
      body.replaceChildren();
      status.textContent = errorMessage(e);
      const retry = el("button", "다시 시도", "alt"); retry.type = "button"; retry.onclick = () => void load();
      body.append(retry);
    }
  }

  const api = {
    open(sessionId: string, from?: HTMLElement | null) {
      opener = from ?? null;
      currentId = sessionId;
      shell();
      if (!dialog.open) { if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", ""); }
      const c = doc.getElementById("record-close"); c?.focus();
      return load();
    },
    close() {
      if (dialog.open) { if (typeof dialog.close === "function") dialog.close(); else dialog.removeAttribute("open"); }
      cleanup();
    },
  };
  function cleanup() {
    seq++;
    dialog.replaceChildren(); // 발화를 메모리에서 지운다
    const o = opener; opener = null; o?.focus?.();
  }
  // Esc(취소)로 닫혀도 내용을 지우고 눌렀던 버튼으로 초점을 돌린다.
  dialog.addEventListener("close", cleanup);
  return api;
}
