# CR-005 (대상: 헤드) 영역 경계를 넘는데 계약에 형식이 없는 것들의 스키마 초안

작성: kiosk-frontend, 2026-10-28 (지시서 1·2 B). 근거: `docs/audit/structure-rules-2026-10-28.md` E절의 KF-01, KF-02, KF-03, KF-04, KF-18. **코드는 바꾸지 않았다.** 헤드가 아래 스키마를 계약(`boundary-contracts`)에 올린 뒤에 이 영역이 `loadKioskStart` 등을 그 스키마로 검증하도록 바꾼다(다음 단계). 초안 파일은 처음 `docs/change-requests/schemas/`에 있었고 지금은 지웠다(아래 정리 표). 스키마의 `$id`는 자리 표시용이며 헤드가 정한다.

읽는 쪽 코드의 현재 동작과 스키마의 "모르는 키" 정책이 다르다는 점을 일부러 둔다: 읽는 쪽 코드는 **모르는 키를 무시**한다(앞으로 키가 늘어도 옛 화면이 죽지 않게). 스키마는 쓰는 쪽을 검증하는 용도이므로 **모르는 키를 거부**한다(오타·개인정보 혼입을 쓰는 쪽에서 잡는다). 읽는 쪽이 그 스키마로 바뀔 때의 정책은 헤드가 정한다.

## 1. DeviceConfig (KF-01) - 계약 `DeviceConfig`(boundary-contracts 스키마)
- 누가 만들고 누가 읽나: deploy가 운영이 마운트한 파일(`CONFIG_FILE`)로 만들고, 정적 서버가 `/config.json`으로 내며, 키오스크 앱(`api/device.ts`)이 읽는다.
- 실제 예시(`test/static.test.ts`, `docs/runbook.md` 64행): `{"device_token": "tok-FAKE", "allow_remote_stt": false}` (`schemas/examples/DeviceConfig.valid.json`).
- 키: `device_token`(비밀, 헤더에 들어갈 보이는 ASCII 1~512자), `subject_ref`(PUBLIC_API.md 추가 인터페이스 A의 형식), `allow_remote_stt`(불리언).
- 모르는 키: 스키마는 거부, 현재 코드는 무시. 이유는 위. 키가 틀린 값(예: `"allow_remote_stt": "true"`)은 현재 코드가 **꺼짐**으로 해석한다(안전한 쪽). 스키마는 이를 거부해 쓰는 쪽이 알게 한다.
- 이 영역이 지키는 불변식: 값(특히 `device_token`)은 메모리에만 두고 로그·콘솔·저장소·오류 응답에 쓰지 않는다(`test/static.test.ts`가 소스에서 저장소·콘솔 사용을 검사). `allow_remote_stt`는 JSON `true`일 때만 켠다(기본 꺼짐, D88 U3). `device_token`이 없으면 서버로 세션 요청을 보내지 않는다. 파일이 없거나 JSON이 아니면 없는 설정으로 본다.

## 2. KioskStartFragment (KF-01) - 계약 `KioskStartFragment`(boundary-contracts 스키마)
- 누가 만들고 누가 읽나: 병원 접수(또는 시연 스크립트)가 시작 URL을 만들고, 키오스크 앱(`parseFragment`)이 읽는다.
- 실제 예시(`docs/runbook.md` 62행의 URL 형식, `test/staffview.test.ts`의 참조 값): `https://<호스트>/#device=tok-FAKE&subject_ref=pt:abc/1` -> 풀면 `{"device": "tok-FAKE", "subject_ref": "pt:abc/1"}`. 쿼리 문자열은 쓰지 않는다(서버 로그에 남는다).
- 모르는 키: 스키마는 거부(접수가 환자 이름 같은 값을 조각에 실수로 넣는 것을 막는다), 현재 코드는 읽고 버린다.
- 불변식: 읽는 즉시 `history.replaceState`로 주소창에서 지운다. 조각이 `DeviceConfig`보다 먼저다. `subject_ref`는 한 번 쓰면 비운다(다음 환자에게 재사용하지 않음, `createStartHolder`). 형식이 틀린 `subject_ref`는 세션을 시작하지 않고 직원 호출 화면(BAD_SUBJECT_REF).
- 미정(사용자 확인 대기): 접수가 기기당 고정 참조를 쓰는지 환자마다 새 URL을 여는지.

