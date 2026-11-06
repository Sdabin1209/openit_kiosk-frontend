/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: boundary-contracts PushSubscriptionRequest (패키지 버전 3.4.21) */


/**
 * 3.4.4(검토 B-28-5·B-24): POST /v1/staff/push-subscriptions 본문. 브라우저 PushSubscription.toJSON() 의 endpoint·keys 와 선택 topics. endpoint 는 https 이고 포트가 없거나 443 이며 호스트가 공인 주소로 해석될 때만 받는다(loopback·사설·링크로컬·특수 주소는 400 INVALID_RECORD — SSRF 방지, OWASP A10:2021). 호스트는 점이 있는 이름이어야 하고 IP 리터럴·localhost 는 스키마에서 거부한다(검토 P6-R6-15). 이름이 RFC 6890 특수 목적 주소로 해석되는지는 스키마로 못 쓰므로 서버가 등록 때와 발송 때 한다(RUNTIME R3.18).
 */
export interface PushSubscriptionRequest {
endpoint: string
keys: {
p256dh: string
auth: string
}
/**
 * @minItems 1
 */
topics?: [("alerts" | "results"), ...(("alerts" | "results"))[]]
}
