/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/StartRequest.json */


/**
 * 세션 시작 요청 입력. subject_ref는 병원 접수 환자 참조(계약 DeviceConfig의 형식), 없으면 생략 또는 null.
 */
export interface StartRequest {
subject_ref?: (string | null)
}
