/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: boundary-contracts PushConfig (패키지 버전 4.0.2) */


/**
 * 웹 푸시 구독에 필요한 서버 공개키(직원 콘솔). 비밀 키는 담지 않는다.
 */
export interface PushConfig {
/**
 * 웹 푸시 applicationServerKey: VAPID 공개키(P-256 비압축 점 65바이트)를 패딩 없는 base64url 로(87자, RFC 8292 3.2). null 이면 푸시가 꺼져 있고 SSE 만 동작한다
 */
vapid_public_key: (string | null)
}
