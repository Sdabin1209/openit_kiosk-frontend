/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/SyncStatus.json */


/**
 * 직원 콘솔 알림 동기화 상태. 연결·목록 상태를 항상 밖으로 알린다(조용히 비어 있는 화면 금지).
 */
export interface SyncStatus {
conn: ("CONNECTING" | "CONNECTED" | "DISCONNECTED")
nextRetryMs: (number | null)
listStale: boolean
listLoaded: boolean
}
