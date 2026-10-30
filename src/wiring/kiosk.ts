// 키오스크 앱 조립: 시작 값(link_device_config_receive -> start_values), 상태 기계(kiosk_flow)에 공개 API·턴 ID·재시도 분류를 주입한다.
import { KioskFlow, type FlowApi } from "../components/kiosk_flow.ts";
import { readConfig, readFragment, type FragmentWindow } from "../components/link_device_config_receive.ts";
import { createRetryPolicy } from "../components/retry_policy.ts";
import { needsConfig, resolveStart, type KioskStart } from "../components/start_values.ts";
import { DEFAULT_RETRY, STT_INSTALL_TIMEOUT_MS } from "../config.ts";
import { WebSpeechStt, type SttTimers } from "../components/stt_adapter.ts";
import { newTurnId } from "./ids.ts";
import { realFlowTimers, realSleep, realTimers } from "./clock.ts";

/** 조각을 읽고(주소창에서 지움) 필요하면 기기 설정을 읽어 시작 값을 정한다. 조각이 설정보다 먼저다. */
export async function loadKioskStart(win: FragmentWindow, fetchFn?: typeof fetch): Promise<KioskStart> {
  const hash = readFragment(win);
  const config = needsConfig(hash) ? await readConfig(fetchFn) : null;
  return resolveStart({ hash, config });
}

type FlowOptions = Partial<Pick<ConstructorParameters<typeof KioskFlow>[1], "sleep" | "timers">> & Omit<ConstructorParameters<typeof KioskFlow>[1], "newTurnId" | "isOutcomeUnknown" | "sleep" | "timers"> & { newTurnId?: () => string };
export function createKioskFlow(api: FlowApi, o: FlowOptions = {}): KioskFlow {
  const policy = createRetryPolicy(DEFAULT_RETRY);
  return new KioskFlow(api, { ...o, sleep: o.sleep ?? realSleep, timers: o.timers ?? realFlowTimers, newTurnId: o.newTurnId ?? newTurnId, isOutcomeUnknown: (status) => policy.classify({ status, reason: null }).outcomeUnknown });
}

/** 음성 인식 어댑터: 설치 상한(config.ts)과 실제 타이머를 넣는다. */
export function createWebSpeechStt(o: { allowRemote?: boolean; installTimeoutMs?: number; timers?: SttTimers } = {}): WebSpeechStt {
  return new WebSpeechStt({ ...o, installTimeoutMs: o.installTimeoutMs ?? STT_INSTALL_TIMEOUT_MS, timers: o.timers ?? realTimers });
}
