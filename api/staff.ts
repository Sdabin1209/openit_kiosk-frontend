import { PublicApiClient } from "./client.ts";
import type { Decision, FrontendInput, PushSubscriptionJson, StaffAlert, StaffAlertPage, StaffSessionView } from "./types.ts";

export interface StaffApiOptions {
  baseUrl?: string;
  eventSource?: (url: string) => EventSource;
}

export class StaffApi {
  private client: PublicApiClient;
  private o: StaffApiOptions;
  constructor(client: PublicApiClient, o: StaffApiOptions = {}) { this.client = client; this.o = o; }

  listAlerts(status: "OPEN" | "RESOLVED", limit = 50, cursor?: string): Promise<StaffAlertPage> {
    const c = cursor ? `&cursor=${encodeURIComponent(cursor)}` : "";
    return this.client.request("GET", `/staff/alerts?status=${status}&limit=${limit}${c}`);
  }
  /** 세션 기록(읽기 전용). 404는 ApiError(status 404)로 올라온다. */
  getSession(sessionId: string): Promise<StaffSessionView> {
    return this.client.request("GET", `/staff/sessions/${encodeURIComponent(sessionId)}`);
  }
  /** vapid_public_key가 null이면 푸시는 꺼져 있고 SSE만 동작한다. */
  pushConfig() { return this.client.getPushConfig(); }

  registerPush(sub: PushSubscriptionJson): Promise<void> {
    return this.client.request("POST", `/staff/push-subscriptions`, sub);
  }
  unregisterPush(endpoint: string): Promise<void> {
    return this.client.request("DELETE", `/staff/push-subscriptions?endpoint=${encodeURIComponent(endpoint)}`);
  }

  intervene(sessionId: string, decision: Decision, turnId: string): Promise<FrontendInput> {
    return this.client.intervene(sessionId, decision, turnId);
  }

  /**
   * SSE 구독. 끊기면 EventSource가 Last-Event-ID로 자동 재연결한다.
   * 모르는 형식의 이벤트는 무시한다(죽지 않음).
   */
  stream(onAlert: (a: StaffAlert) => void, onState: (connected: boolean) => void): () => void {
    const base = (this.o.baseUrl ?? "/v1").replace(/\/$/, "");
    const url = base + "/staff/alerts/stream";
    const es = this.o.eventSource ? this.o.eventSource(url) : new EventSource(url);
    es.onopen = () => onState(true);
    es.onerror = () => onState(false);
    const handle = (ev: MessageEvent) => {
      try {
        const a = JSON.parse(ev.data) as StaffAlert;
        if (a && typeof a.alert_id === "string") onAlert(a);
      } catch { /* 무시 */ }
    };
    // 계약: 이벤트 이름 alert(새 알림), resolved(해결). 이름 없는 이벤트도 받는다.
    es.onmessage = handle;
    for (const name of ["alert", "resolved"]) es.addEventListener(name, handle as EventListener);
    return () => es.close();
  }
}
