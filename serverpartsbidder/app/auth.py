import hashlib
import hmac
import re
import secrets

from fastapi import Request
from sqlalchemy.orm import Session

import models


def hash_password(pw: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 200_000).hex()
    return f"{salt}${h}"


def verify_password(pw: str, stored: str | None) -> bool:
    if not stored or "$" not in stored:
        return False
    salt, h = stored.split("$", 1)
    return hmac.compare_digest(hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 200_000).hex(), h)


def normalize_phone(s: str) -> str:
    return re.sub(r"\D", "", s or "")


def current_user(request: Request, db: Session):
    uid = request.session.get("uid")
    if not uid:
        return None
    return db.get(models.User, uid)


def is_broker(user) -> bool:
    return user is not None and user.role == "broker"


def is_approved(user) -> bool:
    """비딩 열람 가능 여부. 파트너는 고객 입찰가를 보면 안 되므로 제외."""
    return user is not None and (user.role == "broker" or (user.role == "customer" and user.status == "approved"))


def is_partner(user) -> bool:
    return user is not None and user.role == "partner" and user.status == "approved"
