// 문구(환자에게 보이는 글)의 정본은 components/patient_copy.ts다. 여기서는 기존 이름으로 다시 내보낼 뿐이다.
// 임상·운영 판단이 들어간 값을 한 곳에 모은다. D88: 아래 값은 모두 설정이고 **잠정, H1(24GB) 실측 뒤 재정**한다(사용자 결정 U10).
// 근거 구분: 재질문 3회·유휴 60초 = D88 U10 / 신뢰도 0.4·ENDED 8초 = 기존 코드의 임의 값(근거 기록 없음) / 나머지 = 임의(측정 안 함). 이유: docs/adr/0008.
// 정한 것이지 확인한 것이 아니다. 값을 바꿀 때는 이 파일만 고친다. 근거가 있는 값은 근거를, 없는 값은 '임의'라고 적었다.
// (재시도 총 예산 20초는 같은 성격이라 아래 RETRY 값에 있다. FAULT_POLICY의 사용자 결정 항목.)
import { MSG } from "./components/patient_copy.ts";

// STT 신뢰도 하한 0.4는 스키마 UsableTranscript(schemas/UsableTranscript.json)가 정한다(사용자 결정 U10, 잠정, 근거 없는 임의 값, ADR 0008).

/** [사용자 결정 U10, 잠정] 종료 화면("수고하셨습니다")을 보이는 시간(ms). 임의. */
export const ENDED_RESET_MS = 8_000;

/** [사용자 결정 U10, 잠정(D88: 60초)] 입력이 없으면 세션을 끝내고 화면·입력창을 비우는 시간(ms). 0이면 끔.
 * 말하기 대기·다시 말하기·직원 호출 화면에만 적용한다. 위험 정지 대기(WAITING_STAFF)는 세션을 끝내지 않는다. */
export const IDLE_RESET_MS = 60_000;

/** [사용자 결정 U10, 잠정(D88: 3회 후 직원 호출)] '다시 말씀해 주세요'(인식 실패·저장 실패)가 연달아 이 횟수를 넘으면 직원 호출 안내로 넘긴다. 서버 쪽 반복 상한(G12)과 별개. */
export const MAX_REPEAT = 3;

/** [표준 WCAG 2.2 SC 2.2.1 Extend 조건: 최소 20초] 유휴 만료 전 경고 구간(ms). 총 제한 IDLE_RESET_MS 안의 마지막 구간이다.
 * 값은 표준의 최소치이며 측정하지 않았다(고령 환자에게 충분한지는 미확인). ADR 0017. */
export const IDLE_WARNING_MS = 20_000;

/** [사용자 결정 U10, 잠정] 위험 정지 대기가 이 시간(ms)을 넘으면 화면에 '가까이 있는 직원에게 알려 주세요'를 덧붙인다. 임의(5분). 세션은 끝내지 않는다. */
export const LONG_WAIT_NOTICE_MS = 300_000;

/** [임시] 수동 입력 한 번의 최대 글자 수. 서버 상한(8MiB)과 무관한 화면 쪽 제한이며 임의. */
export const MAX_INPUT_CHARS = 500;

/** [D88 U3] 외부 음성 인식 제공자로 음성을 보내는 것을 허용할지의 기본값. 기본 꺼짐(privacy by default): 기기 안 인식(processLocally)만 쓰고,
 * 지원하지 않으면 음성 입력을 끄고 텍스트 입력으로 안내한다. 켜려면 기기 설정(/config.json의 allow_remote_stt: true)에서만 켠다.
 * 켜면 화면에 환자 고지 문구(아래, 임시)가 보이고 음성이 Chrome이면 Google 서버 등 외부로 나간다. 임상·법무 검토 전 문구다. */
export const ALLOW_REMOTE_STT_DEFAULT = false;
export const REMOTE_STT_NOTICE = MSG.NOTICE_REMOTE_STT.text; // 임시 문구, 임상/법무 검토 전(components/patient_copy.ts)
export const NO_STT_NOTICE = MSG.NOTICE_NO_STT.text; // 임시 UI 문구(components/patient_copy.ts)

/** [임상 검토 필요, 임시 문구] 되묻기 한도(REASK_LIMIT)로 멈췄는데 서버가 환자용 고정 문장(response_text)을 주지 않았을 때만 쓰는 대기 안내.
 * 서버 고정 문장이 있으면 항상 그것이 우선한다(이 영역은 환자에게 가는 임상 문장을 새로 정하지 않는다). 위험 정지 문구와 구분되며,
 * '위험하지 않다'는 단정은 하지 않는다(임상 판단이므로). ADR 0014. */
