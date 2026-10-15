# CR-002 (대상: 헤드) 공개 API 계약의 부족한 점

> 갱신: 헤드가 D66 회신으로 이 요청(CR-002, CR-003)에 답했고 kiosk-frontend가 반영했다. 이 파일은 기록으로 남긴다.

작성: kiosk-frontend. 읽은 것: `PUBLIC_API.md`, `CONVENTIONS.md`, `survey-service/schema/schemas`의 `FrontendInput`, `FrontendMessage`, `InterventionDecision`, `BoundaryError.schema.json`. 아래는 읽고 **확인한** 불일치와, 그에 대한 **제안**이다.

1. **`turn_id`가 스키마에 없다.** `PUBLIC_API.md`는 발화와 개입 본문에 `turn_id`를 넣는다. 그러나 `FrontendMessage`(UTTERANCE)와 `InterventionDecision`은 `additionalProperties: false`이고 `turn_id`가 없다. 스키마대로 검증하면 `turn_id`가 붙은 본문이 거부된다(`test/mock.test.ts`에서 확인). 제안: 두 스키마에 선택이 아닌 필수 `turn_id`(UTTERANCE, 개입)를 추가하거나, 공개 API용 요청 스키마를 따로 정의한다. MAJOR인지 MINOR인지는 헤드 판단.
2. **`StaffAlert`와 알림 목록 응답의 스키마가 없다.** 이 영역은 `PUBLIC_API.md`의 서술대로 손으로 타입을 썼다. `kind`와 `status`의 열거값(RISK_STOP 외), `next_cursor` 형식, `limit` 상한, 정렬이 서술뿐이다. 제안: `StaffAlert`, `AlertPage` 스키마를 추가.
3. **오류 코드 표가 어긋난다.** `PUBLIC_API.md`는 401, 429를 말하지만 `BoundaryError.code`에는 이에 대응하는 값이 없다. `HTTP.md`/`CONVENTIONS.md` 9절은 FAILED_PRECONDITION을 412, CONFLICT를 409로 정한 반면, 공개 API는 "멈추지 않은 세션의 개입"과 "순서 어긋남"에 409를 쓴다. 이 영역은 상태 코드로만 분기한다(재시도: 429·503/네트워크/무응답, 비재시도: 그 밖). 제안: 공개 API의 상태 코드 표를 확정하고 `BoundaryError.code`와 매핑해 적는다.
4. **재시도 가능 여부의 기준.** 이 영역은 429를 재시도한다. 429에 `Retry-After`를 줄지 미정이어서 고정 대기(0.5초)를 쓴다. 제안: `Retry-After` 규칙을 적을 것.
5. **SSE 이벤트 형식이 서술뿐이다.** 이벤트 이름(`event:`), `id:` 규칙, 하트비트(`: ping` 간격)가 없다. 이 영역은 이름 없는 `message`와 `alert`, `resolved` 이름을 모두 받는다. 제안: 이름을 정하고(예: 이름 없음, 본문은 `StaffAlert`) 하트비트 간격을 적을 것.
6. **세션 유휴 만료(제안 5분)와 키오스크.** 만료된 세션에 발화하면 404로 가정하고 처음 화면으로 돌아간다. 위험 정지 중에도 유휴 만료가 적용되는지 정해야 한다(직원이 5분 안에 못 오면 환자가 세션을 잃는다).
7. **푸시 구독의 VAPID 공개키를 어디서 받는지 계약에 없다.** CR-001은 `/config.json`을 제안한다. 서버가 `GET /v1/staff/push-config`로 줄 수도 있다. 헤드가 하나를 정할 것.
8. **직원 콘솔 `RESUME` 응답의 안내 문장은 직원 화면에만 간다.** 아래 CR-003 참조.
