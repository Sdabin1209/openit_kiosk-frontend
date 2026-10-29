# ADR 0026: 영역 빌드 진입점은 `scripts/build-image.sh`이고 deploy는 이 영역의 빌드 내부를 모른다

## 상태
**일부 대체됨: ADR 0030(U50: 라벨은 요청 값이 아니라 고정 버전에서 찍는다, turn_engine 키는 3.0.0에서 없어짐).** 채택됨 (2026-10-30, OPEN_GAPS U42, 계약 v2.5.0 BuildImageRequest/BuildImageResult).

## 맥락
deploy의 `build-images.sh`가 이 영역의 Dockerfile 인자 이름(`REVISION`, `BOUNDARY_CONTRACT`, `SURVEY_SCHEMA`)을 직접 알고 있었다(구조 규칙 1 위반, U23 감사). 계약 2.5.0이 영역 빌드 진입점을 정했다: `bash scripts/build-image.sh <요청 JSON 파일>`, 결과는 표준 출력 마지막 줄의 JSON 한 줄이다.

## 결정
- `scripts/build-image.sh`(얇은 래퍼)가 `scripts/build-image.mjs`를 부른다. 본체는 요청을 계약 검증기로 검증하고, `source_dir`만 빌드 컨텍스트로 `docker build`(출력은 표준 오류)를 하고, `docker inspect`로 실제 라벨과 image_id를 읽어 BuildImageResult 한 줄을 낸다.
- 검증기(BuildImageRequest, BuildImageResult)는 계약 스키마에서 생성해 `scripts/build-validators.gen.cjs`에 커밋한다(`scripts/gen-validators.mjs`, `--check` 시험). 진입점은 npm 설치 없이 돈다(생성 코드가 ajv 런타임을 require하지 않도록 `unicode:false`로 만들었다).
- 이 영역이 쓰는 versions 키는 `boundary`(스키마 필수)와 `survey_schema`(라벨은 주 버전: `v1.2.0`의 `1`)다. `survey_schema`가 없으면 기본값 없이 실패한다. `model_runtime`, 폐기 `turn_engine`, `dependency_sources`는 받아도 쓰지 않는다(이 영역은 이웃 소스를 빌드에 쓰지 않는다). `variant`는 이미지가 하나라 있으면 실패한다.
- 요청 값이 실제 이미지 라벨에 그대로 박혔는지 비교하고 다르면 실패한다(Dockerfile 인자 이름이 어긋나 조용히 틀린 라벨이 나가는 것을 막는다). 라벨 `io.openit.app-version`은 Dockerfile 기본값이다(ADR 0025). 결과 labels는 계약 ImageLabels를 통과해야 한다.
- 빌드 인자 이름과 Dockerfile은 이 영역의 내부 사실이고 deploy는 모른다. 이전 deploy가 부르던 빌드와 같은 인자를 같은 값으로 넘긴다(`REVISION`=revision, `BOUNDARY_CONTRACT`=versions.boundary, `SURVEY_SCHEMA`=주 버전).

## 왜
- 구조 규칙 1(영역은 서로의 구조를 모른다)과 계약 2.5.0. 입력 검증은 영역 경계 입력이라 계약 검증기로 한다(R7은 이웃 컴포넌트가 이미 보증한 값을 다시 검사하지 않는 규칙이고, 이 요청은 영역 경계를 처음 넘어오는 값이라 검사한다).
- 본체를 Node로 쓴 이유: 계약 검증기가 Node용 생성물이고(ADR 0021) 이 영역의 도구가 Node다. bash로 JSON 검증과 라벨 비교를 직접 쓰면 손 검증이 된다.
- 생성 검증기를 커밋한 이유: deploy는 영역 소스 트리(git archive 사본)에서 호출하며 `node_modules`나 이웃 폴더가 없을 수 있다.

## 검토한 대안과 버리는 이유
- 래퍼 없이 Node 스크립트만 두기: 계약이 `bash scripts/build-image.sh`로 호출 형태를 정했다.
- 라벨 비교 없이 결과만 내기: 인자 이름이 틀려도 기본값 라벨이 박힌 채 성공으로 보인다.
- 빌드 중 이웃 폴더·네트워크 사용: 계약이 금지한다(`dependency_sources`만).

## 결과
- 얻는 것: deploy가 이 영역의 Dockerfile 인자 이름을 알 필요가 없다. 라벨이 실제 이미지에서 읽은 값이다.
- 감수하는 것: 호스트에 `node`(>=24)가 있어야 진입점이 돈다(이 영역의 기존 빌드 전제와 같다). 같은 요청의 `image_id`는 빌드마다 다르다: docker가 빌드 시각을 이미지에 넣는다. 이 영역은 바이트 동일 재현 빌드를 하지 않는다(측정·시도하지 않았다). 같은 요청은 같은 이름과 같은 라벨의 이미지를 낸다.
- `unicode:false` 생성 옵션은 ajv에서 deprecated 경고를 낸다(동작은 한다). 경로·태그가 ASCII라 길이 계산 차이는 없다.

## 되돌리는 조건
계약이 진입점 형태를 바꾸면(3.0.0 등) 따른다. `variant`나 이웃 소스가 필요해지면 그때 요청 키를 쓴다.
