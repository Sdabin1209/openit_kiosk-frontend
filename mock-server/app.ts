// 공개 API(PUBLIC_API.md)의 모의 서버. 다른 영역 코드를 가져오지 않는다.
// 시나리오 제어(/__mock/*)는 계약 밖의 모의 전용 경로다.
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

export interface Scenario {
  delayMs: number;              // 모든 /v1 응답 지연
  hangFirst: number;            // 새 요청 중 앞 N번은 응답하지 않음(끊김 흉내)
  errorStatus: number | null;   // 이 상태 코드로 응답
  errorTimes: number;           // errorStatus를 몇 번 낼지
  riskKeyword: string;          // 발화에 이 말이 있으면 위험 정지
  alertDelivery: "DELIVERED" | "DELIVERY_FAILED";
  notCommitted: boolean;        // 신호 NOT_COMMITTED
}
const DEFAULT: Scenario = { delayMs: 0, hangFirst: 0, errorStatus: null, errorTimes: 0, riskKeyword: "위험", alertDelivery: "DELIVERED", notCommitted: false };
const PRESETS: Record<string, Partial<Scenario>> = {
  normal: {},
  risk_stop: { alertDelivery: "DELIVERED" },
  delivery_failed: { alertDelivery: "DELIVERY_FAILED" },
  not_committed: { notCommitted: true },
  delay: { delayMs: 3000 },
  hang: { hangFirst: 2 },
  error: { errorStatus: 503, errorTimes: 2 },
};

interface Session { id: string; turns: number; paused: boolean; alertId: string | null; ended: boolean }
export interface MockState {
  sc: Scenario; sessions: Map<string, Session>; alerts: any[]; subs: Map<string, any>;
  cache: Map<string, any>; events: { id: number; data: any }[]; sse: Set<ServerResponse>; seq: number; requests: number;
  log: { method: string; path: string }[]; // 발화 본문은 기록하지 않는다
}

const QUESTIONS = ["어디가 불편하신가요?", "언제부터 그러셨나요?", "복용 중인 약이 있으신가요?", "문진이 끝났습니다. 감사합니다."];
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const berr = (code: string, message: string, retryable = false) => ({ pipeline_schema_version: "1.0", code, message, retryable });

