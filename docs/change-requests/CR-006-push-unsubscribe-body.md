# CR-006 (대상: 헤드) 푸시 구독 해지가 엔드포인트를 쿼리 문자열로 받는다

작성: kiosk-frontend, 2026-10-29. **상태: 계약 반영됨(2026-10-29, 계약 2.2.0 `PUBLIC_API.md`: `POST /v1/staff/push-subscriptions/unsubscribe`, 본문 `{"endpoint"}`, 204. 옛 `DELETE ?endpoint=`는 2.x에서만 허용하는 폐기 예정, 3.0.0 제거). 이 영역은 새 경로로 바꿨다(`api/staff.ts` `unregisterPush`, 모의 서버, `test/push-unsub.test.ts`).** 아래는 요청 당시의 글이다. 표준성 점검 #42, 결정표 2절 "푸시 해지가 엔드포인트 URL을 쿼리 문자열로 보냄 -> 요청 본문으로 보낸다"에서 나왔다.

## 왜 이 영역에서 고치지 않았나
현재 계약은 `DELETE /v1/staff/push-subscriptions?endpoint=`로 해지한다(`../boundary-contracts/PUBLIC_API.md` 푸시 구독 행). 이 영역이 본문으로 바꿔 보내면 서버(survey-service)가 `endpoint`를 쿼리에서만 읽는 한 해지가 조용히 실패한다(서버 등록이 남은 채 브라우저 구독만 사라지거나 그 반대). 이 영역이 계약이나 이웃 서버를 바꿀 수 없으므로 코드는 건드리지 않았다. 모의 서버도 쿼리를 읽는다(`mock-server/app.ts`, 계약에 맞춤).

## 문제
푸시 엔드포인트 URL은 푸시 서비스가 발급한 URL이며(RFC 8030의 push resource, 기억) 비밀에 가깝게 다뤄야 한다. 쿼리 문자열은 게이트웨이·서버 접근 로그에 남는다. 이 영역은 같은 이유로 기기 토큰을 쿼리에 두지 않는다(ADR 0006).

## 제안(헤드가 정한다)
`DELETE`의 본문은 RFC 9110 §9.3.5에서 정해진 의미가 없다(기억). 그래서 DELETE 본문 대신 추가형 경로를 제안한다.
- `POST /v1/staff/push-subscriptions/unsubscribe`, 본문 `{"endpoint": "..."}`, 응답 204. 기존 `DELETE ?endpoint=`는 하위 호환으로 유지하고 폐기 예고만 한다(계약 2.x 추가형).
- 이 영역의 변경(계약이 나온 뒤): `api/staff.ts`의 `unregisterPush`가 새 경로를 쓴다. 서버가 404/405면 구 경로로 되돌아가지 않는다(되돌아가면 URL 노출이 되살아난다). 대신 해지 실패를 화면에 보인다.
- 시험: 해지 요청의 URL에 `endpoint`가 없고 본문에 있다는 시험을 먼저 쓴다. 모의 서버에도 새 경로를 추가한다.

## 영향
survey-service(서버 경로 추가), boundary-contracts(PUBLIC_API.md, 적합성 시험), kiosk-frontend(직원 콘솔 클라이언트, 모의 서버). 이 영역 쪽 변경은 작다.
