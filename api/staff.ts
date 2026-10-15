import { PublicApiClient } from "./client.ts";
import type { AlertPage, Decision, FrontendInput, PushSubscriptionJson, StaffAlert } from "./types.ts";

export interface StaffApiOptions {
  baseUrl?: string;
  eventSource?: (url: string) => EventSource;
}

export class StaffApi {
  private client: PublicApiClient;
  private o: StaffApiOptions;
  constructor(client: PublicApiClient, o: StaffApiOptions = {}) { this.client = client; this.o = o; }

  listAlerts(status: "OPEN" | "RESOLVED", limit = 50): Promise<AlertPage> {
    return this.client.request("GET", `/staff/alerts?status=${status}&limit=${limit}`);
  }

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
    // 이벤트 이름은 계약에 없다(CR-003). 이름 없는 이벤트와 흔한 이름을 모두 받는다.
    es.onmessage = handle;
    for (const name of ["alert", "resolved"]) es.addEventListener(name, handle as EventListener);
    return () => es.close();
  }
}
