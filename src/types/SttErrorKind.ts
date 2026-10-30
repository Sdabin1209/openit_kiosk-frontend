/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/SttErrorKind.json */


/**
 * 음성 인식 실패의 종류(상태 기계는 이 열거만 본다). BLOCKED = 마이크 권한·장치 문제이거나 이 기기에서 음성 입력 불가.
 */
export type SttErrorKind = ("BLOCKED" | "NO_SPEECH" | "OTHER")