## 3. StaticImageInterface (KF-02) - 계약 `StaticImageInterface`(boundary-contracts 스키마)
- 누가 만들고 누가 읽나: kiosk-frontend 이미지가 선언하고 deploy(게이트웨이)가 읽는다. 지금은 `CR-001`과 `Dockerfile`·`server/static.mjs`에만 있다.
- 실제 예시(Dockerfile: `PORT=8080 STATIC_DIR=/app/dist`, `USER node`, CR-001 3·7항): `schemas/examples/StaticImageInterface.valid.json`.
- 모르는 키: 거부(선언서는 deploy와 약속한 목록이라 임의 키가 없어야 한다). `env`의 키는 `PORT`, `STATIC_DIR`, `CONFIG_FILE`만.
- 불변식: `/v1/`은 이 이미지가 처리하지 않는다. `/healthz`, `/readyz`가 있다. `PORT`가 정수가 아니면 시작을 거부(종료 코드 2). 비밀은 환경 변수로 받지 않는다. 로그는 표준 출력. `/config.json`은 `CONFIG_FILE`이 있을 때만 내고 없으면 404. 이 선언서를 이미지에 실을지(파일로 내보낼지)는 정하지 않았다: 스키마만 올리고 형식은 문서 검증용으로 쓸 수도 있다.
- 이미지 라벨 키(`io.openit.*`)는 워크스페이스 규칙 D50에 이미 있어 여기 넣지 않았다.

## 4. StaffPushPayload (KF-03) - 계약 `StaffPushPayload`(boundary-contracts 스키마)
- 누가 만들고 누가 읽나: 문진 서버가 웹 푸시 본문으로 보내고, 직원 콘솔 서비스 워커(`apps/staff/sw.ts`)가 읽는다. 서버 구현은 읽지 못했다(이웃 리포 읽기 금지).
- 실제 예시(`sw.ts`가 읽는 키): `{"session_id": "s-1", "kind": "RISK_STOP", "alert_id": "a1"}`. `kind` 값은 `StaffAlert.kind`(RISK_STOP, CALL_STAFF, USER_CALLED_STAFF)와 같은 이름이다.
- 모르는 키: 스키마는 거부. PUBLIC_API.md 52행이 "푸시 본문에는 세션 ID와 종류만 넣는다"고 정했으므로 발화·값이 실리면 위반이다. 서비스 워커는 모르는 키를 읽지 않는다.
- 불변식: `session_id`가 없거나 본문이 JSON이 아니면 일반 문구('새 알림이 있습니다')를 보인다. `alert_id`가 있으면 알림 tag로 쓰고 `renotify: true`로 재알림에도 소리·진동을 다시 낸다(ADR 0014). `alert_id`를 서버가 실제로 싣는지는 확인하지 못했다(없으면 tag는 고정값이라 알림이 서로 교체된다).

