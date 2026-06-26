from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from database import get_db
import models
from models import AppStatus
from auth import require_dealer
from config import templates
from datetime import datetime
import bcrypt

router = APIRouter()


def _check(request: Request):
    u = require_dealer(request)
    if not u:
        return None, RedirectResponse("/login", status_code=302)
    return u, None


# ─── 대시보드 ──────────────────────────────────────────

@router.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request, db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir

    dealer_id = u["dealer_id"]
    total     = db.query(models.Application).filter(models.Application.dealer_id == dealer_id).count()
    pending   = db.query(models.Application).filter(
        models.Application.dealer_id == dealer_id,
        models.Application.status.in_([AppStatus.REQUESTED, AppStatus.RECEIVED, AppStatus.SCHEDULED]),
    ).count()
    in_prog   = db.query(models.Application).filter(
        models.Application.dealer_id == dealer_id,
        models.Application.status.in_([AppStatus.COLLECTED, AppStatus.QUOTED]),
    ).count()
    done      = db.query(models.Application).filter(
        models.Application.dealer_id == dealer_id,
        models.Application.status.in_([AppStatus.APPROVED, AppStatus.WIPED, AppStatus.SETTLED, AppStatus.CLOSED]),
    ).count()
    customers = db.query(models.Customer).filter(
        models.Customer.dealer_id == dealer_id,
        models.Customer.is_active == True,
    ).count()

    recent = (
        db.query(models.Application)
        .filter(models.Application.dealer_id == dealer_id)
        .order_by(models.Application.updated_at.desc())
        .limit(10).all()
    )

    return templates.TemplateResponse(request, "dealer/dashboard.html", {"session": request.session,
        "total": total, "pending": pending, "in_prog": in_prog,
        "done": done, "customers": customers, "recent": recent})


# ─── 고객사 관리 ───────────────────────────────────────

