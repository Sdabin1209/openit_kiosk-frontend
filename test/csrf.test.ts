// 게이트웨이 CSRF 방어(Sec-Fetch-Site same-origin|none, Origin == 요청 출처)와 Referrer-Policy: no-referrer 아래에서
// 모든 상태 변경 요청이 fetch 기본 모드(cors)로 나가 Origin이 출처 값(null 아님)이 되게 하는 규칙을 고정한다.
// 브라우저에서의 실제 헤더는 test-e2e/browser.e2e.test.ts 마지막 시험이 확인한다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PublicApiClient } from "../api/client.ts";

const files = ["api", "apps/kiosk", "apps/staff"].flatMap((d) => readdirSync(new URL(`../${d}/`, import.meta.url)).filter((f) => /\.(ts|html)$/.test(f)).map((f) => `${d}/${f}`));

test("Origin: null이 될 수 있는 전송 방식(form POST·sendBeacon·no-cors·XHR)을 쓰지 않고, 서비스 워커는 요청을 보내지 않는다", () => {
  for (const f of files) {
    const t = readFileSync(new URL(`../${f}`, import.meta.url), "utf8").replace(/\/\/.*$/gm, "");
    assert.ok(!/sendBeacon|no-cors|XMLHttpRequest|<form|keepalive/.test(t), `${f}: CSRF 호환을 깨는 전송 방식`);
  }
  const sw = readFileSync(new URL("../apps/staff/sw.ts", import.meta.url), "utf8");
  assert.ok(!/fetch\(|sync|Request\(/.test(sw.replace(/\/\/.*$/gm, "")), "sw.ts는 push·notificationclick만 처리한다(네트워크 요청 없음)");
});

test("PublicApiClient 상태 변경 요청은 mode·referrer 옵션 없이 same-origin 자격으로 나간다(기본 mode=cors → Origin: https://호스트)", async () => {
  const seen: RequestInit[] = [];
  const c = new PublicApiClient({ fetch: (async (_u: string, init: RequestInit) => { seen.push(init); return new Response("{}", { status: 200 }); }) as any });
  await c.request("POST", "/staff/push-subscriptions", {}).catch(() => {});
  await c.request("DELETE", "/staff/push-subscriptions?endpoint=x").catch(() => {});
  assert.deepEqual(seen.map((s) => s.method), ["POST", "DELETE"]);
  for (const s of seen) {
    assert.equal(s.credentials, "same-origin");
    for (const k of ["mode", "referrer", "referrerPolicy", "keepalive"]) assert.equal((s as any)[k], undefined, k);
  }
});
