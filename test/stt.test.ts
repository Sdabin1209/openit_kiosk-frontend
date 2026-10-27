// D88 U3: 음성 인식은 기기 안에서만(processLocally). 지원하지 않으면 음성 입력을 끄고 외부로 보내지 않는다.
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { WebSpeechStt } from "../apps/kiosk/stt.ts";

const g = globalThis as any;
afterEach(() => { delete g.SpeechRecognition; delete g.webkitSpeechRecognition; });

function fakeCtor(o: { avail?: string[]; install?: boolean; noAvailable?: boolean } = {}) {
  const made: any[] = []; const calls: string[] = []; const avail = [...(o.avail ?? ["available"])];
  class SR {
    lang = ""; processLocally: boolean | undefined = undefined; onresult: any; onerror: any; onend: any;
    constructor() { made.push(this); }
    start() { setImmediate(() => this.onresult({ results: [[{ transcript: "머리가 아파요", confidence: 0.9 }]] })); }
    abort() {}
    static async available(opts: any) { calls.push("available:" + JSON.stringify(opts)); return avail.length > 1 ? avail.shift() : avail[0]; }
    static async install(opts: any) { calls.push("install:" + JSON.stringify(opts)); if (o.install === false) throw new Error("fail"); }
  }
  if (o.noAvailable) { delete (SR as any).available; delete (SR as any).install; }
  g.SpeechRecognition = SR;
  return { made, calls };
}

test("기기 안 인식이 가능하면 processLocally=true로 듣고 외부 표시(remote)는 꺼져 있다", async () => {
  const f = fakeCtor();
  const stt = new WebSpeechStt(); assert.equal(stt.available(), false, "init 전에는 쓰지 않는다");
  await stt.init();
  assert.equal(stt.available(), true); assert.equal(stt.local, true); assert.equal(stt.remote, false);
  assert.match(f.calls[0]!, /"processLocally":true/); assert.match(f.calls[0]!, /ko-KR/);
  const r = await stt.listen();
  assert.equal(r.text, "머리가 아파요");
  assert.equal(f.made[0].processLocally, true);
  assert.equal(f.made[0].lang, "ko-KR");
});

test("언어 팩이 내려받기 가능이면 설치를 시도하고, 설치되면 쓴다", async () => {
  const f = fakeCtor({ avail: ["downloadable", "available"] });
  const stt = new WebSpeechStt(); await stt.init();
  assert.ok(f.calls.some((c) => c.startsWith("install:")));
  assert.equal(stt.available(), true);
});

test("기기 안 인식을 지원하지 않으면(unavailable·설치 실패·API 없음) 음성 입력을 끄고 listen은 거부한다", async () => {
  for (const o of [{ avail: ["unavailable"] }, { avail: ["downloadable"], install: false }, { noAvailable: true }]) {
    fakeCtor(o as any);
    const stt = new WebSpeechStt(); await stt.init();
    assert.equal(stt.available(), false, JSON.stringify(o));
    assert.equal(stt.remote, false);
    await assert.rejects(stt.listen(), /STT 사용 불가/);
  }
  const none = new WebSpeechStt(); delete g.SpeechRecognition; await none.init(); assert.equal(none.available(), false);
});

test("외부 허용 설정(allowRemote)을 켠 기기에서만 외부 인식으로 대체하고 remote 표시가 켜진다, processLocally는 지정하지 않는다", async () => {
  const f = fakeCtor({ avail: ["unavailable"] });
  const stt = new WebSpeechStt({ allowRemote: true }); await stt.init();
  assert.equal(stt.available(), true); assert.equal(stt.remote, true);
  await stt.listen();
  assert.equal(f.made[0].processLocally, undefined);
  const off = new WebSpeechStt(); await off.init(); assert.equal(off.available(), false);
  off.setAllowRemote(true); assert.equal(off.available(), true);
});

test("L: install()이 끝나지 않으면 상한 뒤 지원 안 함으로 보고 글자 입력으로 대체한다", async () => {
  const f = fakeCtor({ avail: ["downloadable"] });
  (g.SpeechRecognition as any).install = () => new Promise(() => {}); // 끝나지 않는다
  const stt = new WebSpeechStt({ installTimeoutMs: 20 });
  await stt.init(); // 영원히 기다리지 않는다
  assert.equal(stt.available(), false);
  assert.equal(f.calls.filter((c) => c.startsWith("available")).length, 1, "시간 초과 뒤 다시 확인하지 않는다");
});

test("L(3차 점검): 설치 시간 초과 때는 allowRemote여도 외부 인식으로 자동 전환하지 않고, recheck()로 다시 확인한다", async () => {
  const f = fakeCtor({ avail: ["downloadable"] });
  (g.SpeechRecognition as any).install = () => new Promise(() => {});
  const stt = new WebSpeechStt({ allowRemote: true, installTimeoutMs: 20 });
  await stt.init();
  assert.equal(stt.available(), false); assert.equal(stt.remote, false);
  // 이제 언어 팩이 준비됐다고 하면 recheck가 새로고침 없이 온디바이스로 올린다.
  (g.SpeechRecognition as any).available = async () => "available";
  await stt.recheck();
  assert.equal(stt.available(), true); assert.equal(stt.remote, false); assert.equal(stt.local, true);
  // 시간 초과가 아닌 실패(설치 오류)는 명시한 allowRemote 설정대로 외부 인식을 쓴다(고지 문구가 화면에 보인다).
  fakeCtor({ avail: ["downloadable"], install: false });
  const s2 = new WebSpeechStt({ allowRemote: true }); await s2.init();
  assert.equal(s2.remote, true);
  void f;
});
