// 하위 프로세스에 넘기는 최소 환경 한 곳(RUNTIME R9.1: 시험·잡은 상속받은 환경 변수를 통째로 쓰거나 넘기지 않는다).
// 왜 허용 목록: 상속 환경을 통째로 넘기면 호출자 PC 의 비밀·설정이 시험 결과에 섞이고 같은 입력이 다른 출력을 낸다. 이름으로 고른 것만 넘긴다.
// 기본 이름은 head check-container-inputs 와 같은 최소 집합이다. 그 호출이 실제로 필요한 이름은 호출하는 쪽이 extra 에 이름으로 더한다.
export const ALLOWED = ["PATH", "HOME", "LANG", "TMPDIR", "DOCKER_CONFIG", "DOCKER_HOST"];
/** 계약·문진 스키마 위치를 찾는 스크립트(scripts/contract-source.mjs)가 읽는 이름(위치 재정의, 원격 태그 받기용 ssh). */
/** docker 엔진 연결을 고르는 이름(docker CLI 표준 변수: 컨텍스트·원격 TLS·ssh 엔진). 전체 환경을 넘기지 않고 이 이름만 잇는다(codex C2 K2). */
export const DOCKER_CONNECTION_NAMES = ["DOCKER_CONTEXT", "DOCKER_TLS_VERIFY", "DOCKER_CERT_PATH", "SSH_AUTH_SOCK", "DOCKER"];
export const CONTRACT_SOURCE_NAMES = ["OPENIT_BOUNDARY_CONTRACTS_REPO", "OPENIT_SURVEY_SERVICE_REPO", "SSH_AUTH_SOCK"];
/** 허용 목록(+extraNames) 중 현재 있는 것만 고른 새 객체. overrides 는 그대로 더한다. */
export function minEnv(overrides = {}, extraNames = [], base = process.env) {
  const out = {};
  for (const k of [...ALLOWED, ...extraNames]) if (base[k] !== undefined) out[k] = base[k];
  return { ...out, ...overrides };
}
