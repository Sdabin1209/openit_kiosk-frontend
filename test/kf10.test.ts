// KF-10 재현: STT 어댑터 -> 상태 기계 오류 전달이 에러 메시지 문자열이 아니라 오류 종류 열거(SttError.kind)여야 한다.
// 기대값의 출처(고치는 쪽 시험이 아님): Web Speech API 명세의 SpeechRecognitionErrorCode(no-speech, aborted, audio-capture, network,
// not-allowed, service-not-allowed, language-not-supported 등, https://wicg.github.io/speech-api/#enumdef-speechrecognitionerrorcode).
// 마이크 권한·장치 문제(not-allowed, service-not-allowed, audio-capture)와 이 기기에서 음성 입력을 쓸 수 없음은 '막힘(BLOCKED)',
// 말이 없음(no-speech)은 NO_SPEECH, 나머지는 OTHER다(분류는 기존 동작을 그대로 옮긴 것: 막힘만 화면 입력으로 대체한다).
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { SttError, WebSpeechStt } from "../apps/kiosk/stt.ts";
import { PublicApiClient } from "../api/client.ts";
import { KioskFlow } from "../apps/kiosk/flow.ts";
import { ok } from "./helpers.ts";

const g = globalThis as any;
afterEach(() => { delete g.SpeechRecognition; });
function fakeWithError(code: string) {
  class SR {
    lang = ""; onresult: any; onerror: any; onend: any;
    start() { setImmediate(() => this.onerror({ error: code })); }
    abort() {}
    static async available() { return "available"; }
  }
  g.SpeechRecognition = SR;
}

test("KF-10: 브라우저 오류 코드를 SttError.kind 열거로 바꿔 reject한다", async () => {
  const want: Record<string, string> = {
    "not-allowed": "BLOCKED", "service-not-allowed": "BLOCKED", "audio-capture": "BLOCKED",
    "no-speech": "NO_SPEECH",
    network: "OTHER", aborted: "OTHER", "language-not-supported": "OTHER", "아무거나": "OTHER",
  };
  for (const [code, kind] of Object.entries(want)) {
    fakeWithError(code);
    const stt = new WebSpeechStt(); await stt.init();
    const e = await stt.listen().then(() => null, (x) => x);
    assert.ok(e instanceof SttError, `${code}: SttError여야 한다`);
    assert.equal((e as SttError).kind, kind, code);
  }
});

test("KF-10: 이 기기에서 음성 입력을 쓸 수 없어 거부될 때도 BLOCKED(메시지 문구에 기대지 않는다)", async () => {
  const stt = new WebSpeechStt(); await stt.init(); // SpeechRecognition 없음
  const e = await stt.listen().then(() => null, (x) => x);
  assert.ok(e instanceof SttError); assert.equal((e as SttError).kind, "BLOCKED");
});

test("KF-10: 상태 기계는 kind만 본다 - BLOCKED는 화면 입력으로 대체, 그 밖은 다시 말하기이며 문구가 같아도 BLOCKED가 되지 않는다", async () => {
  const mk = () => new KioskFlow(new PublicApiClient({ sleep: async () => {}, fetch: (async () => ok("질문")) as any }), { idleMs: 0 });
  const a = mk(); await a.start(); a.sttError("BLOCKED");
  assert.equal(a.current.state, "REPEAT_PROMPT"); assert.equal(a.current.textFallback, true);
  for (const k of ["NO_SPEECH", "OTHER", null, "STT 사용 불가", "not-allowed"]) {
    const f = mk(); await f.start(); f.sttError(k as any);
    assert.equal(f.current.state, "REPEAT_PROMPT", String(k)); assert.equal(f.current.textFallback, undefined, `${k}: 막힘이 아니다`);
  }
});