## 5. turn_failure_signal 의미 (KF-04, KF-18) - 계약에 올리지 않음(초안 `TurnOutcome`은 지웠다, 아래 정리 표)
- 이것은 새 형식이 아니라 기존 `FrontendInput.turn_failure_signal`(survey-service 스키마, 이 영역이 고치지 않는다)의 **의미**를 정해 달라는 요청이다.
- 사실(확인): PUBLIC_API.md 34행은 "null이 아니면 이번 턴 처리에 문제가 있었다"만 말하고, 위험 정지가 성공한 턴의 신호 값은 정하지 않았다. 키오스크는 신호가 DELIVERED/DELIVERY_FAILED/NOT_COMMITTED가 아니면(신호 null 포함) 정지일 수 있다고 보고 **매 응답 뒤 `GET /state`를 한 번 더 부른다**(`flow.ts` `needsStateCheck`, 요청 수 2배). 근거는 `test/audit.test.ts` H-2 시험 주석의 "위험 정지 성공 때 survey는 turn_failure_signal=null"뿐이며 실서버에서 확인하지 못했다.
- 제안(미정, 헤드 결정 필요): 정지된 턴은 신호를 `staff_alert` = DELIVERED 또는 DELIVERY_FAILED로 항상 싣는다. 그러면 키오스크는 추가 `/state` 호출을 없앨 수 있다. 반대로 서버가 null을 유지하기로 하면 계약에 "정지 턴의 신호는 null일 수 있다"를 적어 주길 요청한다.
- 제안(의미): 신호가 있으면 `write_committed` = NOT_COMMITTED이거나 `staff_alert` != NONE이다(COMMITTED + NONE인 신호는 "문제 있음"과 모순이라 금지, 예시 `TurnOutcome.invalid.json`).
- KF-18: `pause_reason`(RISK|REASK_LIMIT|OTHER)은 PUBLIC_API.md H절이 `TurnFailureSignal`에도 붙는다고 했으나 이 영역의 타입은 아직 모른다. 서버 스키마에는 있다(확인). 신호에 실리면 키오스크는 첫 폴링(2초)을 기다리지 않고 정지 사유를 바로 쓸 수 있다. 코드 변경은 이 CR이 받아들여진 뒤.
- 이 영역이 지키는 불변식: 응답 문장(`response_text`)과 신호만으로 화면을 정한다. `DELIVERY_FAILED`이면 직원을 직접 부르는 화면(PUBLIC_API.md 35행). 모르는 `staff_alert`/`pause_reason` 값은 `OTHER`/미상으로 본다.

## 정리: 승격된 스키마 사본 삭제 (2026-10-30, U49, 브랜치 wo-49)
D107에서 계약(boundary-contracts)에 올라간 스키마의 사본은 정본이 둘이 되고 계약이 바뀌면 어긋나므로 지웠다. 내용은 git 기록(`docs/change-requests/schemas/`, `docs/change-requests/contract-ready/`)에 남아 있다. 이 영역은 계약의 같은 스키마를 고정 태그에서 읽어 검증기로 쓴다(ADR 0021, 0027). 위 "검증" 명령과 출력(초안 폴더의 `check_examples.py`)은 그 폴더와 함께 없어졌다.

| 파일(옛 위치) | 분류 | 처리 | 근거 |
|---|---|---|---|
| `schemas/DeviceConfig.schema.json`, `contract-ready/schemas/DeviceConfig.schema.json` | (가) 계약에 같은 이름 | 삭제 | 계약 `DeviceConfig`가 정본 |
| `schemas/KioskStartFragment.schema.json`, `contract-ready/schemas/KioskStartFragment.schema.json` | (가) | 삭제 | 계약 `KioskStartFragment` |
| `schemas/StaffPushPayload.schema.json`, `contract-ready/schemas/StaffPushPayload.schema.json` | (가) | 삭제 | 계약 `StaffPushPayload` |
| `schemas/StaticImageInterface.schema.json`, `contract-ready/schemas/StaticImageInterface.schema.json` | (가) | 삭제 | 계약 `StaticImageInterface` |
| `schemas/examples/*`, `contract-ready/examples/valid·invalid/*`(위 4개의 예시) | (가) | 삭제 | 계약 `examples/`, `conformance/examples_invalid/`에 같은 예시가 있다 |
| `schemas/check_examples.py`, `contract-ready/check_contract_ready.py`, `contract-ready/MANIFEST.json` | (가) 사본을 검사하는 스크립트·승격 목록 | 삭제 | 검사 대상 사본이 없어졌다. 승격 목록은 계약의 `conformance/promoted/kiosk-frontend.MANIFEST.json`이 정본 |
| `schemas/TurnOutcome.schema.json`과 예시 3개 | (나) 계약에 없음 | 삭제 | 계약 MANIFEST가 "FrontendInput과 겹치는 읽는 쪽 부분집합"이라 올리지 않았고, 이 영역의 코드·시험·문서 어디서도 쓰지 않는다(grep으로 확인). 의미 제약 제안(5절)은 이 문서에 글로 남아 있다(헤드 결정 대기) |

삭제한 파일은 모두 45개다: 스키마 파일 9개(서로 다른 스키마 5개, 사본 포함), 예시 33개, 검사 스크립트 2개, MANIFEST 1개. 남긴 스키마 파일은 없다(이 영역이 소유하는 형식은 계약에 모두 올라갔다).
