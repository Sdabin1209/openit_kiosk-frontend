# 포함 글꼴

- 글꼴: Noto Sans KR (가변 글꼴, wght 100~900), 한글·라틴 조각(unicode-range) 124개 woff2.
- 출처: npm 패키지 `@fontsource-variable/noto-sans-kr` 5.3.1(2026-10-29에 `npm pack`으로 받음). `files/`와 `fonts.css`는 패키지의 `files/`와 `index.css`를 고치지 않고 그대로 복사했다.
- 라이선스: SIL Open Font License 1.1(`OFL.txt`는 패키지의 `LICENSE`를 그대로 복사, 패키지 `package.json`의 license도 OFL-1.1). OFL은 글꼴을 재배포할 때 라이선스 전문과 저작권 고지를 함께 두는 것을 요구하므로 이 폴더와 `dist/fonts/`에 같이 들어간다. 글꼴 자체를 단독으로 팔지 않는다.
- 확인하지 못한 것: 글꼴 파일 내부 name 테이블의 저작권 문구를 열어 보지 않았다(패키지가 준 LICENSE 머리말은 "Google Inc."). 패키지가 원본 Noto Sans KR 릴리스를 그대로 담았는지 원본과 대조하지 않았다.
- 왜 이 글꼴인가: ADR 0018.
- 갱신: 새 버전이 필요하면 같은 패키지를 `npm pack`으로 받아 `files/`, `fonts.css`, `OFL.txt`를 통째로 교체하고 이 문서의 버전을 고친다.
