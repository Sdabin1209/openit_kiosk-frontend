// 키오스크 앱 진입점. 조립은 wiring/, 화면은 ui/kiosk_screen.ts. 여기에 업무 규칙을 두지 않는다.
import { ChatLog } from "../components/chat_log.ts";
import { createStartHolder } from "../components/start_values.ts";
import { WebSpeechStt } from "../components/stt_adapter.ts";
import { mountKioskScreen } from "../ui/kiosk_screen.ts";
import { createPublicApiClient } from "../wiring/public_api.ts";
import { createKioskFlow, loadKioskStart } from "../wiring/kiosk.ts";

// 기기 토큰과 환자 참조는 메모리에만 둔다(주소창 조각은 읽자마자 지운다). 환자 참조는 한 번 쓰면 비운다(다음 환자에게 재사용하지 않는다).
const holder = createStartHolder(() => loadKioskStart(window));
const api = createPublicApiClient({ baseUrl: "/v1", deviceToken: () => holder.deviceToken() });
const flow = createKioskFlow(api, { startValues: () => holder.take() });
const chat = new ChatLog(); // 현재 세션의 대화(메모리에만, 세션이 끝나면 지운다: ADR 0015)
flow.subscribeConversation((e) => chat.accept(e));
const stt = new WebSpeechStt(); // 기본: 기기 안 인식만(D88 U3). 외부 허용은 기기 설정 allow_remote_stt에서만.
const sttReady = holder.loaded.then((c) => { stt.setAllowRemote(c.allowRemoteStt); return stt.init(); });
mountKioskScreen({ flow, chat, stt, sttReady });
