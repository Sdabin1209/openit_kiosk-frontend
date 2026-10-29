// Dockerfile의 ARG APP_VERSION 기본값을 읽는다. 이미지 라벨 io.openit.app-version의 값이다(CR-D29, ADR 0025).
export function dockerfileAppVersion(text) {
  return text.match(/^ARG APP_VERSION=(\S+)/m)?.[1] ?? null;
}
