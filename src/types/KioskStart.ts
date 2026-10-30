/* 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/KioskStart.json */


/**
 * 키오스크 시작 값(메모리 전용). 형식은 계약 DeviceConfig·KioskStartFragment가 정한다.
 */
export interface KioskStart {
deviceToken: (string | null)
subjectRef: (string | null)
/**
 * 값이 있었지만 형식이 틀렸다. 세션을 시작하지 않고 직원을 부른다
 */
subjectInvalid: boolean
/**
 * 기기 설정이 켠 때만 있다(기본 꺼짐, D88 U3)
 */
allowRemoteStt?: true
}
