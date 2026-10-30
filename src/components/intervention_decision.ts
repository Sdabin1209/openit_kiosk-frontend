// 개입 결정 컴포넌트. 입력 DecisionRequest(schemas/DecisionRequest.json) -> 출력 서버 응답(FrontendInput) 또는 null(확인에서 취소).
// 보내기(link_public_api_send.intervene)와 확인 창, 턴 ID 발급은 wiring이 주입한다.
import { DecisionRequest as vDecision } from "../types/validators.gen.cjs";
import type { DecisionRequest } from "../types/DecisionRequest.ts";
import type { FrontendInput } from "../types/FrontendInput.ts";

type Decision = DecisionRequest["decision"];

/**
 * 개입 결정. 같은 알림·같은 결정은 같은 turn_id로 가므로 중복 클릭이 한 번만 처리된다.
 * 진행 중이면 같은 약속(Promise)을 돌려준다. 성공하면 기록을 지우고, 실패하면 남겨 같은 turn_id로 다시 보낼 수 있다.
 */
export class InterventionDeciding {
  private turnIds = new Map<string, string>();
  private inflight = new Map<string, Promise<FrontendInput>>();
  private send: (sessionId: string, d: Decision, turnId: string) => Promise<FrontendInput>;
  private confirm: (message: string) => Promise<boolean>;
  private newTurnId: () => string;
  constructor(
    send: (sessionId: string, d: Decision, turnId: string) => Promise<FrontendInput>,
    confirm: (message: string) => Promise<boolean>,
    newTurnId: () => string,
  ) { this.send = send; this.confirm = confirm; this.newTurnId = newTurnId; }

  async decide(alertId: string, sessionId: string, d: Decision): Promise<FrontendInput | null> {
    const req: DecisionRequest = { alert_id: alertId, session_id: sessionId, decision: d };
    if (!vDecision(req)) throw new Error(`DecisionRequest 스키마 위반: ${JSON.stringify(vDecision.errors)}`);
    const key = `${alertId}:${d}`;
    const running = this.inflight.get(key);
    if (running) return running;
    const label = d === "RESUME" ? "문진을 이어서 진행" : "세션을 종료";
    if (!(await this.confirm(`세션 ${sessionId}: ${label}할까요?`))) return null;
    const again = this.inflight.get(key); // 확인 대기 중 다른 클릭이 먼저 보냈을 수 있다
    if (again) return again;
    let turnId = this.turnIds.get(key);
    if (!turnId) { turnId = this.newTurnId(); this.turnIds.set(key, turnId); }
    const p = this.send(sessionId, d, turnId).then(
      (r) => { this.turnIds.delete(key); return r; },
      (e) => { throw e; },
    ).finally(() => this.inflight.delete(key));
    this.inflight.set(key, p);
    return p;
  }
}
