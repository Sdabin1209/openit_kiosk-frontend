// 음성 인식 어댑터 컴포넌트. 기본은 브라우저의 Web Speech API(ko-KR). 한국어 정확도는 확인하지 못했다.
// 입력: 마이크(listen 호출). 출력: SttResult(schemas/SttResult.json) 또는 SttErrorKind를 가진 SttError. 서버로 보내도 되는지(UsableTranscript)는 상태 기계가 스키마로 가린다.
import type { SttErrorKind } from "../types/SttErrorKind.ts";
import type { SttResult } from "../types/SttResult.ts";
import { SttResult as vSttResult } from "../types/validators.gen.cjs";

export type { SttErrorKind, SttResult };
/** STT 실패의 종류(어댑터 -> 상태 기계 오류 스키마, KF-10). 상태 기계는 이 열거만 본다: 에러 메시지 문구나 브라우저 오류 코드 문자열을 읽지 않는다. */
export class SttError extends Error {
  kind: SttErrorKind;
  constructor(kind: SttErrorKind, message: string) { super(message); this.name = "SttError"; this.kind = kind; }
}
/** Web Speech API 오류 코드(SpeechRecognitionErrorCode) -> SttErrorKind. 표준 코드 밖의 값은 OTHER. */
export function sttErrorKind(code: string): SttErrorKind {
  if (code === "not-allowed" || code === "service-not-allowed" || code === "audio-capture") return "BLOCKED";
  if (code === "no-speech") return "NO_SPEECH";
  return "OTHER";
}

export interface SttAdapter {
  available(): boolean;
  /** 한 번 듣고 결과를 돌려준다. 실패하면 SttError로 reject. */
  listen(): Promise<SttResult>;
  cancel(): void;
}

/**
 * 브라우저 Web Speech API 어댑터. D88 U3: 기본은 기기 안 인식(processLocally)만 쓴다.
 * 기기가 한국어 온디바이스 인식을 지원하지 않으면 available()이 false가 되어 화면 입력으로 안내하고, 외부 제공자로 보내지 않는다.
 * allowRemote(기기 설정 allow_remote_stt)를 켠 경우에만 외부 인식으로 대체할 수 있다(환자 고지 문구가 화면에 보인다).
 * 온디바이스 확인은 SpeechRecognition.available({langs, processLocally})/install(Chrome 138+ 계열 API). 이 PC에서는 실제 지원 여부를 확인하지 못했다.
 */
export class WebSpeechStt implements SttAdapter {
  private rec: any = null;
  private localOk = false;
  private ready = false;
  private allowRemote: boolean;
  private installTimeoutMs: number;
  /** 언어 팩 설치가 시간 초과로 끝났다: 기기 안 인식이 곧 될 수도 있으므로 외부 인식으로 자동 전환하지 않는다(3차 점검 L). */
  private timedOut = false;
  private rechecking = false;
  constructor(o: { allowRemote?: boolean; installTimeoutMs?: number } = {}) { this.allowRemote = o.allowRemote === true; this.installTimeoutMs = o.installTimeoutMs ?? 10_000; /* 임의(측정 안 함) */ }
  setAllowRemote(v: boolean): void { this.allowRemote = v === true; }
  private ctor(): any {
    const w = globalThis as any;
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  }
  /** 온디바이스 한국어 인식이 되는지 확인한다(필요하면 언어 팩 설치를 시도). 끝나기 전에는 available()이 false다. */
  async init(): Promise<void> {
    const C = this.ctor();
    try {
      if (C && typeof C.available === "function") {
        const opts = { langs: ["ko-KR"], processLocally: true };
        let st = await C.available(opts);
        if ((st === "downloadable" || st === "downloading") && typeof C.install === "function") {
          try {
            // 언어 팩 내려받기가 끝나지 않으면 환자가 음성 입력만 기다리지 않게 상한 뒤 글자 입력으로 대체한다.
            let timer: ReturnType<typeof setTimeout> | undefined;
            const limit = new Promise<never>((_, rej) => { timer = setTimeout(() => rej(new Error("install timeout")), this.installTimeoutMs); });
            try { await Promise.race([C.install(opts), limit]); } finally { clearTimeout(timer); }
            st = await C.available(opts);
          } catch (e) { st = "unavailable"; /* 설치 실패·시간 초과는 지원 안 함으로 */ this.timedOut = (e as Error)?.message === "install timeout"; }
        }
        this.localOk = st === "available";
      }
    } catch { this.localOk = false; }
    this.ready = true;
  }
  /** 시간 초과로 끝난 경우에만 다시 확인한다(새로고침을 기다리지 않게). 대기 화면(IDLE)에서 부른다. 동시에 한 번만 돈다. */
  async recheck(): Promise<boolean> {
    if (!this.timedOut || this.rechecking) return false; // 다시 확인하지 않았다(호출한 쪽이 다시 그리지 않는다: 그리기 -> 확인 -> 그리기 반복 방지)
    this.rechecking = true; this.timedOut = false;
    try { await this.init(); } finally { this.rechecking = false; }
    return true;
  }
  /** 온디바이스로 인식할 수 있나. */
  get local(): boolean { return this.localOk; }
  available(): boolean {
    return this.ctor() !== null && this.ready && (this.localOk || (this.allowRemote && !this.timedOut));
  }
  /** 외부 제공자로 음성이 나갈 수 있는 상태(허용 설정이 켜져 있고 기기 안 인식은 안 되는 경우). */
  get remote(): boolean { return this.ctor() !== null && this.ready && !this.localOk && this.allowRemote && !this.timedOut; }
  listen(): Promise<SttResult> {
    return new Promise((resolve, reject) => {
      const C = this.ctor();
      if (!C || !this.available()) return reject(new SttError("BLOCKED", "STT_UNAVAILABLE"));
      const r = new C();
      this.rec = r;
      r.lang = "ko-KR";
      r.interimResults = false;
      r.maxAlternatives = 1;
      if (this.localOk) r.processLocally = true; // 음성을 기기 밖으로 보내지 않는다
      let got = false;
      r.onresult = (e: any) => {
        got = true;
        const alt = e.results[0][0];
        // 내는 쪽이 검증한다: 브라우저가 범위 밖 신뢰도를 주면 알 수 없음(null)으로 낸다.
        const out: SttResult = { text: String(alt.transcript ?? ""), confidence: typeof alt.confidence === "number" ? alt.confidence : null };
        resolve(vSttResult(out) ? out : { text: out.text, confidence: null });
      };
      r.onerror = (e: any) => { if (!got) reject(new SttError(sttErrorKind(String(e.error ?? "")), String(e.error ?? "stt-error"))); };
      r.onend = () => { if (!got) resolve({ text: "", confidence: null }); };
      r.start();
    });
  }
  cancel(): void {
    try { this.rec?.abort(); } catch { /* 무시 */ }
  }
}
