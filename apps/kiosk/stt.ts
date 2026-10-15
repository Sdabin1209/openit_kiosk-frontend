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

export const MIN_CONFIDENCE = 0.4;

/** 비었거나 신뢰할 수 없으면 false: 서버로 보내지 않는다. */
export function isUsableTranscript(r: SttResult | null | undefined): boolean {
  if (!r) return false;
  if (r.text.replace(/[\s.,?!]/g, "") === "") return false;
  if (r.confidence !== null && r.confidence < MIN_CONFIDENCE) return false;
  return true;
}

export class WebSpeechStt implements SttAdapter {
  private rec: any = null;
  private ctor(): any {
    const w = globalThis as any;
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  }
  available(): boolean {
    return this.ctor() !== null;
  }
  listen(): Promise<SttResult> {
    return new Promise((resolve, reject) => {
      const C = this.ctor();
      if (!C) return reject(new Error("STT 사용 불가"));
      const r = new C();
      this.rec = r;
      r.lang = "ko-KR";
      r.interimResults = false;
      r.maxAlternatives = 1;
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
