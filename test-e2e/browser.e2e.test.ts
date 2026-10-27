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
const web: Server = createServer((req, res) => {
  const p = req.url ?? "";
  if (p.startsWith("/v1/") || p.startsWith("/__mock/")) api(req, res); else void st(req, res);
});
let base = "", browser: Browser;
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
async function open(stt: "fake" | "none", fakeText = "가짜 증상 문장입니다", ctxOpts: object = {}): Promise<{ page: Page; ctx: BrowserContext; errors: string[] }> {
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, ...ctxOpts });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.addInitScript(({ stt, fakeText }) => {
    const w = window as any;
    delete w.SpeechRecognition; delete w.webkitSpeechRecognition;
    if (stt === "fake") {
      w.SpeechRecognition = class {
        lang = ""; interimResults = false; maxAlternatives = 1;
        onresult: any; onend: any; onerror: any;
        start() { setTimeout(() => { this.onresult?.({ results: [[{ transcript: fakeText, confidence: 0.9 }]] }); this.onend?.(); }, 10); }
        abort() {}
      };
    }
  }, { stt, fakeText });
  return { page, ctx, errors };
}
const title = (p: Page) => p.locator("#title");

test("키오스크: 시작 → 질문 → 텍스트 제출 → 다음 응답 → 종료 (STT 없음, 입력 경계)", async () => {
  await scenario("normal");
  const { page, ctx, errors } = await open("none");
  await page.goto(base + "/");
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
  await page.goto(base + "/");
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByText("어디가 불편하신가요?").waitFor();
  assert.equal(await page.locator("#manual").isHidden(), true, "STT가 있으면 텍스트 입력은 숨는다");
  await page.getByRole("button", { name: "말하기" }).click();
  await page.getByText("언제부터 그러셨나요?").waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("키오스크: 위험 발화 → 직원 대기 화면 (스크린샷)", async () => {
  await scenario("risk_stop");
  const { page, ctx } = await open("none");
  await page.goto(base + "/");
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
  await page.goto(base + "/");
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByText("어디가 불편하신가요?").waitFor();
  await page.locator("#manual-input").fill("위험해요");
  await page.getByRole("button", { name: "말하기" }).click();
  await page.getByText("직원을 불러 주세요").waitFor();
  assert.equal(await page.evaluate(() => document.body.classList.contains("warn")), true);
  await page.screenshot({ path: `${SHOTS}/kiosk-6-call-staff.png` });
  await page.getByRole("button", { name: "처음으로" }).click();
  await page.getByRole("button", { name: "시작하기" }).waitFor();
  await ctx.close();
});

test("키오스크: 서버 오류가 계속되면 직원 호출 화면 (503)", async () => {
  await scenario("error", { errorTimes: 100 });
  const { page, ctx } = await open("none");
  await page.goto(base + "/");
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByText("직원을 불러 주세요").waitFor({ timeout: 30_000 });
  await page.screenshot({ path: `${SHOTS}/kiosk-7-error-call-staff.png` });
  await ctx.close();
});

test("키오스크: 저장 실패(NOT_COMMITTED)는 다시 말하기 화면", async () => {
  await scenario("not_committed");
  const { page, ctx } = await open("none");
  await page.goto(base + "/");
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
  await page.goto(base + "/");
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByText("잠시만 기다려 주세요").waitFor();
  await page.screenshot({ path: `${SHOTS}/kiosk-9-starting.png` });
  await page.getByText("어디가 불편하신가요?").waitFor({ timeout: 10_000 });
  await ctx.close();
});

test("직원 콘솔: 위험 알림이 실시간으로 뜨고 '이어서 진행'으로 해결된다", async () => {
  await scenario("risk_stop");
  const staff = await open("none"); await staff.page.goto(base + "/staff/");
  await staff.page.getByText("실시간 연결됨").waitFor();
  const kiosk = await open("none"); await kiosk.page.goto(base + "/");
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
  const banner = (await page.locator("#banner").textContent()) ?? "";
  const subscribed = btn.includes("켜짐");
  console.log(`# 푸시 구독 결과: ${subscribed ? "구독 성공" : "구독 불가(" + banner.trim() + ")"}`);
  await page.screenshot({ path: `${SHOTS}/staff-3-push.png` });
  // 서비스 워커의 push 핸들러: 합성 PushEvent를 워커 안에서 보내 알림이 만들어지는지 확인한다(외부 푸시 서비스 불필요).
  // 실제 푸시 서비스 → 브라우저 전달 경로는 확인하지 못한다(사람 확인 필요).
  const sw = ctx.serviceWorkers().find((w) => w.url().endsWith("/staff/sw.js")) ?? await ctx.waitForEvent("serviceworker");
  await sw.evaluate(() => { (self as any).dispatchEvent(new (self as any).PushEvent("push", { data: JSON.stringify({ alert_id: "a-x", session_id: "s-fake", kind: "RISK_STOP" }) })); });
  await page.waitForFunction(async () => (await (await navigator.serviceWorker.getRegistration("/staff/"))!.getNotifications()).length > 0, null, { timeout: 10_000 });
  const n = await page.evaluate(async () => (await (await navigator.serviceWorker.getRegistration("/staff/"))!.getNotifications()).map((x) => ({ t: x.title, b: x.body })));
  assert.deepEqual(n, [{ t: "직원 호출", b: "세션 s-fake (RISK_STOP)" }]);
  await ctx.close();
});
