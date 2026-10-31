/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: boundary-contracts PushConfig (패키지 버전 3.1.2) */


/**
 * 웹 푸시 구독에 필요한 서버 공개키(직원 콘솔). 비밀 키는 담지 않는다.
 */
export interface PushConfig {
/**
 * null이면 푸시가 꺼져 있고 SSE만 동작한다
 */
vapid_public_key: (string | null)
}
