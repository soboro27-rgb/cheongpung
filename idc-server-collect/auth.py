from fastapi import Request
from models import UserRole

# 월드와이드메모리 내부 역할 집합
WM_ROLES = {UserRole.SUPER_ADMIN, UserRole.WM_COLLECTOR, UserRole.WM_INSPECTOR}
OPERATOR_ROLES = {UserRole.OPERATOR_ADMIN, UserRole.OPERATOR_STAFF}
DEALER_ROLES = {UserRole.DEALER_ADMIN, UserRole.DEALER_STAFF}
CUSTOMER_ROLES = {UserRole.CUSTOMER_ADMIN, UserRole.CUSTOMER_STAFF}


def get_session_user(request: Request) -> dict | None:
    """세션에서 현재 사용자 정보 반환. 미로그인 시 None."""
    if not request.session.get("user_id"):
        return None
    return {
        "user_id":     request.session["user_id"],
        "login_id":    request.session.get("login_id", ""),
        "name":        request.session.get("name", ""),
        "role":        request.session.get("role", ""),
        "operator_id":   request.session.get("operator_id"),
        "operator_name": request.session.get("operator_name", ""),
        "dealer_id":   request.session.get("dealer_id"),
        "dealer_name": request.session.get("dealer_name", ""),
        "customer_id": request.session.get("customer_id"),
        "customer_name": request.session.get("customer_name", ""),
    }


def require_wm(request: Request) -> dict | None:
    """월드와이드메모리 직원 (super_admin / wm_collector / wm_inspector)"""
    u = get_session_user(request)
    if not u:
        return None
    if u["role"] not in {r.value for r in WM_ROLES}:
        return None
    return u


def require_super_admin(request: Request) -> dict | None:
    """슈퍼관리자만"""
    u = get_session_user(request)
    if not u:
        return None
    if u["role"] != UserRole.SUPER_ADMIN.value:
        return None
    return u


def require_operator(request: Request) -> dict | None:
    """운영사(operator_admin / operator_staff)"""
    u = get_session_user(request)
    if not u:
        return None
    if u["role"] not in {r.value for r in OPERATOR_ROLES}:
        return None
    return u


def require_dealer(request: Request) -> dict | None:
    """딜러(dealer_admin / dealer_staff)"""
    u = get_session_user(request)
    if not u:
        return None
    if u["role"] not in {r.value for r in DEALER_ROLES}:
        return None
    return u


def require_customer(request: Request) -> dict | None:
    """고객사(customer_admin / customer_staff)"""
    u = get_session_user(request)
    if not u:
        return None
    if u["role"] not in {r.value for r in CUSTOMER_ROLES}:
        return None
    return u


def require_any(request: Request) -> dict | None:
    """로그인만 되어 있으면 통과"""
    return get_session_user(request)
