const SESSION_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export function isValidSessionId(s: string): boolean {
  return SESSION_ID_RE.test(s);
}

function randomHex(bytes: number): string {
  const a = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** 턴(또는 개입 결정)마다 고유한 ID. */
export function newTurnId(): string {
  return "t-" + randomHex(12);
}
