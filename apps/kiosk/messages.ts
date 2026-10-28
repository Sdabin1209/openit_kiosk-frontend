// 환자에게 보이는 문구는 모두 이 모듈에만 둔다(표준성 점검 2026-10-29 #61, D89 임상 문구 통제).
// 항목마다 reviewed: 임상 검토를 받았으면 true. 지금은 받은 것이 없어 전부 false다(검토 기록이 생기면 그 항목만 true로 바꾸고 근거를 ADR 0016에 적는다).
// 이 폴더의 다른 소스에 한글 문자열 리터럴을 두지 않는다(test/copy.test.ts가 소스를 읽어 확인한다).
// 문구 안의 {n}은 fill()이 채운다.
export interface Msg { readonly text: string; readonly reviewed: boolean }
const m = (text: string): Msg => ({ text, reviewed: false });

export const MSG = {
  // 화면 제목과 버튼(임시 UI 문구, 임상 검토 전)
  TITLE_IDLE: m("문진을 시작합니다"),
  TITLE_WAIT: m("잠시만 기다려 주세요"),
  TITLE_LISTENING: m("말씀해 주세요"),
  TITLE_REPEAT: m("다시 말씀해 주세요"),
  TITLE_SENDING: m("확인하고 있어요"),
  TITLE_WAITING_STAFF: m("직원이 곧 도와드립니다"),
  TITLE_CALL_STAFF: m("직원을 불러 주세요"),
  TITLE_ENDING: m("마무리하고 있어요"),
  TITLE_ENDED: m("수고하셨습니다"),
  TITLE_END_FAILED: m("종료를 서버에 알리지 못했습니다"),
  BTN_START: m("시작하기"),
  BTN_SPEAK: m("말하기"),
  BTN_LISTENING: m("듣고 있어요…"),
  BTN_STOP: m("그만하기"),
  BTN_CALL_STAFF: m("직원 부르기"),
  BTN_HOME: m("처음으로"),
  BTN_SENDING: m("보내는 중…"),
  BTN_TOLD_STAFF_HOME: m("직접 알렸어요, 처음으로"),
  BTN_CANCEL: m("취소"),
  BTN_RETRY_STAFF_CALL: m("직원 다시 부르기"),
  // 본문
  BODY_KEEP_TALKING: m("계속 말씀해 주세요."),
  BODY_RETRYING: m("연결이 느려 다시 시도하고 있어요. 기다리기 어려우시면 아래 버튼을 눌러 주세요."),
  BODY_WAIT_DEFAULT: m("그대로 기다려 주세요. 직원이 오면 이어서 안내해 드립니다."),
  BODY_STATE_UNREACHABLE: m("상태를 확인하지 못하고 있어요. 가까이 있는 직원에게 알려 주세요."),
  BODY_LONG_WAIT_SUFFIX: m("오래 걸리면 가까이 있는 직원에게 알려 주세요."),
  BODY_CALL_STAFF_DEFAULT: m("가까이 있는 직원에게 알려 주세요."),
  BODY_NO_DEVICE_TOKEN: m("이 기기는 설정이 필요합니다. 가까이 있는 직원에게 알려 주세요."),
  BODY_AUTH_DENIED: m("이 기기의 인증이 거부되었습니다. 가까이 있는 직원에게 알려 주세요."),
  BODY_BAD_SUBJECT_REF: m("접수 정보를 확인할 수 없습니다. 가까이 있는 직원에게 알려 주세요."),
  BODY_REPEAT_LIMIT: m("여러 번 알아듣지 못했어요. 가까이 있는 직원에게 알려 주세요."),
  BODY_CONFIRM_LEAVE: m("직원에게 직접 알리셨나요? 알리지 않았다면 취소를 눌러 직원을 찾아 주세요."),
  BODY_NOT_COMMITTED: m("저장하지 못했어요. 다시 말씀해 주세요."),
  BODY_END_FAILED: m("가까이 있는 직원에게 알려 주세요."), // 종료 실패를 숨기지 않는다
  COUNTDOWN: m("{n}초 뒤에 다시 부를 수 있어요"),
  // 안내(role=status)
  NOTICE_NO_SUBJECT_REF: m("접수 정보 없이 시작했습니다. 직원에게 알려 주세요."),
  // [임시, 임상/법무 검토 전] 외부 인식을 허용한 기기에서만 보이는 환자 고지
  NOTICE_REMOTE_STT: m("음성은 외부 음성 인식 서비스로 전송될 수 있습니다. 원치 않으시면 글자로 입력해 주세요."),
  NOTICE_NO_STT: m("이 기기에서는 음성 인식을 쓸 수 없어요. 아래에 글자로 입력해 주세요."),
  // [임상 검토 필요] 되묻기 한도 정지인데 서버가 고정 문장을 주지 않았을 때만(ADR 0014)
  NOTICE_REASK_LIMIT_WAIT: m("답변을 잘 알아듣지 못해 잠시 멈췄어요. 직원이 와서 도와드릴 때까지 그대로 기다려 주세요."),
  // [임상 검토 필요] 직원 알림 재전송 안내(ADR 0014)
  STAFF_CALL_STILL_FAILED: m("아직 직원에게 알림이 닿지 않았어요. 접수처로 직접 가서 직원에게 알려 주세요. 잠시 뒤 다시 부를 수 있어요."),
  STAFF_CALL_NETWORK: m("연결이 되지 않아 다시 부르지 못했어요. 다시 눌러 주시거나 직원에게 직접 알려 주세요."),
  STAFF_CALL_NO_ALERT: m("서버에 열린 호출이 없다고 해요. 그래도 접수처로 직접 가서 직원에게 알려 주세요."),
  STAFF_CALL_AUTH: m("이 기기의 인증이 거부되어 다시 부를 수 없어요. 접수처로 직접 가서 직원에게 알려 주세요."),
  STAFF_CALL_BUSY: m("잠시 다른 요청이 처리 중이에요. 잠시 뒤 다시 눌러 주세요. 접수처로 직접 가서 알려도 좋아요."),
  STAFF_CALL_READY: m("다시 부르기를 누를 수 있습니다."),
  STAFF_CALL_LIMIT: m("더 이상 다시 부를 수 없어요. 접수처로 직접 가서 직원에게 알려 주세요."),
  STAFF_CALL_UNSUPPORTED: m("지금은 다시 부르기를 쓸 수 없어요. 접수처로 직접 가서 직원에게 알려 주세요."),
  STAFF_CALL_REPORT_FAILED: m("알린 내용을 기록하지 못했어요. 직원에게 직접 알려 주세요."),
  // [provisional] 전달 실패 화면의 상시 안내(ADR 0014)
  DELIVERY_FAILED_DIRECT: m("직원에게 알림이 닿지 않았을 수 있어요. 접수처로 직접 가서 직원에게 알려 주세요."),
  // 입력창·대화 목록
  LABEL_MANUAL_INPUT: m("말씀하실 내용을 입력해 주세요"),
  LABEL_CHAT: m("대화"),
  CHAT_PATIENT: m("나"),
  CHAT_SYSTEM: m("안내"),
  // 유휴 만료 전 경고와 연장(WCAG 2.2 SC 2.2.1, #29)
  IDLE_WARNING: m("{n}초 안에 아래 버튼을 누르지 않으면 처음 화면으로 돌아갑니다."),
  BTN_IDLE_EXTEND: m("계속하기"),
} as const satisfies Record<string, Msg>;

/** {n} 같은 자리를 채운다. */
export function fill(msg: Msg, vars: Record<string, string | number>): string {
  return msg.text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}
