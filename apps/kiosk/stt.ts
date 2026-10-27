// STT 어댑터. 기본은 브라우저의 Web Speech API(ko-KR). 한국어 정확도는 확인하지 못했다.
export interface SttResult {
  text: string;
  confidence: number | null; // 알 수 없으면 null
}
export interface SttAdapter {
  available(): boolean;
  /** 한 번 듣고 결과를 돌려준다. 실패하면 reject. */
  listen(): Promise<SttResult>;
  cancel(): void;
}

import { MIN_CONFIDENCE } from "./clinical.ts";
export { MIN_CONFIDENCE }; // 값과 사용자 결정 U10 표시는 clinical.ts

/** 비었거나 신뢰할 수 없으면 false: 서버로 보내지 않는다. */
export function isUsableTranscript(r: SttResult | null | undefined): boolean {
  if (!r) return false;
  if (r.text.replace(/[\s.,?!]/g, "") === "") return false;
  if (r.confidence !== null && r.confidence < MIN_CONFIDENCE) return false;
  return true;
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
  constructor(o: { allowRemote?: boolean } = {}) { this.allowRemote = o.allowRemote === true; }
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
          try { await C.install(opts); st = await C.available(opts); } catch { /* 설치 실패는 지원 안 함으로 */ }
        }
        this.localOk = st === "available";
      }
    } catch { this.localOk = false; }
    this.ready = true;
  }
  /** 온디바이스로 인식할 수 있나. */
  get local(): boolean { return this.localOk; }
  available(): boolean {
    return this.ctor() !== null && this.ready && (this.localOk || this.allowRemote);
  }
  /** 외부 제공자로 음성이 나갈 수 있는 상태(허용 설정이 켜져 있고 기기 안 인식은 안 되는 경우). */
  get remote(): boolean { return this.ctor() !== null && this.ready && !this.localOk && this.allowRemote; }
  listen(): Promise<SttResult> {
    return new Promise((resolve, reject) => {
      const C = this.ctor();
      if (!C || !this.available()) return reject(new Error("STT 사용 불가"));
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
        resolve({ text: String(alt.transcript ?? ""), confidence: typeof alt.confidence === "number" ? alt.confidence : null });
      };
      r.onerror = (e: any) => { if (!got) reject(new Error(String(e.error ?? "stt-error"))); };
      r.onend = () => { if (!got) resolve({ text: "", confidence: null }); };
      r.start();
    });
  }
  cancel(): void {
    try { this.rec?.abort(); } catch { /* 무시 */ }
  }
}
