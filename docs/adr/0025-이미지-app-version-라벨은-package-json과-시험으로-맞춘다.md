# ADR 0025: 이미지 app-version 라벨은 Dockerfile 기본값이고 package.json과 같음을 시험으로 강제한다

## 상태
채택됨 (2026-10-29, deploy 변경 요청 CR-D29).

## 맥락
deploy의 이미지 빌드가 이 리포의 `package.json`을 읽지 않고 `APP_VERSION` 빌드 인자도 넘기지 않는다(구조 규칙: 영역 사이에 서로의 내부를 읽지 않는다). 그래서 라벨 `io.openit.app-version`은 `Dockerfile`의 `ARG APP_VERSION` 기본값이 된다. `package.json` version을 올리고 기본값을 잊으면 틀린 라벨이 나간다. Docker `LABEL`은 빌드 인자·환경 값으로만 값을 받고 파일 내용으로 동적으로 정할 수 없다.

## 결정
- `Dockerfile`의 `ARG APP_VERSION` 기본값이 라벨의 값이다(전과 같음).
- 두 값이 같음을 두 곳에서 강제한다.
  1. `npm test`: `test/image-contract.test.ts`가 `scripts/app-version.mjs`(Dockerfile 기본값 읽기)와 `package.json`을 대조한다. 어긋나면 실패한다(검사기 자체는 일부러 어긋난 입력으로도 시험한다).
  2. `npm run smoke`: 빌드한 이미지의 실제 라벨을 `docker inspect`로 읽어 `package.json` version과 대조한다(Docker가 필요한 최종 확인).

## 왜
- 라벨을 파일에서 정하려면 빌드 전에 인자를 만들어 넘겨야 하는데, 그건 빌드 호출자(deploy)의 몫이고 deploy는 넘기지 않기로 했다. 그러면 이 리포 안에서 가능한 것은 어긋남을 못 나가게 막는 것이다.
- 시험(1)은 Docker 없이 매 변경마다 돌고, smoke(2)는 이미지에 실제로 박힌 라벨을 본다. 둘이 서로 다른 실패를 잡는다(기본값 오타와 라벨 치환 오류).

## 검토한 대안과 버리는 이유
- Dockerfile에서 `COPY package.json` 후 `RUN`으로 라벨을 만들기: `LABEL`은 `RUN` 결과를 받을 수 없다. 빌드 후 `docker commit`으로 라벨을 붙이는 것은 빌드 재현성을 해친다.
- 버전을 Dockerfile 한 곳에만 두고 `package.json`을 없애기: npm이 `package.json` version을 요구하고 도구들이 읽는다.
- `package.json` version을 빌드 때 `sed`로 Dockerfile에 써넣는 스크립트: 편집된 작업 트리가 커밋과 달라진다. 점검만 하는 편이 단순하다.
- deploy가 인자를 넘기게 하기: deploy가 구조 규칙으로 거부했다(CR-D29).

## 결과
- 얻는 것: 버전을 올리며 기본값을 잊으면 `npm test`가 바로 실패한다. 틀린 라벨의 이미지가 나가지 않는다.
- 감수하는 것: 버전 올릴 때 두 곳(`package.json`, `Dockerfile`)을 함께 고쳐야 한다(안 고치면 시험이 알려 준다). deploy가 나중에 `APP_VERSION`을 넘기면 이 점검은 기본값만 본다.

## 되돌리는 조건
deploy가 `package.json`을 읽어 `APP_VERSION`을 넘기게 되면 기본값 대조는 필요 없다.