@router.get("/customers", response_class=HTMLResponse)
def customer_list(request: Request, db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir
    dealer_id = u["dealer_id"]
    customers = db.query(models.Customer).filter(
        models.Customer.dealer_id == dealer_id,
    ).order_by(models.Customer.name).all()
    centers = db.query(models.IdcCenter).filter(models.IdcCenter.is_active == True).all() if hasattr(models, 'IdcCenter') else []
    return templates.TemplateResponse(request, "dealer/customers.html", {"session": request.session,
        "customers": customers, "centers": centers})


@router.post("/customers")
async def customer_create(request: Request, db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir
    if u["role"] != "dealer_admin":
        return RedirectResponse("/dealer/customers?error=no_permission", status_code=302)
    form = await request.form()
    dealer_id = u["dealer_id"]
    try:
        idc_id = int(form.get("default_idc_center_id") or 0) or None
    except (ValueError, TypeError):
        idc_id = None

    db.add(models.Customer(
        dealer_id=dealer_id,
        name=form.get("name", "").strip(),
        customer_code=form.get("customer_code", "").strip().upper(),
        business_no=form.get("business_no", "").strip(),
        manager_name=form.get("manager_name", "").strip(),
        manager_phone=form.get("manager_phone", "").strip(),
        manager_email=form.get("manager_email", "").strip(),
        default_idc_center_id=idc_id,
    ))
    db.commit()
    return RedirectResponse("/dealer/customers", status_code=302)


@router.get("/customers/{customer_id}", response_class=HTMLResponse)
def customer_detail(request: Request, customer_id: int, db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir
    dealer_id = u["dealer_id"]
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.dealer_id == dealer_id,
    ).first()
    if not customer:
        return RedirectResponse("/dealer/customers", status_code=302)
    apps = db.query(models.Application).filter(
        models.Application.customer_id == customer_id,
        models.Application.dealer_id == dealer_id,
    ).order_by(models.Application.updated_at.desc()).all()
    users = db.query(models.User).filter(models.User.customer_id == customer_id).all()
    return templates.TemplateResponse(request, "dealer/customer_detail.html", {"session": request.session,
        "customer": customer, "applications": apps, "users": users})


# ─── 고객사 계정 생성 ─────────────────────────────────

@router.post("/customers/{customer_id}/users")
async def customer_user_create(request: Request, customer_id: int, db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir
    if u["role"] != "dealer_admin":
        return RedirectResponse(f"/dealer/customers/{customer_id}", status_code=302)

    dealer_id = u["dealer_id"]
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.dealer_id == dealer_id,
    ).first()
    if not customer:
        return RedirectResponse("/dealer/customers", status_code=302)

    form = await request.form()
    login_id = form.get("login_id", "").strip()
    password = form.get("password", "").strip()
    name     = form.get("name", "").strip()
    role_str = form.get("role", "customer_admin")

    if role_str not in ("customer_admin", "customer_staff"):
        role_str = "customer_admin"

    if not login_id or not password or not name:
        return RedirectResponse(f"/dealer/customers/{customer_id}?error=required", status_code=302)

    if db.query(models.User).filter(models.User.login_id == login_id).first():
        return RedirectResponse(f"/dealer/customers/{customer_id}?error=duplicate", status_code=302)

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    db.add(models.User(
        login_id=login_id,
        password_hash=pw_hash,
        name=name,
        role=models.UserRole(role_str),
        customer_id=customer_id,
        dealer_id=None,
    ))
    db.commit()
    return RedirectResponse(f"/dealer/customers/{customer_id}?success=1", status_code=302)


# ─── 고객사 계정 비활성화 ──────────────────────────────

@router.post("/customers/{customer_id}/users/{user_id}/toggle")
async def customer_user_toggle(request: Request, customer_id: int, user_id: int, db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir
    if u["role"] != "dealer_admin":
        return RedirectResponse(f"/dealer/customers/{customer_id}", status_code=302)

    dealer_id = u["dealer_id"]
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.dealer_id == dealer_id,
    ).first()
    if not customer:
        return RedirectResponse("/dealer/customers", status_code=302)

    usr = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.customer_id == customer_id,
    ).first()
    if usr:
        usr.is_active = not usr.is_active
        db.commit()
    return RedirectResponse(f"/dealer/customers/{customer_id}", status_code=302)


# ─── 신청 목록 ─────────────────────────────────────────

@router.get("/applications", response_class=HTMLResponse)
def app_list(request: Request, status: str = "", db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir
    dealer_id = u["dealer_id"]
    q = db.query(models.Application).filter(models.Application.dealer_id == dealer_id)
    if status:
        try: q = q.filter(models.Application.status == AppStatus(status))
        except ValueError: pass
    apps = q.order_by(models.Application.updated_at.desc()).all()
    return templates.TemplateResponse(request, "dealer/applications.html", {"session": request.session,
        "applications": apps, "current_status": status})


@router.get("/applications/{app_id}", response_class=HTMLResponse)
def app_detail(request: Request, app_id: int, db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir
    dealer_id = u["dealer_id"]
    app = db.query(models.Application).filter(
        models.Application.id == app_id,
        models.Application.dealer_id == dealer_id,
    ).first()
    if not app:
        return RedirectResponse("/dealer/applications", status_code=302)
    return templates.TemplateResponse(request, "dealer/application_detail.html", {"session": request.session, "app": app})


# ─── Phase 4: 딜러 경유 정산 ─────────────────────────

@router.get("/settlements", response_class=HTMLResponse)
def settlement_list(request: Request, db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir
    dealer_id = u["dealer_id"]
    settlements = (
        db.query(models.Settlement)
        .join(models.Application, models.Settlement.application_id == models.Application.id)
        .filter(models.Application.dealer_id == dealer_id)
        .order_by(models.Settlement.created_at.desc())
        .all()
    )
    total_amount   = sum(s.total_amount for s in settlements)
    total_customer = sum(s.customer_amount for s in settlements)
    pending_pay    = [s for s in settlements if s.wm_paid and not s.dealer_paid
                      and s.settlement_type.value == "via_dealer"]
    return templates.TemplateResponse(request, "dealer/settlements.html", {
        "session": request.session,
        "settlements": settlements,
        "total_amount": total_amount,
        "total_customer": total_customer,
        "pending_pay": pending_pay,
    })


@router.post("/settlements/{settlement_id}/dealer-paid")
async def mark_dealer_paid(request: Request, settlement_id: int, db: Session = Depends(get_db)):
    """딜러 → 고객 지급 완료 처리"""
    u, redir = _check(request)
    if redir: return redir
    dealer_id = u["dealer_id"]
    s = (db.query(models.Settlement)
         .join(models.Application)
         .filter(
             models.Settlement.id == settlement_id,
             models.Application.dealer_id == dealer_id,
             models.Settlement.wm_paid == True,
         ).first())
    if s:
        s.dealer_paid    = True
        s.dealer_paid_at = datetime.now()
        db.commit()
    return RedirectResponse("/dealer/settlements", status_code=302)
