// 헤드리스 Chromium(Playwright)에서 키오스크·직원 콘솔을 실제로 열어 핵심 흐름을 확인한다.
// 백엔드는 이 리포의 모의 서버(공개 API 대역)이고 정적 파일은 dist/를 낸다. 고정 포트 없음.
// 가짜 입력만 쓴다(환자 정보 없음). 마이크·실제 한국어 STT는 여기서 확인하지 않는다(docs/runbook.md 사람 확인 목록).
import test from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { mkdirSync } from "node:fs";
import { createECDH } from "node:crypto";
import type { AddressInfo } from "node:net";
import { chromium, type Browser, type Page, type BrowserContext } from "playwright";
import { createMock } from "../mock-server/app.ts";
import { makeStaticHandler } from "../server/static.mjs";

const SHOTS = "e2e-artifacts";
mkdirSync(SHOTS, { recursive: true });
const mock = createMock({});
const st = makeStaticHandler({ dir: "dist" });
const api = mock.server.listeners("request")[0] as (...a: any[]) => void;
// 게이트웨이 CSRF 방어(Sec-Fetch-Site same-origin|none, Origin == 요청 출처)와 Referrer-Policy: no-referrer를 모의한다.
// 브라우저가 보낸 상태 변경 요청(Sec-Fetch-Site가 있는 것만 = 브라우저. Node의 시험용 fetch는 보내지 않아 제외)의 헤더를 기록해 마지막 시험에서 확인한다.
const mutations: { method: string; path: string; site?: string; origin?: string }[] = [];
const web: Server = createServer((req, res) => {
  const p = req.url ?? "";
  res.setHeader("Referrer-Policy", "no-referrer");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method ?? "") && req.headers["sec-fetch-site"]) {
    mutations.push({ method: req.method ?? "", path: p.split("?")[0], site: req.headers["sec-fetch-site"] as string | undefined, origin: req.headers.origin as string | undefined });
  }
  if (p.startsWith("/v1/") || p.startsWith("/__mock/")) api(req, res);
  else if (staticDown) { res.writeHead(503, { "retry-after": "1" }); res.end("static down"); } // 정적 화면 서버 장애 모의(A3)
  else void st(req, res);
});
let base = "", browser: Browser, staticDown = false;
const vapid = (() => { const e = createECDH("prime256v1"); e.generateKeys(); return e.getPublicKey().toString("base64url"); })();

