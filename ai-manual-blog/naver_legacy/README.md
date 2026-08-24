# AI 사용 설명서 — 자동 블로그

soboro27@naver.com 네이버 블로그에 매일 자동으로 글을 올리는 파이프라인.
컨셉: "막연했지만 서서히 뚜렷해지는 AI 사용 설명서" — 초반엔 막연한 질문/시행착오
톤으로 시작해서, 글이 쌓일수록 점점 구체적이고 실전적인 가이드 톤으로 진화.

## 구조

| 파일 | 역할 |
|---|---|
| `oauth_setup.py` | 최초 1회만 실행 — 네이버 로그인 인증 후 access/refresh 토큰 발급·저장 |
| `generate_and_post.py` | 매일 실행 — Claude로 글 생성 → 네이버 블로그에 자동 발행 → 진행 상태 갱신 |
| `state.json` | 지금까지 올라간 글 목록·요약 (다음 글이 겹치지 않고 이어지도록 하는 기억장치) |
| `tokens.json` | 네이버 access/refresh 토큰 저장 (민감정보 — git에 올리지 않음) |
| `posted_log/` | 실제 발행된 글 원문을 날짜별로 백업 (네이버에 문제 생겨도 원문 보존) |

## 사전 준비 (팔렌시아님이 직접 해야 하는 부분)

### 1. 네이버 개발자센터 애플리케이션 등록

1. https://developers.naver.com 접속 → 로그인(soboro27@naver.com) → Application → 애플리케이션 등록
2. 애플리케이션 이름: 아무거나 (예: "AI사용설명서 자동포스팅")
3. 사용 API: **네이버 로그인** 추가
4. 제공 정보 선택 항목 중 **블로그** 체크 (블로그 글쓰기 권한에 필요)
5. 로그인 오픈 API 서비스 환경: **PC 웹**
6. 서비스 URL: `http://127.0.0.1:8080`
7. Callback URL: `http://127.0.0.1:8080/callback`
8. 등록 완료 후 [내 애플리케이션]에서 **Client ID / Client Secret** 확인

### 2. 환경변수 설정

```
setx NAVER_CLIENT_ID "발급받은_클라이언트_ID"
setx NAVER_CLIENT_SECRET "발급받은_클라이언트_시크릿"
setx NAVER_BLOG_ID "soboro27"
```

(`ANTHROPIC_API_KEY`는 catfisheffect 파일럿에서 이미 설정했다면 그대로 재사용됩니다.
설정 후 터미널을 새로 열어야 반영됩니다.)

### 3. 패키지 설치

```
pip install -r requirements.txt
```

### 4. 최초 1회 인증 (토큰 발급)

```
python oauth_setup.py
```

브라우저가 자동으로 열리고 네이버 로그인 → 동의 화면이 뜹니다. 동의하면
`tokens.json`에 토큰이 저장되고 이후로는 이 스크립트를 다시 실행할 필요가
없습니다 (refresh_token으로 자동 갱신).

### 5. 수동 테스트

```
python generate_and_post.py
```

한 번 실행해서 실제로 블로그에 글이 잘 올라가는지 확인한 뒤, 문제없으면
매일 자동 실행되도록 Windows 작업 스케줄러에 등록합니다 (등록 명령은
팔렌시아님 확인 후 별도로 안내).

## 참고

- 네이버 블로그 글쓰기 공식 API(`openapi.naver.com/blog/writePost.json`)를 사용합니다.
  Selenium 등으로 로그인을 흉내 내는 방식이 아니라 네이버가 공식 제공하는
  인증된 방식이라 계정 정지 위험이 없습니다.
- 이 API의 정확한 파라미터/제약사항은 최초 실행 시 반드시 실제 응답으로
  검증이 필요합니다 — 첫 실행에서 에러가 나면 오류 메시지를 보고 같이
  디버깅합니다.
