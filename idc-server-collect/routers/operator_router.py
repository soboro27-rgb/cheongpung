from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from database import get_db
import models
from models import AppStatus
from auth import require_operator
from config import templates
from datetime import datetime

router = APIRouter()


def _check(request: Request):
    u = require_operator(request)
    if not u:
        return None, RedirectResponse("/login", status_code=302)
    return u, None


# ─── 대시보드 ──────────────────────────────────────────

@router.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request, db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir

    operator_id = u["operator_id"]
    app_q = db.query(models.Application).join(
        models.Dealer, models.Application.dealer_id == models.Dealer.id
    ).filter(models.Dealer.operator_id == operator_id)

    total   = app_q.count()
    pending = app_q.filter(models.Application.status.in_(
        [AppStatus.REQUESTED, AppStatus.RECEIVED, AppStatus.SCHEDULED])).count()
    in_prog = app_q.filter(models.Application.status.in_(
        [AppStatus.COLLECTED, AppStatus.QUOTED])).count()
    done    = app_q.filter(models.Application.status.in_(
        [AppStatus.APPROVED, AppStatus.WIPED, AppStatus.SETTLED, AppStatus.CLOSED])).count()
    dealers = db.query(models.Dealer).filter(
        models.Dealer.operator_id == operator_id,
        models.Dealer.is_active == True,
    ).count()

    recent = app_q.order_by(models.Application.updated_at.desc()).limit(10).all()

    return templates.TemplateResponse(request, "operator/dashboard.html", {"session": request.session,
        "total": total, "pending": pending, "in_prog": in_prog,
        "done": done, "dealers": dealers, "recent": recent})


# ─── 소속 딜러 목록 (읽기 전용) ─────────────────────────

@router.get("/dealers", response_class=HTMLResponse)
def dealer_list(request: Request, db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir
    dealers = db.query(models.Dealer).filter(
        models.Dealer.operator_id == u["operator_id"],
    ).order_by(models.Dealer.name).all()
    return templates.TemplateResponse(request, "operator/dealers.html", {"session": request.session,
        "dealers": dealers})


# ─── 신청 목록 (소속 딜러 전체) ─────────────────────────

@router.get("/applications", response_class=HTMLResponse)
def app_list(request: Request, status: str = "", db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir
    q = db.query(models.Application).join(
        models.Dealer, models.Application.dealer_id == models.Dealer.id
    ).filter(models.Dealer.operator_id == u["operator_id"])
    if status:
        try: q = q.filter(models.Application.status == AppStatus(status))
        except ValueError: pass
    apps = q.order_by(models.Application.updated_at.desc()).all()
    return templates.TemplateResponse(request, "operator/applications.html", {"session": request.session,
        "applications": apps, "current_status": status})


@router.get("/applications/{app_id}", response_class=HTMLResponse)
def app_detail(request: Request, app_id: int, db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir
    app = db.query(models.Application).join(
        models.Dealer, models.Application.dealer_id == models.Dealer.id
    ).filter(
        models.Application.id == app_id,
        models.Dealer.operator_id == u["operator_id"],
    ).first()
    if not app:
        return RedirectResponse("/operator/applications", status_code=302)
    return templates.TemplateResponse(request, "operator/application_detail.html", {"session": request.session, "app": app})


# ─── 정산 (매입사 → 운영사) ─────────────────────────────

@router.get("/settlements", response_class=HTMLResponse)
def settlement_list(request: Request, db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir
    operator_id = u["operator_id"]
    settlements = (
        db.query(models.Settlement)
        .join(models.Application, models.Settlement.application_id == models.Application.id)
        .join(models.Dealer, models.Application.dealer_id == models.Dealer.id)
        .filter(models.Dealer.operator_id == operator_id)
        .order_by(models.Settlement.created_at.desc())
        .all()
    )
    total_amount   = sum(s.total_amount for s in settlements)
    total_operator = sum(s.operator_fee_amount for s in settlements)
    pending_pay    = [s for s in settlements if s.wm_paid and not s.operator_paid]
    return templates.TemplateResponse(request, "operator/settlements.html", {
        "session": request.session,
        "settlements": settlements,
        "total_amount": total_amount,
        "total_operator": total_operator,
        "pending_pay": pending_pay,
    })


@router.post("/settlements/{settlement_id}/operator-paid")
async def mark_operator_paid(request: Request, settlement_id: int, db: Session = Depends(get_db)):
    """매입사 → 운영사 지급 완료 처리"""
    u, redir = _check(request)
    if redir: return redir
    operator_id = u["operator_id"]
    s = (db.query(models.Settlement)
         .join(models.Application)
         .join(models.Dealer, models.Application.dealer_id == models.Dealer.id)
         .filter(
             models.Settlement.id == settlement_id,
             models.Dealer.operator_id == operator_id,
             models.Settlement.wm_paid == True,
         ).first())
    if s:
        s.operator_paid    = True
        s.operator_paid_at = datetime.now()
        db.commit()
    return RedirectResponse("/operator/settlements", status_code=302)
