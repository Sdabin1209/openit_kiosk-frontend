/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/PauseLabel.json */


/**
 * 정지 사유 표시. 글자 접두를 항상 같이 쓴다(색에만 기대지 않는다).
 */
export interface PauseLabel {
reason: ("RISK" | "REASK_LIMIT" | "OTHER")
text: string
}