test.before(async () => {
  await new Promise<void>((r) => web.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(web.address() as AddressInfo).port}`;
  browser = await chromium.launch({ channel: "chromium" }); // 새 헤드리스(전체 Chromium): 알림 권한 부여가 동작한다
});
test.after(async () => {
  await browser?.close();
  mock.reset(); web.closeAllConnections();
  await new Promise<void>((r) => web.close(() => r()));
});

const scenario = (name: string, extra: object = {}) => fetch(`${base}/__mock/scenario`, { method: "POST", body: JSON.stringify({ name, ...extra }) }).then((r) => assert.equal(r.status, 200));

/** stt: "fake" = 가짜 SpeechRecognition(결과를 텍스트로 대체), "none" = STT 없음(텍스트 입력 경계). */
async function open(stt: "fake" | "fake-nolocal" | "none", fakeText = "가짜 증상 문장입니다", ctxOpts: object = {}): Promise<{ page: Page; ctx: BrowserContext; errors: string[] }> {
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, ...ctxOpts });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.addInitScript(({ stt, fakeText }) => {
    const w = window as any;
    delete w.SpeechRecognition; delete w.webkitSpeechRecognition;
    if (stt === "fake" || stt === "fake-nolocal") {
      // D88 U3: 기기 안 인식(processLocally)이 되는 기기와 안 되는 기기를 모의한다.
      w.__stt = { processLocally: undefined as unknown };
      w.SpeechRecognition = class {
        lang = ""; interimResults = false; maxAlternatives = 1; processLocally: boolean | undefined = undefined;
        onresult: any; onend: any; onerror: any;
        start() { w.__stt.processLocally = this.processLocally; setTimeout(() => { this.onresult?.({ results: [[{ transcript: fakeText, confidence: 0.9 }]] }); this.onend?.(); }, 10); }
        abort() {}
        static async available() { return stt === "fake" ? "available" : "unavailable"; }
        static async install() {}
      };
    }
  }, { stt, fakeText });
  return { page, ctx, errors };
}
const DEV = "dev-tok-FAKE-e2e";
const kioskUrl = (frag = `device=${DEV}`) => `${base}/#${frag}`; // 기기 토큰은 시작 URL 조각으로 받는다(쿼리 문자열 아님)
const title = (p: Page) => p.locator("#title");

test("키오스크: 시작 → 질문 → 텍스트 제출 → 다음 응답 → 종료 (STT 없음, 입력 경계)", async () => {
  await scenario("normal");
  const { page, ctx, errors } = await open("none");
  await page.goto(kioskUrl());
  await assert.doesNotReject(page.getByRole("button", { name: "시작하기" }).waitFor());
  await page.screenshot({ path: `${SHOTS}/kiosk-1-idle.png` });
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByText("어디가 불편하신가요?").waitFor();
  assert.equal(await title(page).textContent(), "말씀해 주세요");
  await page.locator("#manual-input").waitFor({ state: "visible" });
  await page.screenshot({ path: `${SHOTS}/kiosk-2-question.png` });
  await page.locator("#manual-input").fill("가짜 증상 문장입니다");
  await page.getByRole("button", { name: "말하기" }).click();
  await page.getByText("언제부터 그러셨나요?").waitFor();
  await page.screenshot({ path: `${SHOTS}/kiosk-3-next.png` });
  await page.getByRole("button", { name: "그만하기" }).click();
  await page.getByText("수고하셨습니다").waitFor();
  await page.screenshot({ path: `${SHOTS}/kiosk-4-ended.png` });
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("키오스크: 가짜 SpeechRecognition 경계로 텍스트가 제출된다 (ko-KR 설정 확인)", async () => {
  await scenario("normal");
  const { page, ctx, errors } = await open("fake");
  await page.goto(kioskUrl());
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByText("어디가 불편하신가요?").waitFor();
  assert.equal(await page.locator("#manual").isHidden(), true, "STT가 있으면 텍스트 입력은 숨는다");
  await page.getByRole("button", { name: "말하기" }).click();
  await page.getByText("언제부터 그러셨나요?").waitFor();
  assert.equal(await page.evaluate(() => (window as any).__stt.processLocally), true, "기기 안 인식(processLocally)만 쓴다");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("키오스크: 기기 안 인식이 안 되는 기기는 음성 입력을 끄고 글자 입력으로 안내한다 (외부로 보내지 않음)", async () => {
  await scenario("normal");
  const { page, ctx } = await open("fake-nolocal");
  await page.goto(kioskUrl());
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByText("어디가 불편하신가요?").waitFor();
  await page.locator("#manual").waitFor({ state: "visible" });
  await page.getByText("음성 인식을 쓸 수 없어요").waitFor();
  assert.equal(await page.evaluate(() => (window as any).__stt.processLocally), undefined, "인식을 시작하지 않았다");
  await page.locator("#manual-input").fill("가짜 두통 문장");
  await page.getByRole("button", { name: "말하기" }).click();
  await page.getByText("언제부터 그러셨나요?").waitFor();
  assert.equal(await page.evaluate(() => (window as any).__stt.processLocally), undefined);
  await ctx.close();
});

test("키오스크: 실서버 응답 모양(신호 null + 상태 PAUSED_RISK)에서도 위험 정지 대기 화면으로 간다 (H-2)", async () => {
  await scenario("risk_stop_null_signal");
  const { page, ctx } = await open("none");
  await page.goto(kioskUrl());
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByText("어디가 불편하신가요?").waitFor();
  await page.locator("#manual-input").fill("위험해요");
  await page.getByRole("button", { name: "말하기" }).click();
  await page.getByText("직원이 곧 도와드립니다").waitFor({ timeout: 10_000 });
  assert.equal(await page.getByRole("button", { name: "그만하기" }).count(), 0, "정지 중에는 그만하기를 숨긴다");
  await ctx.close();
});

test("키오스크: 마이크 거부는 글자 입력으로 대체되고 직원 부르기 버튼이 있으며 반복 상한 뒤 직원 호출 안내", async () => {
  await scenario("normal");
  const ctx0 = await browser.newContext({ viewport: { width: 1080, height: 1920 } });
  const page = await ctx0.newPage();
  await page.addInitScript(() => {
    const w = window as any;
    w.SpeechRecognition = class {
      onresult: any; onend: any; onerror: any;
      start() { setTimeout(() => this.onerror?.({ error: "not-allowed" }), 5); }
      abort() {}
      static async available() { return "available"; }
    };
  });
  await page.goto(kioskUrl());
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByText("어디가 불편하신가요?").waitFor();
  await page.getByRole("button", { name: "직원 부르기" }).waitFor();
  await page.getByRole("button", { name: "말하기" }).click();
  await page.getByText("다시 말씀해 주세요").first().waitFor();
  await page.locator("#manual").waitFor({ state: "visible" }); // 마이크 거부 뒤 글자 입력으로 대체
  await page.getByRole("button", { name: "그만하기" }).waitFor();
  for (let i = 0; i < 3; i++) { // 빈 입력도 인식 실패로 센다: 상한(잠정 3회)을 넘기면 직원 호출 안내
    if (await page.getByText("직원을 불러 주세요").count()) break;
    await page.getByRole("button", { name: "말하기" }).click();
  }
  await page.getByText("여러 번 알아듣지 못했어요").waitFor({ timeout: 5_000 });
  await ctx0.close();
});

test("키오스크: 위험 발화 → 직원 대기 화면 (스크린샷)", async () => {
  await scenario("risk_stop");
  const { page, ctx } = await open("none");
  await page.goto(kioskUrl());
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByText("어디가 불편하신가요?").waitFor();
  await page.locator("#manual-input").fill("위험해요");
  await page.getByRole("button", { name: "말하기" }).click();
  await page.getByText("직원이 곧 도와드립니다").waitFor();
  assert.equal(await page.locator("#action").isHidden(), true, "대기 중에는 버튼이 없다");
  await page.screenshot({ path: `${SHOTS}/kiosk-5-waiting-staff.png` });
  await ctx.close();
});

test("키오스크: 직원 호출 화면(알림 전달 실패) → 처음으로", async () => {
  await scenario("delivery_failed");
  const { page, ctx } = await open("none");
  await page.goto(kioskUrl());
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByText("어디가 불편하신가요?").waitFor();
  await page.locator("#manual-input").fill("위험해요");
  await page.getByRole("button", { name: "말하기" }).click();
  await page.getByText("직원을 불러 주세요").waitFor();
  assert.equal(await page.evaluate(() => document.body.classList.contains("warn")), true);
  await page.screenshot({ path: `${SHOTS}/kiosk-6-call-staff.png` });
  // 알림이 닿지 않은 상태: 처음으로는 한 번 더 확인한다(3차 점검 K-b). 취소하면 직원 호출 화면에 남는다.
  await page.getByRole("button", { name: "처음으로" }).click();
  await page.getByText("직원에게 직접 알리셨나요?").waitFor();
  await page.getByRole("button", { name: "취소" }).click();
  await page.getByRole("button", { name: "처음으로" }).waitFor();
  await page.getByRole("button", { name: "처음으로" }).click();
  await page.getByRole("button", { name: "직접 알렸어요, 처음으로" }).click();
  await page.getByRole("button", { name: "시작하기" }).waitFor();
  await ctx.close();
});

const config = (o: object) => fetch(`${base}/__mock/config`, { method: "POST", body: JSON.stringify(o) }).then((r) => assert.equal(r.status, 200));
const mockAlerts = async () => ((await (await fetch(`${base}/__mock/state`)).json()) as any).alerts as any[];
async function toDeliveryFailed(page: Page, word = "위험해요") {
  await page.goto(kioskUrl());
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByText("어디가 불편하신가요?").waitFor();
  await page.locator("#manual-input").fill(word);
  await page.getByRole("button", { name: "말하기" }).click();
  await page.getByText("직원을 불러 주세요").waitFor();
}

test("키오스크 2.1.0: 다시 부르기 - 실패하면 카운트다운 동안 비활성, 키보드로 누르고, 성공하면 대기 안내로 바뀐다", async () => {
  await scenario("delivery_failed_retry_fails");
  const { page, ctx } = await open("none");
  await toDeliveryFailed(page);
  const btn = page.getByRole("button", { name: "직원 다시 부르기" });
  await btn.waitFor();
  assert.match(await page.locator("#text").innerText(), /접수처로 직접 가서 직원에게 알려 주세요/, "직접 안내가 상시 보인다");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "action", "CALL_STAFF 진입 때 초점은 처음으로");
  await page.keyboard.press("Tab"); // 키보드만으로 도달: 다음 초점이 다시 부르기
  assert.equal(await page.evaluate(() => document.activeElement?.id), "staffcall");
  await page.keyboard.press("Enter");
  await page.locator("#countdown").waitFor({ state: "visible" });
  assert.equal(await btn.isDisabled(), true, "retry_after_s 동안 비활성");
  assert.equal(await page.locator("#countdown").getAttribute("aria-hidden"), "true", "초마다 바뀌는 숫자는 낭독하지 않는다");
  assert.match(await page.locator("#countdown").innerText(), /\d초 뒤에 다시 부를 수 있어요/);
  assert.match(await page.locator("#notice").innerText(), /아직 직원에게 알림이 닿지 않았어요/);
  assert.equal(await page.getByText("직원을 불러 주세요").count(), 1, "화면은 끝나지 않는다");
  await page.screenshot({ path: `${SHOTS}/kiosk-7-retry-countdown.png` });
  await page.waitForFunction(() => !(document.getElementById("staffcall") as HTMLButtonElement).disabled, null, { timeout: 8_000 }); // 상한은 실패 시에만 쓰인다
  assert.equal(await page.locator("#countdown").isHidden(), true);
  assert.match(await page.locator("#notice").innerText(), /다시 부르기를 누를 수 있습니다/, "버튼이 켜지는 순간 role=status로 알린다(L-4)");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "staffcall", "초점이 버튼으로 돌아온다(L-4)");
  assert.equal(await page.locator("#notice").getAttribute("role"), "status");
  await config({ retryDelivery: "DELIVERED", enforceInterval: false });
  await btn.click();
  await page.getByText("직원이 곧 도와드립니다").waitFor();
  const al = (await mockAlerts())[0];
  assert.equal(al.delivery_attempts, 3);
  await ctx.close();
});

test("키오스크 2.1.0: 오프라인에서 다시 부르기는 화면을 유지하고, 복구 뒤 같은 요청으로 성공한다", async () => {
  await scenario("delivery_failed", { retryAfterS: 1 });
  const { page, ctx } = await open("none");
  await toDeliveryFailed(page);
  await ctx.setOffline(true);
  await page.getByRole("button", { name: "직원 다시 부르기" }).click();
  await page.getByText("연결이 되지 않아 다시 부르지 못했어요").waitFor();
  assert.equal(await page.getByText("직원을 불러 주세요").count(), 1);
  assert.equal(await page.getByRole("button", { name: "직원 다시 부르기" }).isEnabled(), true, "오프라인 오류 뒤에는 다시 누를 수 있다");
  await ctx.setOffline(false);
  await page.getByRole("button", { name: "직원 다시 부르기" }).click();
  await page.getByText("직원이 곧 도와드립니다").waitFor();
  await ctx.close();
});

test("키오스크 2.1.0: 상한(RETRY_LIMIT)이면 버튼이 사라지고 직접 안내만 남는다. 화면은 끝나지 않는다", async () => {
  await scenario("delivery_failed_retry_fails", { retryAfterS: 1, enforceInterval: false, retryLimit: 1 });
  const { page, ctx } = await open("none");
  await toDeliveryFailed(page);
  const btn = page.getByRole("button", { name: "직원 다시 부르기" });
  await btn.click();
  await page.waitForFunction(() => !(document.getElementById("staffcall") as HTMLButtonElement).disabled && !document.getElementById("staffcall")!.hidden, null, { timeout: 8_000 });
  await btn.click();
  await page.getByText("더 이상 다시 부를 수 없어요").waitFor();
  await btn.waitFor({ state: "hidden" });
  assert.match(await page.locator("#text").innerText(), /접수처로 직접 가서/);
  assert.equal(await page.getByText("직원을 불러 주세요").count(), 1);
  await ctx.close();
});

test("키오스크 2.1.0: '못 알렸어요'(취소)는 NOT_NOTIFIED를, '직접 알렸어요'는 STAFF_NOTIFIED_MANUALLY를 서버에 남기고 직원 호출 화면은 취소로 끝나지 않는다", async () => {
  await scenario("delivery_failed");
  const { page, ctx } = await open("none");
  await toDeliveryFailed(page);
  await page.getByRole("button", { name: "처음으로" }).click();
  await page.getByRole("button", { name: "취소" }).click();
  await page.getByRole("button", { name: "처음으로" }).waitFor();
  await page.waitForFunction(async () => ((await (await fetch("/__mock/state")).json()) as any).alerts[0]?.manual_notice_outcome === "NOT_NOTIFIED");
  assert.equal(await page.getByText("직원을 불러 주세요").count(), 1);
  await page.getByRole("button", { name: "처음으로" }).click();
  await page.getByRole("button", { name: "직접 알렸어요, 처음으로" }).click();
  await page.getByRole("button", { name: "시작하기" }).waitFor();
  assert.equal((await mockAlerts())[0].manual_notice_outcome, "STAFF_NOTIFIED_MANUALLY");
  const sess = ((await (await fetch(`${base}/__mock/state`)).json()) as any).sessions[0];
  assert.equal(sess.ended, false, "환자가 서버 세션을 끝내지 못한다(직원 개입으로만 해제)");
  await ctx.close();
});

test("키오스크 2.1.0: '직접 알렸어요' 더블 클릭은 report를 한 번만 보낸다(L-1)", async () => {
  await scenario("delivery_failed", { delayMs: 200 });
  const { page, ctx } = await open("none");
  const reports: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/staff-call/report")) reports.push(r.postData() ?? ""); });
  await toDeliveryFailed(page);
  await page.getByRole("button", { name: "처음으로" }).click();
  await page.getByText("직원에게 직접 알리셨나요?").waitFor();
  await page.getByRole("button", { name: "직접 알렸어요, 처음으로" }).dblclick();
  await page.getByRole("button", { name: "시작하기" }).waitFor();
  assert.equal(reports.length, 1);
  assert.match(reports[0], /STAFF_NOTIFIED_MANUALLY/);
  await ctx.close();
});

test("직원 콘솔 2.1.0: 열린 알림이 키오스크의 재알림으로 다시 오면 재전달 배너가 뜨고 목록은 한 건이다(M-1)", async () => {
  await scenario("delivery_failed");
  const staff = await open("none"); await staff.page.goto(base + "/staff/");
  const k = await open("none");
  await toDeliveryFailed(k.page);
  await staff.page.locator("#open li").first().waitFor();
  assert.equal(await staff.page.locator("#banner").innerText().then((t) => /새 알림/.test(t)), true);
  await k.page.getByRole("button", { name: "직원 다시 부르기" }).click();
  await staff.page.getByText("재전달 알림").waitFor();
  assert.equal(await staff.page.locator("#open li").count(), 1, "같은 alert_id는 한 건으로 합친다");
  await k.ctx.close(); await staff.ctx.close();
});

test("키오스크 2.1.0: 옛 서버(경로 404)면 기능 감지로 다시 부르기를 끄고 기존 '직접 알리셨나요?' 동작을 유지한다", async () => {
  await scenario("delivery_failed_old_server");
  const { page, ctx } = await open("none");
  await toDeliveryFailed(page);
  await page.getByRole("button", { name: "직원 다시 부르기" }).click();
  await page.getByText("지금은 다시 부르기를 쓸 수 없어요").waitFor();
  await page.getByRole("button", { name: "직원 다시 부르기" }).waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "처음으로" }).click();
  await page.getByText("직원에게 직접 알리셨나요?").waitFor();
  await page.getByRole("button", { name: "직접 알렸어요, 처음으로" }).click();
  await page.getByRole("button", { name: "시작하기" }).waitFor();
  await ctx.close();
});

test("키오스크 2.1.0: 정지 사유 - 위험 정지와 되묻기 한도 정지를 구분하고(서버 고정 문장 우선), 옛 서버는 기존 화면", async () => {
  for (const [word, reason, sentence] of [["위험해요", "RISK", /확인이 필요합니다/], ["알수없음", "REASK_LIMIT", /직원이 도와드리겠습니다/]] as const) {
    await scenario("risk_stop");
    const { page, ctx } = await open("none");
    await page.goto(kioskUrl());
    await page.getByRole("button", { name: "시작하기" }).click();
    await page.getByText("어디가 불편하신가요?").waitFor();
    await page.locator("#manual-input").fill(word);
    await page.getByRole("button", { name: "말하기" }).click();
    await page.getByText("직원이 곧 도와드립니다").waitFor();
    await page.waitForFunction((r) => document.body.dataset.pauseReason === r, reason, { timeout: 8_000 }); // 폴링(2초)으로 사유를 알게 된다
    assert.match(await page.locator("#text").innerText(), sentence, "서버 고정 문장이 우선");
    await ctx.close();
  }
  await scenario("old_server_no_pause_reason");
  const { page, ctx } = await open("none");
  await page.goto(kioskUrl());
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByText("어디가 불편하신가요?").waitFor();
  await page.locator("#manual-input").fill("알수없음");
  await page.getByRole("button", { name: "말하기" }).click();
  await page.getByText("직원이 곧 도와드립니다").waitFor();
  await new Promise((r) => setTimeout(r, 2500));
  assert.equal(await page.evaluate(() => document.body.dataset.pauseReason), undefined, "필드가 없으면 미상: 기존 화면");
  await ctx.close();
});

test("직원 콘솔 2.1.0: 전달 시도·직접 통지 보고와 정지 사유가 글자로 구분되어 보인다(구버전 필드 없음은 기존 표시)", async () => {
  await scenario("delivery_failed");
  const k = await open("none");
  await toDeliveryFailed(k.page);
  await k.page.getByRole("button", { name: "직원 다시 부르기" }).click(); // 재전달 시도 +1 (DELIVERED)
  await k.page.getByText("직원이 곧 도와드립니다").waitFor();
  const staff = await open("none"); await staff.page.goto(base + "/staff/");
  const li = staff.page.locator("#open li").first();
  await li.waitFor();
  await li.getByText("[위험 정지]").waitFor();
  assert.match(await li.innerText(), /전달 2회 시도, 마지막: 전달됨/);
  await staff.page.screenshot({ path: `${SHOTS}/staff-3-delivery-pause.png` });
  await scenario("risk_stop"); // 새 시나리오가 알림을 비운다. 되묻기 한도 정지 알림
  const k2 = await open("none");
  await k2.page.goto(kioskUrl()); await k2.page.getByRole("button", { name: "시작하기" }).click();
  await k2.page.getByText("어디가 불편하신가요?").waitFor();
  await k2.page.locator("#manual-input").fill("알수없음"); await k2.page.getByRole("button", { name: "말하기" }).click();
  await staff.page.locator("#open li", { hasText: "[되묻기 한도 정지]" }).waitFor();
  await k.ctx.close(); await k2.ctx.close(); await staff.ctx.close();
});

test("키오스크: 서버 오류가 계속되면 직원 호출 화면 (503)", async () => {
  await scenario("error", { errorTimes: 100 });
  const { page, ctx } = await open("none");
  await page.goto(kioskUrl());
  await page.getByRole("button", { name: "시작하기" }).click();
  // 재시도 중(예산 20초)에는 대기 문구와 직원 부르기·그만하기 버튼이 보인다.
  await page.getByRole("button", { name: "직원 부르기" }).waitFor({ timeout: 10_000 });
  await page.getByText("잠시만 기다려 주세요").waitFor();
  await page.getByRole("button", { name: "그만하기" }).waitFor();
  await page.getByText("직원을 불러 주세요").waitFor({ timeout: 45_000 }); // 예산 소진 뒤
  await page.screenshot({ path: `${SHOTS}/kiosk-7-error-call-staff.png` });
  await ctx.close();
});

test("키오스크: 재시도 중 직원 부르기를 누르면 바로 직원 호출 화면 (503)", async () => {
  await scenario("error", { errorTimes: 100 });
  const { page, ctx } = await open("none");
  await page.goto(kioskUrl());
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByRole("button", { name: "직원 부르기" }).click({ timeout: 10_000 });
  await page.getByText("직원을 불러 주세요").waitFor({ timeout: 3_000 });
  await ctx.close();
});

test("키오스크: 이미 열린 화면은 정적 서버가 죽어도 진행 중인 세션을 이어 간다 (A3)", async () => {
  await scenario("normal");
  staticDown = false;
  const { page, ctx } = await open("none");
  await page.goto(kioskUrl());
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByText("어디가 불편하신가요?").waitFor();
  staticDown = true;
  try {
    const st503 = await page.evaluate(async () => (await fetch("/kiosk.js", { cache: "no-store" })).status);
    assert.equal(st503, 503, "정적 파일은 실제로 내려가 있다");
    await page.locator("#manual-input").fill("가짜 두통 문장");
    await page.getByRole("button", { name: "말하기" }).click();
    await page.getByText("언제부터 그러셨나요?").waitFor({ timeout: 10_000 });
    await page.getByRole("button", { name: "그만하기" }).click();
    await page.getByText("수고하셨습니다").waitFor({ timeout: 10_000 });
  } finally { staticDown = false; }
  await ctx.close();
});

test("키오스크: 저장 실패(NOT_COMMITTED)는 다시 말하기 화면", async () => {
  await scenario("not_committed");
  const { page, ctx } = await open("none");
  await page.goto(kioskUrl());
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByText("어디가 불편하신가요?").waitFor();
  await page.locator("#manual-input").fill("가짜 문장");
  await page.getByRole("button", { name: "말하기" }).click();
  await page.getByText("다시 말씀해 주세요").first().waitFor();
  await page.screenshot({ path: `${SHOTS}/kiosk-8-repeat.png` });
  await ctx.close();
});

test("키오스크: 응답 지연 중에는 '확인하고 있어요' 대기 화면", async () => {
  await scenario("delay");
  const { page, ctx } = await open("none");
  await page.goto(kioskUrl());
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByText("잠시만 기다려 주세요").waitFor();
  await page.screenshot({ path: `${SHOTS}/kiosk-9-starting.png` });
  await page.getByText("어디가 불편하신가요?").waitFor({ timeout: 10_000 });
  await ctx.close();
});

test("직원 콘솔: 스트림이 5xx로 거절되면 '연결 끊김'을 보이고 백오프 재연결로 사람 개입 없이 복구된다", async () => {
  await scenario("risk_stop", { streamErrorStatus: 503, streamErrorTimes: 2 });
  const staff = await open("none"); await staff.page.goto(base + "/staff/");
  await staff.page.getByText("연결 끊김").first().waitFor({ timeout: 5_000 });
  assert.equal(await staff.page.locator("#conn").getAttribute("role"), "alert");
  await staff.page.getByText("실시간 연결됨").waitFor({ timeout: 15_000 }); // 1~2초 + 지터 후 복구
  await staff.ctx.close();
});

test("직원 콘솔: 스트림이 끊긴 사이 생긴 알림이 재연결 뒤 목록 보충으로 나타난다", async () => {
  await scenario("risk_stop");
  const staff = await open("none"); await staff.page.goto(base + "/staff/");
  await staff.page.getByText("실시간 연결됨").waitFor();
  await fetch(base + "/__mock/scenario", { method: "POST", body: JSON.stringify({ name: "risk_stop", streamErrorStatus: 503, streamErrorTimes: 3 }) });
  await fetch(base + "/__mock/drop-sse", { method: "POST" });
  await staff.page.getByText("연결 끊김").first().waitFor({ timeout: 5_000 });
  // 끊긴 동안 환자 쪽에서 위험 발화(가짜 입력)
  const post = (path: string, body: object) => fetch(base + "/v1" + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  await post("/sessions", { session_id: "gap-1", kind: "SESSION_START" });
  await post("/sessions/gap-1/turns", { session_id: "gap-1", kind: "UTTERANCE", utterance: "위험해요", turn_id: "gap-t1" });
  await staff.page.getByText("실시간 연결됨").waitFor({ timeout: 20_000 });
  await staff.page.locator("#open").getByText("gap-1").waitFor({ timeout: 10_000 });
  await staff.ctx.close();
});

test("직원 콘솔: 하트비트가 끊긴 채 조용히 죽은 스트림을 감지해 '연결 끊김'을 보이고, 하트비트가 돌아오면 복구된다", async () => {
  await scenario("risk_stop");
  const staff = await open("none"); await staff.page.goto(base + "/staff/");
  await staff.page.getByText("실시간 연결됨").waitFor();
  await new Promise((r) => setTimeout(r, 1500)); // 연결 직후 하트비트 도착
  await fetch(base + "/__mock/heartbeat", { method: "POST", body: JSON.stringify({ on: false }) }); // 연결은 열려 있고 하트비트만 멈춘다
  await staff.page.locator("#conn.bad").waitFor({ timeout: 50_000 }); // 하트비트 주기 15초의 2배 + 지터 5초 이내
  await staff.page.getByText("연결 끊김").first().waitFor();
  await fetch(base + "/__mock/heartbeat", { method: "POST", body: JSON.stringify({ on: true }) });
  await staff.page.getByText("실시간 연결됨").waitFor({ timeout: 20_000 }); // 새 연결 직후 하트비트 -> 감시 재개
  await staff.ctx.close();
});

test("직원 콘솔: resync 이벤트를 받으면 스트림으로 오지 않은 알림도 목록 재읽기로 나타난다", async () => {
  await scenario("risk_stop");
  const staff = await open("none"); await staff.page.goto(base + "/staff/");
  await staff.page.getByText("실시간 연결됨").waitFor();
  await fetch(base + "/__mock/stream", { method: "POST", body: JSON.stringify({ mute: true }) });
  const post = (path: string, body: object) => fetch(base + "/v1" + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  await post("/sessions", { session_id: "rs-1", kind: "SESSION_START" });
  await post("/sessions/rs-1/turns", { session_id: "rs-1", kind: "UTTERANCE", utterance: "위험해요", turn_id: "rs-t1" });
  await new Promise((r) => setTimeout(r, 1000));
  assert.equal(await staff.page.locator("#open").getByText("rs-1").count(), 0, "스트림으로는 오지 않았다");
  await fetch(base + "/__mock/stream", { method: "POST", body: JSON.stringify({ mute: false, resync: true }) });
  await staff.page.locator("#open").getByText("rs-1").waitFor({ timeout: 5_000 }); // 15초 주기보다 훨씬 빠르게
  await staff.ctx.close();
});

test("직원 콘솔: 목록 API가 실패하면 빈 목록이 아니라 '불러오지 못했습니다'를 보이고 복구되면 사라진다", async () => {
  await scenario("risk_stop", { errorStatus: 500, errorTimes: 1000 });
  const staff = await open("none"); await staff.page.goto(base + "/staff/");
  await staff.page.getByText("알림 목록을 불러오지 못했습니다").waitFor({ timeout: 10_000 });
  await scenario("risk_stop");
  await staff.page.locator("#list-status").waitFor({ state: "hidden", timeout: 30_000 }); // 15초 주기 재읽기
  await staff.ctx.close();
});

test("직원 콘솔: 위험 알림이 실시간으로 뜨고 '이어서 진행'으로 해결된다", async () => {
  await scenario("risk_stop");
  const staff = await open("none"); await staff.page.goto(base + "/staff/");
  await staff.page.getByText("실시간 연결됨").waitFor();
  const kiosk = await open("none"); await kiosk.page.goto(kioskUrl());
  await kiosk.page.getByRole("button", { name: "시작하기" }).click();
  await kiosk.page.getByText("어디가 불편하신가요?").waitFor();
  await kiosk.page.locator("#manual-input").fill("위험해요");
  await kiosk.page.getByRole("button", { name: "말하기" }).click();
  await staff.page.locator("#banner").getByText("새 알림").waitFor();
  await staff.page.screenshot({ path: `${SHOTS}/staff-1-alert.png` });
  await staff.page.locator("#open").getByRole("button", { name: "이어서 진행" }).click();
  await staff.page.locator("#confirm-yes").click();
  await staff.page.locator("#resolved li").waitFor();
  await staff.page.screenshot({ path: `${SHOTS}/staff-2-resolved.png` });
  // 키오스크는 폴링으로 위험 정지가 풀린 것을 알아채 다시 질문한다.
  await kiosk.page.getByText("다시 이어서 진행하겠습니다").waitFor({ timeout: 15_000 });
  await staff.ctx.close(); await kiosk.ctx.close();
});

test("직원 콘솔: 알림 → 기록 보기 → 재개 (읽기 전용 기록, 확인 단계 유지, Esc로 닫기)", async () => {
  await scenario("risk_stop");
  const staff = await open("none"); await staff.page.goto(base + "/staff/");
  await staff.page.getByText("실시간 연결됨").waitFor();
  const kiosk = await open("none"); await kiosk.page.goto(kioskUrl());
  await kiosk.page.getByRole("button", { name: "시작하기" }).click();
  await kiosk.page.getByText("어디가 불편하신가요?").waitFor();
  await kiosk.page.locator("#manual-input").fill("가짜 두통 문장");
  await kiosk.page.getByRole("button", { name: "말하기" }).click();
  await kiosk.page.getByText("언제부터 그러셨나요?").waitFor();
  await kiosk.page.locator("#manual-input").fill("위험해요");
  await kiosk.page.getByRole("button", { name: "말하기" }).click();
  await staff.page.locator("#banner").getByText("새 알림").waitFor();
  // 키보드로 열기
  const recBtn = staff.page.locator("#open").getByRole("button", { name: /기록 보기/ });
  await recBtn.focus(); await staff.page.keyboard.press("Enter");
  const dlg = staff.page.getByRole("dialog", { name: /세션 기록/ });
  await dlg.waitFor();
  await dlg.getByRole("list", { name: "대화 기록(시간순)" }).getByText("가짜 두통 문장").waitFor();
  assert.ok(await dlg.getByText("위험해요").count() >= 1);
  assert.equal(await dlg.getByRole("table", { name: "저장된 값" }).count(), 1);
  assert.equal(await dlg.getByRole("table", { name: "이 세션의 알림" }).getByText("mock-risk-keyword").count(), 1);
  await staff.page.screenshot({ path: `${SHOTS}/staff-4-record.png` });
  // 확인 단계: 취소하면 해결되지 않는다
  await dlg.getByRole("button", { name: "이어서 진행" }).click();
  await staff.page.locator("#confirm-no").click();
  assert.equal(await staff.page.locator("#resolved li").count(), 0);
  await dlg.getByRole("button", { name: "이어서 진행" }).click();
  await staff.page.locator("#confirm-yes").click();
  await dlg.getByText("STAFF_RESUME").waitFor(); // 기록이 다시 불러와져 직원 결정 턴이 보인다
  assert.equal(await dlg.getByRole("button", { name: "이어서 진행" }).count(), 0);
  await staff.page.screenshot({ path: `${SHOTS}/staff-5-record-resumed.png` });
  await dlg.getByRole("button", { name: "닫기" }).click();
  assert.equal(await staff.page.locator("#record").evaluate((d: HTMLDialogElement) => d.open || d.textContent !== ""), false);
  await staff.page.locator("#resolved li").waitFor();
  // Esc로도 닫힌다
  await staff.page.locator("#resolved").getByRole("button", { name: /기록 보기/ }).click();
  await dlg.waitFor();
  await staff.page.keyboard.press("Escape");
  await dlg.waitFor({ state: "hidden" });
  await kiosk.page.getByText("다시 이어서 진행하겠습니다").waitFor({ timeout: 15_000 });
  assert.deepEqual(staff.errors, []);
  await staff.ctx.close(); await kiosk.ctx.close();
});

test("웹 푸시(헤드리스 가능 범위): 서비스 워커 등록·활성화, 구독 요청, 푸시 수신→알림 표시", async () => {
  await scenario("normal", { vapidPublicKey: vapid });
  const { page, ctx } = await open("none", "", { permissions: ["notifications"] });
  await page.goto(base + "/staff/");
  await page.getByText("실시간 연결됨").waitFor();
  await page.getByRole("button", { name: "푸시 알림 켜기" }).click();
  // 구독 단계: 헤드리스 Chromium은 외부 푸시 서비스(FCM)에 닿지 못할 수 있다. 결과를 구분해 기록한다.
  for (let i = 0; i < 60 && !(await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration("/staff/"))?.active)); i++) await page.waitForTimeout(250);
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.getRegistration("/staff/"))!.scope);
  assert.equal(scope, base + "/staff/");
  await page.waitForTimeout(3000);
  const btn = (await page.locator("#push").textContent()) ?? "";
  const banner = (await page.locator("#push-status").textContent()) ?? ""; // 푸시 실패는 알림 배너와 분리된다
  assert.equal(await page.locator("#banner").isHidden(), true, "푸시 결과가 알림 배너에 섞이지 않는다");
  const subscribed = btn.includes("켜짐");
  console.log(`# 푸시 구독 결과: ${subscribed ? "구독 성공" : "구독 불가(" + banner.trim() + ")"}`);
  await page.screenshot({ path: `${SHOTS}/staff-3-push.png` });
  if (subscribed) { // 해지 UI: 끄면 서버 등록이 지워지고 버튼이 원래대로
    await page.getByRole("button", { name: "푸시 알림 끄기" }).click();
    await page.getByRole("button", { name: "푸시 알림 켜기" }).waitFor();
    assert.equal(mock.state.subs.size, 0);
  }
  // 서비스 워커의 push 핸들러: 합성 PushEvent를 워커 안에서 보내 알림이 만들어지는지 확인한다(외부 푸시 서비스 불필요).
  // 실제 푸시 서비스 → 브라우저 전달 경로는 확인하지 못한다(사람 확인 필요).
  const sw = ctx.serviceWorkers().find((w) => w.url().endsWith("/staff/sw.js")) ?? await ctx.waitForEvent("serviceworker");
  await sw.evaluate(() => { (self as any).dispatchEvent(new (self as any).PushEvent("push", { data: JSON.stringify({ alert_id: "a-x", session_id: "s-fake", kind: "RISK_STOP" }) })); });
  await page.waitForFunction(async () => (await (await navigator.serviceWorker.getRegistration("/staff/"))!.getNotifications()).length > 0, null, { timeout: 10_000 });
  const n = await page.evaluate(async () => (await (await navigator.serviceWorker.getRegistration("/staff/"))!.getNotifications()).map((x) => ({ t: x.title, b: x.body })));
  assert.deepEqual(n, [{ t: "직원 호출", b: "세션 s-fake (RISK_STOP)" }]);
  await ctx.close();
});