export function createMock(initial: Partial<Scenario> = {}): { server: Server; state: MockState; reset: (s?: Partial<Scenario>) => void } {
  const state: MockState = { sc: { ...DEFAULT, ...initial }, sessions: new Map(), alerts: [], subs: new Map(), cache: new Map(), events: [], sse: new Set(), seq: 0, requests: 0, log: [] };
  const reset = (s: Partial<Scenario> = {}) => {
    for (const r of state.sse) r.end();
    Object.assign(state, { sc: { ...DEFAULT, ...s }, sessions: new Map(), alerts: [], subs: new Map(), cache: new Map(), events: [], sse: new Set(), seq: 0, requests: 0, log: [] });
  };

  const json = (res: ServerResponse, code: number, body: unknown) => { res.writeHead(code, { "content-type": "application/json; charset=utf-8" }); res.end(JSON.stringify(body)); };
  const readBody = (req: IncomingMessage) => new Promise<any>((ok, ng) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => { try { ok(d ? JSON.parse(d) : {}); } catch { ng(new Error("json")); } }); });
  const publish = (a: any) => { const id = ++state.seq; state.events.push({ id, data: a }); for (const r of state.sse) r.write(`id: ${id}\ndata: ${JSON.stringify(a)}\n\n`); };
  const input = (text: string | null, sig: any = null) => ({ response_text: text, turn_failure_signal: sig });

  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? "/", "http://m");
    const path = url.pathname, m = req.method ?? "GET";
    state.log.push({ method: m, path });

    if (path === "/healthz" || path === "/readyz") return json(res, 200, { ok: true });
    if (path.startsWith("/__mock/")) return control(req, res, path);
    if (!path.startsWith("/v1/")) return json(res, 404, berr("NOT_FOUND", "no route"));

    state.requests++;
    if (state.sc.hangFirst > 0 && !path.includes("/stream")) { state.sc.hangFirst--; return; } // 응답하지 않음
    if (state.sc.delayMs) await new Promise((r) => setTimeout(r, state.sc.delayMs));
    if (state.sc.errorStatus && state.sc.errorTimes > 0 && !path.includes("/stream")) {
      state.sc.errorTimes--;
      const s = state.sc.errorStatus;
      return json(res, s, berr(s === 503 ? "UNAVAILABLE" : s === 403 ? "PERMISSION_DENIED" : "INVALID_RECORD", "scenario error", s === 503 || s === 429));
    }

    let body: any = {};
    if (m === "POST") { try { body = await readBody(req); } catch { return json(res, 400, berr("INVALID_RECORD", "bad json")); } }

    // ---- 문진 ----
    if (m === "POST" && path === "/v1/sessions") {
      if (body.kind !== "SESSION_START" || !ID_RE.test(body.session_id ?? "")) return json(res, 400, berr("INVALID_RECORD", "bad start"));
      if (!state.sessions.has(body.session_id)) state.sessions.set(body.session_id, { id: body.session_id, turns: 0, paused: false, alertId: null, ended: false });
      return json(res, 200, input("안녕하세요. 문진을 시작합니다. " + QUESTIONS[0]));
    }
    let mm = path.match(/^\/v1\/sessions\/([^/]+)\/(turns|end|intervention)$/);
    if (m === "POST" && mm) {
      const [, sid, op] = mm;
      const s = state.sessions.get(sid);
      if (!s) return json(res, 404, berr("NOT_FOUND", "unknown session"));
      if (body.session_id !== sid) return json(res, 400, berr("INVALID_RECORD", "session_id mismatch"));
      if (op === "end") { s.ended = true; return json(res, 200, input(null)); }
      if (typeof body.turn_id !== "string" || body.turn_id === "") return json(res, 400, berr("INVALID_RECORD", "turn_id required"));
      const key = `${sid}:${op}:${body.turn_id}`;
      if (state.cache.has(key)) return json(res, 200, state.cache.get(key)); // 같은 turn_id는 같은 응답, 한 번만 처리
      if (op === "turns") {
        if (body.kind !== "UTTERANCE" || typeof body.utterance !== "string") return json(res, 400, berr("INVALID_RECORD", "bad utterance"));
        if (s.paused) return json(res, 409, berr("FAILED_PRECONDITION", "session is paused"));
        let out;
        if (state.sc.riskKeyword && body.utterance.includes(state.sc.riskKeyword)) {
          s.paused = true;
          const alert = { alert_id: "a-" + (state.alerts.length + 1), session_id: sid, kind: "RISK_STOP", created_at: new Date().toISOString(), status: "OPEN", resolved_by_decision: null, resolved_at: null };
          s.alertId = alert.alert_id; state.alerts.push(alert); publish(alert);
          out = input("확인이 필요합니다. 직원이 도와드릴 때까지 기다려 주세요.", { session_id: sid, write_committed: "COMMITTED", staff_alert: state.sc.alertDelivery });
        } else if (state.sc.notCommitted) {
          out = input("저장하지 못했습니다. 다시 말씀해 주세요.", { session_id: sid, write_committed: "NOT_COMMITTED", staff_alert: "NONE" });
        } else {
          s.turns++;
          out = input(QUESTIONS[Math.min(s.turns, QUESTIONS.length - 1)]);
        }
        state.cache.set(key, out);
        return json(res, 200, out);
      }
      // intervention
      if (!["RESUME", "END"].includes(body.decision)) return json(res, 400, berr("INVALID_RECORD", "bad decision"));
      if (!s.paused) return json(res, 409, berr("FAILED_PRECONDITION", "session is not paused"));
      s.paused = false;
      const alert = state.alerts.find((a) => a.alert_id === s.alertId);
      if (alert) { Object.assign(alert, { status: "RESOLVED", resolved_by_decision: body.decision, resolved_at: new Date().toISOString() }); publish(alert); }
      if (body.decision === "END") s.ended = true;
      const out = input(body.decision === "RESUME" ? "다시 이어서 진행하겠습니다. " + QUESTIONS[Math.min(s.turns, 2)] : null);
      state.cache.set(key, out);
      return json(res, 200, out);
    }

    // ---- 직원 콘솔 ----
    if (m === "GET" && path === "/v1/staff/alerts") {
      const st = url.searchParams.get("status"), limit = Number(url.searchParams.get("limit") ?? 50);
      const items = state.alerts.filter((a) => !st || a.status === st).slice().reverse().slice(0, limit);
      return json(res, 200, { items, next_cursor: null });
    }
    if (m === "GET" && path === "/v1/staff/alerts/stream") {
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" });
      res.write(": open\n\n");
      const last = Number(req.headers["last-event-id"] ?? 0);
      for (const e of state.events) if (e.id > last) res.write(`id: ${e.id}\ndata: ${JSON.stringify(e.data)}\n\n`);
      state.sse.add(res); req.on("close", () => state.sse.delete(res));
      return;
    }
    if (m === "POST" && path === "/v1/staff/push-subscriptions") {
      if (typeof body.endpoint !== "string" || !body.keys) return json(res, 400, berr("INVALID_RECORD", "bad subscription"));
      state.subs.set(body.endpoint, body); res.writeHead(201); return res.end();
    }
    if (m === "DELETE" && path === "/v1/staff/push-subscriptions") {
      state.subs.delete(url.searchParams.get("endpoint") ?? ""); res.writeHead(204); return res.end();
    }
    return json(res, 404, berr("NOT_FOUND", "no route"));
  };

  async function control(req: IncomingMessage, res: ServerResponse, path: string) {
    if (path === "/__mock/scenario" && req.method === "POST") {
      const b = await readBody(req);
      const preset = b.name ? PRESETS[b.name] : {};
      if (!preset) return json(res, 400, { error: "unknown scenario", known: Object.keys(PRESETS) });
      const { name, ...rest } = b;
      reset({ ...preset, ...rest });
      return json(res, 200, state.sc);
    }
    if (path === "/__mock/state") return json(res, 200, { requests: state.requests, alerts: state.alerts, subs: [...state.subs.keys()], sessions: [...state.sessions.values()] });
    json(res, 404, { error: "no route" });
  }

  const server = createServer((req, res) => { handler(req, res).catch(() => { try { res.writeHead(500); res.end(); } catch { /* 무시 */ } }); });
  return { server, state, reset };
}
export const SCENARIO_NAMES = Object.keys(PRESETS);
export const SCENARIO_PRESETS = PRESETS;
