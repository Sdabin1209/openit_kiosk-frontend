// 턴(또는 개입 결정)마다 고유한 ID를 발급한다. 컴포넌트는 이 함수를 주입받는다(난수라는 바깥 자원).
function randomHex(bytes: number): string {
  const a = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}
/** "t-" + 24자리 16진수(26자). 계약 turn_id는 1~64자(StaffCallReport.turn_id)이고 같은 세션 안에서 고유하면 된다. 난수 12바이트 = 96비트라 겹칠 확률은 무시할 수 있다(측정이 아니라 계산). */
export function newTurnId(): string {
  return "t-" + randomHex(12);
}