test("D85: subject_ref 전송 · 기기 토큰 헤더 · 주소창 조각 제거 · 저장소/콘솔에 없음 · 기록 화면 표시", async () => {
  const REF = "visit:2026/10#27=a+b";
  await scenario("risk_stop", { deviceToken: DEV });
  const staff = await open("none", "", { extraHTTPHeaders: { "x-openit-user": "staff-e2e" } }); // 게이트웨이가 붙이는 헤더 대역
  await staff.page.goto(base + "/staff/");
  await staff.page.getByText("실시간 연결됨").waitFor();
  const kiosk = await open("none");
  const logs: string[] = [];
  kiosk.page.on("console", (m) => logs.push(m.text()));
  const sessionReqs: { url: string; auth: string | undefined; body: any }[] = [];
  kiosk.page.on("request", (r) => { if (r.url().includes("/v1/sessions")) sessionReqs.push({ url: r.url(), auth: r.headers()["authorization"], body: r.postData() ? JSON.parse(r.postData()!) : undefined }); });
  await kiosk.page.goto(kioskUrl(`device=${DEV}&subject_ref=${encodeURIComponent(REF)}`));
  await kiosk.page.getByRole("button", { name: "시작하기" }).click();
  await kiosk.page.getByText("어디가 불편하신가요?").waitFor();
  await kiosk.page.locator("#manual-input").fill("가짜 두통 문장");
  await kiosk.page.getByRole("button", { name: "말하기" }).click();
  await kiosk.page.getByText("언제부터 그러셨나요?").waitFor();
  await kiosk.page.locator("#manual-input").fill("위험해요");
  await kiosk.page.getByRole("button", { name: "말하기" }).click();
  await kiosk.page.getByText("직원이 곧 도와드립니다").waitFor();
  // 요청: 시작 본문에 subject_ref, 모든 /v1/sessions* 에 Bearer
  const start = sessionReqs.find((r) => r.body?.kind === "SESSION_START")!;
  assert.equal(start.body.subject_ref, REF);
  assert.ok(sessionReqs.length >= 3 && sessionReqs.every((r) => r.auth === `Bearer ${DEV}`));
  assert.ok(sessionReqs.every((r) => !r.url.includes(DEV) && !r.url.includes("subject_ref")), "토큰·참조는 URL에 없다");
  // 주소창에서 조각이 지워졌고, 저장소·콘솔에 값이 없다
  assert.equal(await kiosk.page.evaluate(() => location.hash), "");
  const store = await kiosk.page.evaluate(() => JSON.stringify([{ ...localStorage }, { ...sessionStorage }, document.cookie]));
  assert.ok(!store.includes(DEV) && !store.includes("visit:"));
  assert.ok(!logs.join("\n").includes(DEV) && !logs.join("\n").includes("visit:"));
  // 직원 콘솔: 기록 보기에 환자 참조, 결정 뒤 해결한 직원
  await staff.page.locator("#banner").getByText("새 알림").waitFor();
  await staff.page.locator("#open").getByRole("button", { name: /기록 보기/ }).click();
  const dlg = staff.page.getByRole("dialog", { name: /세션 기록/ });
  await dlg.getByText(REF).waitFor();
  assert.equal(await dlg.getByRole("table", { name: "이 세션의 알림" }).getByText("(없음)").count(), 1); // 아직 해결 전
  await dlg.getByRole("button", { name: "이어서 진행" }).click();
  await staff.page.locator("#confirm-yes").click();
  await dlg.getByRole("table", { name: "이 세션의 알림" }).getByText("staff-e2e").waitFor();
  await staff.page.screenshot({ path: `${SHOTS}/staff-6-record-subject-ref.png` });
  assert.deepEqual(staff.errors, []);
  await staff.ctx.close(); await kiosk.ctx.close();
});

