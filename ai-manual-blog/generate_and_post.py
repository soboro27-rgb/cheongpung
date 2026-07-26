"""
매일 실행 — Claude로 "AI 사용 설명서" 블로그 글을 생성하고 네이버 블로그에 자동 발행합니다.

흐름: state.json(지금까지 쓴 글 목록) 로드 -> Claude에 이어서 쓸 글 요청
-> 네이버 access_token 갱신 -> blog/writePost.json 호출 -> state.json/백업 갱신
"""

import json
import os
import sys
import time
from pathlib import Path

import anthropic
import requests

BASE_DIR = Path(__file__).parent
TOKENS_PATH = BASE_DIR / "tokens.json"
STATE_PATH = BASE_DIR / "state.json"
POSTED_LOG_DIR = BASE_DIR / "posted_log"

CLIENT_ID = os.environ.get("NAVER_CLIENT_ID")
CLIENT_SECRET = os.environ.get("NAVER_CLIENT_SECRET")
BLOG_ID = os.environ.get("NAVER_BLOG_ID", "soboro27")
MODEL = "claude-opus-4-8"

SYSTEM_PROMPT = """당신은 네이버 블로그 "AI 사용 설명서"의 필자입니다.

컨셉: 이 블로그는 AI(주로 생성형 AI, LLM, Claude 등)를 실생활·업무에 활용하는
경험을 담습니다. 처음엔 막연하고 시행착오 많은 개인적인 톤으로 시작해서,
글이 쌓일수록 점점 더 구체적이고 실전적인 가이드 톤으로 서서히 진화합니다.
이 진화는 갑자기 일어나지 않고, 매 글마다 아주 조금씩만 더 뚜렷해집니다.

원칙:
- 지금까지 쓴 글과 주제/사례가 겹치지 않게 하십시오.
- 매번 하나의 좁은 주제(질문 하나, 시도 하나, 깨달음 하나)에 집중하십시오.
- 과장된 홍보 문구, 클릭베이트성 제목을 피하십시오.
- 실제 사용해본 사람의 목소리로 쓰되, 특정 실존 인물의 이름·소속·거래처명은
  넣지 마십시오.
- 분량은 800~1300자 내외의 한국어 블로그 글.

출력 형식 (반드시 이 형식 그대로):
TITLE: <글 제목>
BODY:
<본문. 네이버 블로그에 그대로 등록될 HTML입니다. <p>, <b>, <br> 정도의
기본 태그만 사용하고, 마크다운 문법은 쓰지 마십시오.>
"""


def load_json(path: Path, default):
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return default


def save_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def refresh_access_token() -> str:
    tokens = load_json(TOKENS_PATH, None)
    if tokens is None:
        print("tokens.json이 없습니다. 먼저 oauth_setup.py를 실행해주세요.")
        sys.exit(1)

    res = requests.get(
        "https://nid.naver.com/oauth2.0/token",
        params={
            "grant_type": "refresh_token",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "refresh_token": tokens["refresh_token"],
        },
        timeout=10,
    )
    data = res.json()
    if "access_token" not in data:
        print("토큰 갱신 실패:", data)
        sys.exit(1)

    tokens.update(data)
    save_json(TOKENS_PATH, tokens)
    return tokens["access_token"]


def generate_post(state: dict) -> tuple[str, str]:
    past_posts = state.get("posts", [])
    if past_posts:
        history = "\n".join(f"- {p['date']}: {p['title']} — {p['summary']}" for p in past_posts)
    else:
        history = "(아직 첫 글입니다. 가장 막연하고 시행착오 많은 톤으로 시작하십시오.)"

    client = anthropic.Anthropic()
    response = client.messages.create(
        model=MODEL,
        max_tokens=2000,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"[지금까지 올라간 글 목록 (총 {len(past_posts)}개)]\n{history}\n\n오늘 올릴 글을 하나 써주세요.",
            }
        ],
    )
    text = "".join(b.text for b in response.content if b.type == "text").strip()

    title = ""
    body_lines: list[str] = []
    in_body = False
    for line in text.splitlines():
        if line.strip().startswith("TITLE:"):
            title = line.split(":", 1)[1].strip()
        elif line.strip().startswith("BODY:"):
            in_body = True
        elif in_body:
            body_lines.append(line)

    body = "\n".join(body_lines).strip()
    if not title or not body:
        print("Claude 응답 파싱 실패. 원문:\n", text)
        sys.exit(1)

    return title, body


def post_to_naver(access_token: str, title: str, body: str) -> requests.Response:
    return requests.post(
        "https://openapi.naver.com/blog/writePost.json",
        headers={"Authorization": f"Bearer {access_token}"},
        data={
            "title": title,
            "contents": body,
            "blogId": BLOG_ID,
            "openyn": "Y",
        },
        timeout=15,
    )


def summarize_for_history(title: str, body: str) -> str:
    plain = body.replace("<p>", "").replace("</p>", " ").replace("<br>", " ")
    return plain[:60].strip() + ("..." if len(plain) > 60 else "")


def main() -> None:
    if not CLIENT_ID or not CLIENT_SECRET:
        print("NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수가 설정되어 있지 않습니다.")
        sys.exit(1)
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ANTHROPIC_API_KEY 환경변수가 설정되어 있지 않습니다.")
        sys.exit(1)

    state = load_json(STATE_PATH, {"posts": []})

    print("Claude로 오늘의 글 생성 중...")
    title, body = generate_post(state)
    print(f"[생성된 제목] {title}")

    print("네이버 access_token 갱신 중...")
    access_token = refresh_access_token()

    print("네이버 블로그에 발행 중...")
    res = post_to_naver(access_token, title, body)
    print(f"[네이버 응답 status={res.status_code}] {res.text}")

    if res.status_code != 200:
        print("발행 실패 — 위 응답 내용을 확인해주세요.")
        sys.exit(1)

    today = time.strftime("%Y-%m-%d")
    state.setdefault("posts", []).append(
        {"date": today, "title": title, "summary": summarize_for_history(title, body)}
    )
    save_json(STATE_PATH, state)

    POSTED_LOG_DIR.mkdir(exist_ok=True)
    (POSTED_LOG_DIR / f"{today}.md").write_text(f"# {title}\n\n{body}\n", encoding="utf-8")

    print("state.json / posted_log 갱신 완료.")


if __name__ == "__main__":
    main()
