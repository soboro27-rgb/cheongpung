"""카카오 알림톡 발송 (솔라피 API).

요청 처리 중에는 enqueue()로 쌓기만 하고, 백그라운드 루프가 process_queue()로 보낸다.
알림톡은 카카오가 심사·승인한 템플릿 문구와 글자 하나까지 같아야 나가므로
TEMPLATES 문구를 바꾸면 솔라피 콘솔의 템플릿도 같이 바꿔 재심사 받아야 한다.
키·발신프로필·템플릿ID가 비어 있으면 실제 발송 없이 'not_configured'로 남긴다.
"""
import hashlib
import hmac
import json
import secrets
import urllib.error
import urllib.request
from datetime import datetime, timezone

from sqlalchemy.orm import Session

import models
from config import alimtalk_config

# 카카오 비즈센터(솔라피)에 등록할 템플릿 문구 — 알림톡_템플릿.md 와 동일하게 유지
TEMPLATES = {
    "signup_approved": (
        "[서버파츠비더] #{이름}님, 가입이 승인되었습니다.\n"
        "관심품목을 등록하시면 입고·비딩 소식을 알림톡으로 보내드립니다.\n\n"
        "바로가기: #{링크}"
    ),
    "invite": (
        "[서버파츠비더] #{이름}님, 월드메모리 서버부품 거래 사이트에 초대합니다.\n"
        "아이디: #{아이디}\n"
        "임시 비밀번호: #{비밀번호}\n"
        "로그인 후 비밀번호를 바꿔 주세요.\n\n"
        "바로가기: #{링크}"
    ),
    "new_stock": (
        "[서버파츠비더] #{이름}님 관심품목이 입고되었습니다.\n"
        "품목: #{품목}\n"
        "수량: #{수량}개\n"
        "가격: #{가격}\n\n"
        "바로가기: #{링크}"
    ),
    "bid_open": (
        "[서버파츠비더] #{이름}님, 관심품목 비딩이 열렸습니다.\n"
        "품목: #{품목}\n"
        "수량: #{수량}개\n"
        "마감: #{마감}\n\n"
        "바로가기: #{링크}"
    ),
    "bid_closing": (
        "[서버파츠비더] #{이름}님, 비딩 마감이 다가왔습니다.\n"
        "품목: #{품목}\n"
        "마감: #{마감}\n\n"
        "바로가기: #{링크}"
    ),
    "bid_result": (
        "[서버파츠비더] #{이름}님, 참여하신 비딩 결과를 알려드립니다.\n"
        "품목: #{품목}\n"
        "결과: #{결과}\n\n"
        "바로가기: #{링크}"
    ),
    "order_received": (
        "[서버파츠비더] #{이름}님, 구매요청이 접수되었습니다.\n"
        "품목: #{품목}\n"
        "수량: #{수량}개\n"
        "담당자가 확인 후 연락드립니다."
    ),
}

KIND_LABELS = {
    "signup_approved": "가입 승인",
    "invite": "초대",
    "new_stock": "관심품목 입고",
    "bid_open": "비딩 오픈",
    "bid_closing": "마감 임박",
    "bid_result": "비딩 결과",
    "order_received": "구매요청 접수",
}


def site_url(path: str = "") -> str:
    base = (alimtalk_config().get("site_url") or "").rstrip("/")
    return base + path


def render(kind: str, variables: dict) -> str:
    text = TEMPLATES[kind]
    for k, v in variables.items():
        text = text.replace(k, str(v))
    return text


def enqueue(db: Session, user: models.User, kind: str, variables: dict, listing=None, dedupe: bool = False):
    """발송 대기열에 추가. dedupe=True면 같은 고객·상품·종류로 이미 쌓인 건이 있을 때 건너뜀."""
    if user is None or not user.alimtalk_ok:
        return None
    if dedupe and listing is not None:
        exists = (
            db.query(models.Notification.id)
            .filter_by(user_id=user.id, listing_id=listing.id, kind=kind)
            .first()
        )
        if exists:
            return None
    variables = {"#{이름}": user.name, **variables}
    n = models.Notification(
        user_id=user.id,
        listing_id=listing.id if listing is not None else None,
        kind=kind,
        status="queued",
        to=user.login_id,
        message=json.dumps(variables, ensure_ascii=False),
    )
    db.add(n)
    return n


def _ready(cfg: dict, kind: str) -> str | None:
    """설정이 덜 됐으면 빠진 항목 이름을 돌려준다."""
    for key, label in (("api_key", "API Key"), ("api_secret", "API Secret"), ("pf_id", "발신프로필 ID")):
        if not cfg.get(key):
            return label
    if not (cfg.get("templates") or {}).get(kind):
        return f"템플릿ID({kind})"
    return None


def _solapi_send(cfg: dict, to: str, kind: str, variables: dict) -> None:
    date = datetime.now(timezone.utc).isoformat()
    salt = secrets.token_hex(16)
    signature = hmac.new(cfg["api_secret"].encode(), (date + salt).encode(), hashlib.sha256).hexdigest()
    body = {
        "message": {
            "to": to,
            "from": cfg.get("sender_phone") or "",
            "kakaoOptions": {
                "pfId": cfg["pf_id"],
                "templateId": cfg["templates"][kind],
                "variables": variables,
            },
        }
    }
    req = urllib.request.Request(
        "https://api.solapi.com/messages/v4/send",
        data=json.dumps(body).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"HMAC-SHA256 apiKey={cfg['api_key']}, date={date}, salt={salt}, signature={signature}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            r.read()
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code}: {e.read().decode(errors='replace')[:300]}")


def process_queue(db: Session, limit: int = 100) -> int:
    cfg = alimtalk_config()
    items = db.query(models.Notification).filter_by(status="queued").order_by(models.Notification.id).limit(limit).all()
    for n in items:
        variables = json.loads(n.message or "{}")
        missing = _ready(cfg, n.kind)
        if missing:
            n.status = "not_configured"
            n.error = f"알림톡 설정 필요: {missing}"
        else:
            try:
                _solapi_send(cfg, n.to, n.kind, variables)
                n.status = "sent"
                n.error = None
            except Exception as e:  # 네트워크·인증·템플릿 불일치 등
                n.status = "failed"
                n.error = str(e)[:500]
    db.commit()
    return len(items)


def requeue_unsent(db: Session) -> int:
    """설정 완료 후 '설정 필요'·'실패' 건을 다시 보낼 때 사용."""
    q = db.query(models.Notification).filter(models.Notification.status.in_(["not_configured", "failed"]))
    count = q.count()
    q.update({"status": "queued"}, synchronize_session=False)
    db.commit()
    return count
