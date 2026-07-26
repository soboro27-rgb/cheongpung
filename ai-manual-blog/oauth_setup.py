"""
네이버 로그인 OAuth 최초 인증 — 딱 한 번만 실행하면 됩니다.

브라우저를 열어 네이버 로그인/동의를 받고, 발급된 access_token/refresh_token을
tokens.json에 저장합니다. 이후 generate_and_post.py는 이 파일을 읽어서
필요할 때 자동으로 토큰을 갱신합니다.
"""

import json
import os
import secrets
import sys
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import requests

CLIENT_ID = os.environ.get("NAVER_CLIENT_ID")
CLIENT_SECRET = os.environ.get("NAVER_CLIENT_SECRET")
REDIRECT_URI = "http://127.0.0.1:8080/callback"
TOKENS_PATH = Path(__file__).parent / "tokens.json"

_received = {}


class CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path != "/callback":
            self.send_response(404)
            self.end_headers()
            return

        params = parse_qs(parsed.query)
        _received["code"] = params.get("code", [None])[0]
        _received["state"] = params.get("state", [None])[0]

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write("<html><body>인증 완료. 이 창은 닫아도 됩니다.</body></html>".encode("utf-8"))

    def log_message(self, format, *args):
        pass


def main() -> None:
    if not CLIENT_ID or not CLIENT_SECRET:
        print("NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수가 설정되어 있지 않습니다.")
        print("README.md의 '사전 준비' 단계를 먼저 진행해주세요.")
        sys.exit(1)

    state = secrets.token_hex(8)
    auth_url = (
        "https://nid.naver.com/oauth2.0/authorize"
        f"?response_type=code&client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}&state={state}"
    )

    print("브라우저에서 네이버 로그인 창을 엽니다...")
    webbrowser.open(auth_url)

    server = HTTPServer(("127.0.0.1", 8080), CallbackHandler)
    print("인증 완료를 기다리는 중 (브라우저에서 로그인·동의를 진행해주세요)...")
    while "code" not in _received:
        server.handle_request()

    if _received.get("state") != state:
        print("state 값이 일치하지 않습니다. 보안상 인증을 중단합니다.")
        sys.exit(1)

    code = _received["code"]
    if not code:
        print("인증 코드가 발급되지 않았습니다. 다시 시도해주세요.")
        sys.exit(1)

    token_res = requests.get(
        "https://nid.naver.com/oauth2.0/token",
        params={
            "grant_type": "authorization_code",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "code": code,
            "state": state,
        },
        timeout=10,
    )
    token_data = token_res.json()

    if "access_token" not in token_data:
        print("토큰 발급 실패:", token_data)
        sys.exit(1)

    TOKENS_PATH.write_text(json.dumps(token_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"토큰 저장 완료: {TOKENS_PATH}")
    print("이제 generate_and_post.py를 실행하면 됩니다.")


if __name__ == "__main__":
    main()
