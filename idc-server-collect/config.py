from fastapi.templating import Jinja2Templates
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

STATUS_LABEL = {
    "requested": "신청접수",
    "received":  "접수확인",
    "scheduled": "수거예정",
    "collected": "수거완료",
    "quoted":    "단가확정",
    "approved":  "고객승인",
    "rejected":  "반려",
    "wiped":     "파기완료",
    "settled":   "정산완료",
    "closed":    "종결",
}

STATUS_COLOR = {
    "requested": "secondary",
    "received":  "info",
    "scheduled": "primary",
    "collected": "info",
    "quoted":    "warning",
    "approved":  "success",
    "rejected":  "danger",
    "wiped":     "success",
    "settled":   "success",
    "closed":    "dark",
}

# 상태 전이 순서 (progress bar용)
STATUS_ORDER = [
    "requested", "received", "scheduled", "collected",
    "quoted", "approved", "wiped", "settled", "closed",
]

ROLE_LABEL = {
    "super_admin":    "슈퍼관리자",
    "wm_collector":   "수거기사",
    "wm_inspector":   "검수자",
    "operator_admin": "운영사 관리자",
    "operator_staff": "운영사 직원",
    "dealer_admin":   "딜러 관리자",
    "dealer_staff":   "딜러 직원",
    "customer_admin": "고객사 관리자",
    "customer_staff": "고객사 직원",
}

FORM_FACTORS = ["1U", "2U", "4U", "타워", "블레이드", "기타"]
CONDITION_GRADES = ["상", "중", "하"]
SERVER_CATEGORIES = ["서버", "스토리지", "네트워크장비", "기타"]

def dealer_medal(fee_type=None, fee_value=None) -> str:
    """수수료율에 따른 메달 이모지 반환 (% 타입 전용)"""
    if fee_type != "percent":
        return ""
    try:
        fv = float(fee_value or 0)
    except (TypeError, ValueError):
        return ""
    if fv >= 9:
        return "🥇"
    elif fv >= 7:
        return "🥈"
    elif fv >= 5:
        return "🥉"
    return ""

templates.env.globals["STATUS_LABEL"]  = STATUS_LABEL
templates.env.globals["STATUS_COLOR"]  = STATUS_COLOR
templates.env.globals["STATUS_ORDER"]  = STATUS_ORDER
templates.env.globals["ROLE_LABEL"]    = ROLE_LABEL
templates.env.globals["FORM_FACTORS"]  = FORM_FACTORS
templates.env.globals["dealer_medal"]  = dealer_medal