export const REASK_LIMIT_WAIT_NOTICE = MSG.NOTICE_REASK_LIMIT_WAIT.text;
/** [임상 검토 필요, 임시 UI 문구] 직원 알림 재전송 안내(ADR 0014). 재알림 간격·상한 값은 서버 설정이며 이 영역은 값을 정하지 않는다. */
export const STAFF_CALL_NOTICES = {
  STILL_FAILED: MSG.STAFF_CALL_STILL_FAILED.text,
  NETWORK: MSG.STAFF_CALL_NETWORK.text,
  NO_ALERT: MSG.STAFF_CALL_NO_ALERT.text,
  AUTH: MSG.STAFF_CALL_AUTH.text,
  BUSY: MSG.STAFF_CALL_BUSY.text,
  READY: MSG.STAFF_CALL_READY.text,
  LIMIT: MSG.STAFF_CALL_LIMIT.text,
  UNSUPPORTED: MSG.STAFF_CALL_UNSUPPORTED.text,
  REPORT_FAILED: MSG.STAFF_CALL_REPORT_FAILED.text,
} as const;
/** [provisional, 임상 검토 전] 전달 실패 화면의 상시 안내. 다시 부르기가 끝나거나 막혀도 이 안내는 남는다(헤드 결정, ADR 0014). */
export const DELIVERY_FAILED_DIRECT_NOTICE = MSG.DELIVERY_FAILED_DIRECT.text;
export const RETRY_BUTTON_LABEL = MSG.BTN_RETRY_STAFF_CALL.text;

// ---- 재시도 정책 값(FAULT_POLICY 원칙 2·3·7). 구조는 components/retry_policy.ts, 스키마는 schemas/RetryPolicy.json.
// 값의 근거 구분(자세한 이유: docs/adr/0004, 0003): 총 예산 20초와 재시도 대상 코드 집합 = FAULT_POLICY 원칙 7(정책에서 온 값).
// 지수 백오프+지터 구조 = 표준 관행. 기준 0.5초·상한 5초·지터 하한 50%·직원 스트림 1초/15초·하트비트 30초+지터 5초 = 임의(측정 안 함).
// 이 값들은 '정한 것'이다. 임상 현장 흐름에 맞는지는 사용자 결정 대기(FAULT_POLICY 맨 아래)이며 실측으로 확인하지 못했다.
/** 키오스크 요청. 서비스 재시작은 수 초 걸리므로 0.5초로 빠르게 한 번 더 시도하되 곧 늘린다(0.5 -> 1 -> 2 -> 4 -> 상한 5). 환자가 화면 앞에서 기다리므로 한 번 쉬는 시간이 5초를 넘지 않게 한다.
 * 총 예산 20초: 서버 턴 마감(6초)과 키오스크 대기(10초) 뒤에도 한두 번 더 시도할 수 있는 길이, 넘으면 직원 호출 화면. 시도 횟수 상한은 없다(예산이 끊는다). */
export const DEFAULT_RETRY = { baseMs: 500, factor: 2, maxMs: 5_000, budgetMs: 20_000, minJitter: 0.5 } as const;
/** 직원 콘솔 실시간 스트림 재연결(예산 없음: 복구되면 사람 개입 없이 다시 붙는다, 원칙 12). 직원은 화면 앞에서 계속 기다리는 사람이 아니므로 상한을 15초로 두고, 상류가 재시작 중일 때 몰려들지 않게 지터를 둔다.
 * 예산이 없는 값은 JSON에 없으므로 매우 큰 수로 쓴다(약 285년, Number.MAX_SAFE_INTEGER ms). */
export const STAFF_STREAM_RETRY = { baseMs: 1_000, factor: 2, maxMs: 15_000, budgetMs: Number.MAX_SAFE_INTEGER, minJitter: 0.5 } as const;
/** 직원 알림 스트림 하트비트 감시(PUBLIC_API.md 43행, D87). 서버는 연결 직후 한 번과 약 15초마다 heartbeat를 보낸다. 한 번 놓친 것은 지연일 수 있으므로 주기의 2배(30초) 동안 없으면 죽은 연결로 본다.
 * 0~5초 지터를 더해 서버 재시작 직후 모든 콘솔이 같은 초에 재연결하지 않게 한다. 값은 '정한 것'이며 실측하지 않았다. */
export const STAFF_HEARTBEAT = { intervalMs: 15_000, missFactor: 2, jitterMs: 5_000 } as const;
export const heartbeatTimeoutMs = (rand: () => number = Math.random) => STAFF_HEARTBEAT.intervalMs * STAFF_HEARTBEAT.missFactor + Math.round(rand() * STAFF_HEARTBEAT.jitterMs);
/** 요청 하나의 응답 대기 상한(PUBLIC_API.md: 응답이 없으면 10초 뒤 같은 turn_id로 재시도). */
export const REQUEST_TIMEOUT_MS = 10_000;
