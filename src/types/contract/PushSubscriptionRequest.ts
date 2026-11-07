/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: boundary-contracts PushSubscriptionRequest (패키지 버전 4.0.5) */


/**
 * 3.4.4(검토 B-28-5·B-24): POST /v1/staff/push-subscriptions 본문. 브라우저 PushSubscription.toJSON() 의 endpoint·keys 와 선택 topics. endpoint 는 https 이고 포트가 없거나 443 이며 호스트가 공인 주소로 해석될 때만 받는다(loopback·사설·링크로컬·특수 주소는 400 INVALID_RECORD — SSRF 방지, OWASP A10:2021). 호스트는 점이 있는 이름이어야 하고 IP 리터럴·localhost 는 스키마에서 거부한다(검토 P6-R6-15). 이름이 RFC 6890 특수 목적 주소로 해석되는지는 스키마로 못 쓰므로 서버가 등록 때와 발송 때 한다(RUNTIME R3.18). 3.7.0: 같은 본문을 서버(openapi: PublicApiRequests.PushSubscribeBody)와 생산자(kiosk-frontend·admin-console)가 서로 다른 스키마로 검증하던 것을 이 스키마 하나로 합쳤다(PushSubscribeBody 는 이것을 참조한다). PushSubscription.toJSON() 의 expirationTime 등 그 밖의 키는 생산자가 빼고 보낸다(닫힌 본문).
 */
export interface PushSubscriptionRequest {
/**
 * 웹 푸시 endpoint(PushSubscription.endpoint). https, 포트 없음 또는 443, 점이 있는 이름 호스트(IP 리터럴·localhost·.local/.localdomain/.internal/.lan/.home/.corp/.intranet 거부), 경로가 있고 공백이 없다. 3.7.0: PublicApiRequests.PushSubscribeBody 와 둘로 갈라져 있던 제약을 여기 하나로 합쳤다 근거: 상한 2048 은 브라우저·프록시가 넘기는 URL 길이의 관례적 하한(측정 안 함)
 */
endpoint: string
/**
 * W3C Push API PushSubscriptionKeys 의 p256dh(P-256 공개키, base64url)·auth(인증 비밀, base64url). 이 둘만 보낸다
 */
keys: {
/**
 * 근거: RFC 8291: P-256 공개키 65바이트 = base64url 87자. 상한 200 은 여유를 둔 설계값
 */
p256dh: string
/**
 * 근거: RFC 8291: 인증 비밀 16바이트 = base64url 22자. 상한 64 는 여유를 둔 설계값
 */
auth: string
}
/**
 * 구독 주제(계약 3.4.0). alerts=직원 알림(staff 역할), results=결과 도착(clinician 역할=result-reader 토큰). 없으면 ["alerts"]. 역할 확인은 서비스가 한다.
 *
 * @minItems 1
 */
topics?: [("alerts" | "results"), ...(("alerts" | "results"))[]]
}
