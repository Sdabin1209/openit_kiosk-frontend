import { newTurnId } from "../../api/ids.ts";
import type { Decision, FrontendInput } from "../../api/types.ts";

/**
 * 개입 결정. 같은 알림·같은 결정은 같은 turn_id로 가므로 중복 클릭이 한 번만 처리된다.
 * 진행 중이면 같은 약속(Promise)을 돌려준다. 성공하면 기록을 지우고, 실패하면 남겨 같은 turn_id로 다시 보낼 수 있다.
 */
export class InterventionDeciding {
  private turnIds = new Map<string, string>();
  private inflight = new Map<string, Promise<FrontendInput>>();
  private send: (sessionId: string, d: Decision, turnId: string) => Promise<FrontendInput>;
  private confirm: (message: string) => Promise<boolean>;
  constructor(
    send: (sessionId: string, d: Decision, turnId: string) => Promise<FrontendInput>,
    confirm: (message: string) => Promise<boolean>,
  ) { this.send = send; this.confirm = confirm; }

  async decide(alertId: string, sessionId: string, d: Decision): Promise<FrontendInput | null> {
    const key = `${alertId}:${d}`;
    const running = this.inflight.get(key);
    if (running) return running;
    const label = d === "RESUME" ? "문진을 이어서 진행" : "세션을 종료";
    if (!(await this.confirm(`세션 ${sessionId}: ${label}할까요?`))) return null;
    const again = this.inflight.get(key); // 확인 대기 중 다른 클릭이 먼저 보냈을 수 있다
    if (again) return again;
    let turnId = this.turnIds.get(key);
    if (!turnId) { turnId = newTurnId(); this.turnIds.set(key, turnId); }
    const p = this.send(sessionId, d, turnId).then(
      (r) => { this.turnIds.delete(key); return r; },
      (e) => { throw e; },
    ).finally(() => this.inflight.delete(key));
    this.inflight.set(key, p);
    return p;
  }
}
