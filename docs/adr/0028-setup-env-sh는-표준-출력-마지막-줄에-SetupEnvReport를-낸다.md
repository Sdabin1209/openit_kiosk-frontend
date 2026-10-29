# ADR 0028: `scripts/setup-env.sh`는 표준 출력 마지막 줄에 SetupEnvReport를 낸다

## 상태
채택됨 (2026-10-30, OPEN_GAPS U43, 계약 v2.6.0 SetupEnvReport).

## 맥락
deploy의 `doctor.sh`·`check_all.py`가 이웃 영역의 `node_modules` 경로와 시험 도구(`npm`)를 짐작했다(구조 규칙 1 위반). 계약 2.6.0이 영역 쪽 선언을 정했다: `setup-env.sh`가 표준 출력 마지막 줄에 `{area, status, exit_code, seconds, environment{kind, path, test_command}}`를 낸다.

## 결정
- `scripts/setup-env.sh`가 보고 JSON 한 줄을 표준 출력 마지막 줄에 낸다: `area=kiosk-frontend`, `environment={kind: node-modules, path: node_modules, test_command: ["npm","test"]}`. 성공은 `status ok`, 실패는 `status fail`과 스크립트 종료 코드와 같은 `exit_code`다(EXIT 트랩이라 어디서 끝나도 마지막 줄이 보고다).
- 진행 기록은 `exec 3>&1 1>&2`로 모두 표준 오류로 보낸다. npm ci가 표준 출력으로 내는 진행 줄이 보고 앞에 섞이지 않는다.
- 멱등: `node_modules/.package-lock.json`이 `package-lock.json`보다 새것이면 설치를 건너뛴다. 잠금 파일이 바뀌면 다시 설치한다. 이전에는 매번 `npm ci`로 폴더를 지우고 다시 깔았다.
- `test_command`는 `["npm","test"]`다: 이 영역 시험 전체의 정본이고 `pretest`가 먼저 빌드한다(ADR 0013).
- 시험(`test/setup-env.test.ts`)은 가짜 npm(PATH)으로 스크립트를 돌려 마지막 줄이 계약 검증기(SetupEnvReport, 생성물)를 통과하는지, 소음이 섞여도 마지막 줄이 보고인지, 실패 보고, 멱등을 확인한다.

## 왜
- 계약 2.6.0. deploy가 영역의 환경 경로와 시험 도구를 짐작하지 않게 하는 것이 목적이다.
- 시험에서 실제 `npm ci`를 부르지 않는 이유: node_modules를 지우고 다시 깔아 같은 시험 실행을 흔든다. `test_command`를 시험 안에서 부르지 않는 이유: 영역 전체 시험을 부르면 자기 자신을 부르는 재귀다. 대신 실제 환경에서 한 번 돌려 확인했다(보고에 실제 출력).
- 건너뛰기 기준(`-nt`)은 단순한 휴리스틱이다. node_modules를 수동으로 일부 지운 경우는 못 잡는다(측정·검증하지 않았다).

## 검토한 대안과 버리는 이유
- 매번 `npm ci`: 계약이 요구한 멱등(이미 준비돼 있으면 바꾸지 않는다)에 어긋난다.
- `npm ls`로 정합 검사 후 건너뛰기: 느리고 네트워크 상태에 따라 달라질 수 있다.
- 보고를 별도 도구로 만들기: 계약이 `setup-env.sh`의 표준 출력 마지막 줄로 정했다.

## 결과
- 얻는 것: deploy가 이 영역의 환경과 시험 명령을 이 한 줄에서 읽는다.
- 감수하는 것: 위 휴리스틱의 한계. `seconds`는 정수 초라 0일 수 있다.

## 되돌리는 조건
계약이 보고 형식을 바꾸면 따른다.