test("D85: 기기 토큰이 없으면 설정 필요 화면(요청 없음), 틀리면 인증 거부 화면, subject_ref 형식 오류면 직원 호출", async () => {
  await scenario("normal", { deviceToken: DEV });
  const seen: string[] = [];
  const run = async (frag: string) => {
    const k = await open("none");
    k.page.on("request", (r) => { if (r.url().includes("/v1/sessions")) seen.push(r.url()); });
    await k.page.goto(kioskUrl(frag));
    await k.page.getByRole("button", { name: "시작하기" }).click();
    await k.page.getByText("직원을 불러 주세요").waitFor();
    const t = (await k.page.locator("#text").textContent()) ?? "";
    await k.ctx.close();
    return t;
  };
  assert.match(await run("x=1"), /설정이 필요합니다/);
  assert.equal(seen.length, 0, "토큰이 없으면 서버로 보내지 않는다");
  assert.match(await run("device=wrong-token"), /인증이 거부/);
  assert.equal(seen.length, 1);
  assert.match(await run(`device=${DEV}&subject_ref=${encodeURIComponent("공백 있음")}`), /접수 정보/);
  assert.equal(seen.length, 1, "형식 오류면 보내지 않는다");
});

// 마지막 시험(앞선 시험들이 만든 요청을 모아 확인한다): 브라우저의 모든 상태 변경 요청이 fetch 기본 모드(cors)로 나가
// Origin이 요청 출처와 같고(Origin: null 아님) Sec-Fetch-Site가 same-origin이다. 그래야 게이트웨이 CSRF 방어가 403을 내지 않는다.
test("CSRF 방어 호환: 브라우저의 모든 POST/DELETE가 Origin=요청 출처, Sec-Fetch-Site=same-origin (Referrer-Policy: no-referrer 아래)", () => {
  assert.ok(mutations.some((m) => m.method === "POST" && m.path.startsWith("/v1/sessions")), "문진 POST가 기록되어야 한다");
  for (const m of mutations) {
    assert.equal(m.origin, base, `${m.method} ${m.path}: Origin=${m.origin}`);
    assert.equal(m.site, "same-origin", `${m.method} ${m.path}: Sec-Fetch-Site=${m.site}`);
  }
});
