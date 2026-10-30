// 공개 API 클라이언트와 직원 스트림을 만든다: 링크(link_public_api_send, link_staff_stream_receive)에 재시도 정책(retry_policy)과 턴 ID 발급을 주입한다.
// 컴포넌트끼리는 서로를 모르므로 이어 주는 일은 여기서 한다(규칙 5). 값은 src/config.ts에서 온다.
import { PublicApiClient, type ClientOptions } from "../components/link_public_api_send.ts";
import { openStaffStream, type StreamTimers } from "../components/link_staff_stream_receive.ts";
import { createRetryPolicy, type RetryPolicy } from "../components/retry_policy.ts";
import type { StaffAlert } from "../types/StaffAlert.ts";
import { DEFAULT_RETRY, REQUEST_TIMEOUT_MS, STAFF_STREAM_RETRY, heartbeatTimeoutMs } from "../config.ts";
import { newTurnId } from "./ids.ts";

export type PublicApiOptions = Omit<ClientOptions, "retryPolicy" | "newTurnId"> & {
  /** 기본 정책(config.ts DEFAULT_RETRY) 일부를 덮어쓴다(시험·특수 용도). */
  retry?: Partial<RetryPolicy>;
  rand?: () => number;
  newTurnId?: () => string;
};

export function createPublicApiClient(o: PublicApiOptions = {}): PublicApiClient {
  const { retry, rand, ...rest } = o;
  return new PublicApiClient({ timeoutMs: REQUEST_TIMEOUT_MS, ...rest, newTurnId: o.newTurnId ?? newTurnId, retryPolicy: createRetryPolicy({ ...DEFAULT_RETRY, ...retry }, rand) });
}

/** 직원 콘솔이 쓰는 서버 면: REST(link_public_api_send)와 실시간 스트림(link_staff_stream_receive)을 한 객체로 묶는다. */
export function createStaffApi(client: PublicApiClient, o: { baseUrl?: string; eventSource?: (url: string) => EventSource } = {}) {
  return {
    listAlerts: client.listAlerts.bind(client),
    getSession: client.getSession.bind(client),
    /** vapid_public_key가 null이면 푸시는 꺼져 있고 SSE만 동작한다. */
    pushConfig: () => client.getPushConfig(),
    registerPush: client.registerPush.bind(client),
    unregisterPush: client.unregisterPush.bind(client),
    intervene: client.intervene.bind(client),
    stream(
      onAlert: (a: StaffAlert) => void,
      onState: (connected: boolean, info?: { attempt: number; nextRetryMs: number | null }) => void,
      t: StreamTimers & { rand?: () => number } = {},
      hooks: { onResync?: () => void } = {},
    ): () => void {
      const policy = createRetryPolicy(STAFF_STREAM_RETRY, t.rand);
      return openStaffStream({ ...o, backoffMs: policy.backoffMs, heartbeatTimeoutMs: () => heartbeatTimeoutMs(t.rand) }, onAlert, onState, t, hooks);
    },
  };
}
export type StaffApi = ReturnType<typeof createStaffApi>;
