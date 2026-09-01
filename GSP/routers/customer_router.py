from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from database import get_db
import models
from models import AppStatus
from auth import require_customer
from config import templates
from datetime import datetime

router = APIRouter()


def _check(request: Request):
    u = require_customer(request)
    if not u:
        return None, RedirectResponse("/login", status_code=302)
    return u, None


# ─── 대시보드 ──────────────────────────────────────────

@router.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request, db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir

    customer_id = u["customer_id"]
    total  = db.query(models.Application).filter(models.Application.customer_id == customer_id).count()
    active = db.query(models.Application).filter(
        models.Application.customer_id == customer_id,
        models.Application.status.notin_([AppStatus.CLOSED, AppStatus.REJECTED]),
    ).count()
    waiting_approval = db.query(models.Application).filter(
        models.Application.customer_id == customer_id,
        models.Application.status == AppStatus.QUOTED,
    ).count()
    settled = db.query(models.Application).filter(
        models.Application.customer_id == customer_id,
        models.Application.status.in_([AppStatus.SETTLED, AppStatus.CLOSED]),
    ).count()

    recent = (
        db.query(models.Application)
        .filter(models.Application.customer_id == customer_id)
        .order_by(models.Application.updated_at.desc())
        .limit(10).all()
    )

    return templates.TemplateResponse(request, "customer/dashboard.html", {"session": request.session,
        "total": total, "active": active,
        "waiting_approval": waiting_approval, "settled": settled,
        "recent": recent})


# ─── 신청서 목록 ───────────────────────────────────────

@router.get("/applications", response_class=HTMLResponse)
def app_list(request: Request, status: str = "", db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir
    customer_id = u["customer_id"]
    q = db.query(models.Application).filter(models.Application.customer_id == customer_id)
    if status:
        try: q = q.filter(models.Application.status == AppStatus(status))
        except ValueError: pass
    apps = q.order_by(models.Application.updated_at.desc()).all()
    return templates.TemplateResponse(request, "customer/applications.html", {"session": request.session,
        "applications": apps, "current_status": status})


@router.get("/applications/new", response_class=HTMLResponse)
def new_app_form(request: Request, db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir
    customer_id = u["customer_id"]
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    centers = db.query(models.IdcCenter).filter(models.IdcCenter.is_active == True).all() if hasattr(models, 'IdcCenter') else []
    return templates.TemplateResponse(request, "customer/new_application.html", {"session": request.session,
        "customer": customer, "centers": centers})


@router.post("/applications/new")
async def new_app(request: Request, db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir
    form = await request.form()
    customer_id = u["customer_id"]
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        return RedirectResponse("/customer/applications", status_code=302)

    try:
        idc_id = int(form.get("idc_center_id") or 0) or None
    except (ValueError, TypeError):
        idc_id = customer.default_idc_center_id

    app = models.Application(
        customer_id=customer_id,
        dealer_id=customer.dealer_id,
        idc_center_id=idc_id,
        title=form.get("title", "").strip(),
        notes=form.get("notes", "").strip(),
        contact_name=form.get("contact_name", "").strip(),
        contact_phone=form.get("contact_phone", "").strip(),
        status=AppStatus.REQUESTED,
        submitted_at=datetime.now(),
    )
    db.add(app)
    db.flush()

    # 서버 자산 등록 (row 기반)
    row_idx = 0
    while True:
        manufacturer = form.get(f"manufacturer_{row_idx}", "")
        if manufacturer is None and row_idx > 0:
            break
        if manufacturer is None:
            row_idx += 1
            continue
        manufacturer = manufacturer.strip()
        model = form.get(f"model_{row_idx}", "").strip()
        if not manufacturer and not model:
            row_idx += 1
            if row_idx > 50:
                break
            continue

        try: qty = int(form.get(f"quantity_{row_idx}", 1) or 1)
        except ValueError: qty = 1
        try: ram = int(form.get(f"ram_total_gb_{row_idx}", 0) or 0)
        except ValueError: ram = 0
        try: cpu_c = int(form.get(f"cpu_count_{row_idx}", 1) or 1)
        except ValueError: cpu_c = 1
        try: est_price = float(str(form.get(f"unit_price_estimated_{row_idx}", 0) or 0).replace(",", ""))
        except ValueError: est_price = 0.0

        db.add(models.ServerAsset(
            application_id=app.id,
            manufacturer=manufacturer,
            model=model,
            form_factor=form.get(f"form_factor_{row_idx}", "").strip(),
            cpu_count=cpu_c,
            cpu_model=form.get(f"cpu_model_{row_idx}", "").strip(),
            ram_total_gb=ram,
            ram_config=form.get(f"ram_config_{row_idx}", "").strip(),
            storage_config=form.get(f"storage_config_{row_idx}", "").strip(),
            serial_number=form.get(f"serial_number_{row_idx}", "").strip(),
            asset_tag=form.get(f"asset_tag_{row_idx}", "").strip(),
            rack_location=form.get(f"rack_location_{row_idx}", "").strip(),
            quantity=qty,
            condition_grade=form.get(f"condition_grade_{row_idx}", "중"),
            data_wipe_required=bool(form.get(f"data_wipe_required_{row_idx}")),
            cert_required=bool(form.get(f"cert_required_{row_idx}")),
            description=form.get(f"description_{row_idx}", "").strip(),
            unit_price_estimated=est_price,
        ))
        row_idx += 1
        if row_idx > 50:
            break

    db.commit()
    return RedirectResponse(f"/customer/applications/{app.id}", status_code=302)


@router.get("/applications/{app_id}", response_class=HTMLResponse)
def app_detail(request: Request, app_id: int, db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir
    customer_id = u["customer_id"]
    app = db.query(models.Application).filter(
        models.Application.id == app_id,
        models.Application.customer_id == customer_id,
    ).first()
    if not app:
        return RedirectResponse("/customer/applications", status_code=302)
    has_estimated = any(a.unit_price_estimated > 0 for a in app.assets)

    # 운영사 → 딜러 수수료 순차 적용 후 고객 지급 단가 계산
    dealer = app.dealer
    operator = dealer.operator if (dealer and dealer.operator_id) else None
    total_est_all  = sum(x.unit_price_estimated * x.quantity for x in app.assets) or 1
    total_conf_all = sum(x.unit_price_confirmed  * x.quantity for x in app.assets) or 1
    asset_net_prices = {}
    for a in app.assets:
        est, conf = a.unit_price_estimated, a.unit_price_confirmed

        if operator and operator.fee_type.value == "percent":
            op_ratio = 1 - operator.fee_value / 100
            est, conf = est * op_ratio, conf * op_ratio
        elif operator and operator.fee_type.value == "fixed":
            est = est - operator.fee_value * (a.unit_price_estimated / total_est_all)
            conf = conf - operator.fee_value * (a.unit_price_confirmed / total_conf_all)

        if dealer and dealer.fee_type.value == "percent":
            ratio = 1 - dealer.fee_value / 100
            net_est, net_conf = est * ratio, conf * ratio
        elif dealer and dealer.fee_type.value == "fixed":
            net_est  = est - dealer.fee_value * (a.unit_price_estimated / total_est_all)
            net_conf = conf - dealer.fee_value * (a.unit_price_confirmed / total_conf_all)
        else:
            net_est, net_conf = est, conf
        asset_net_prices[a.id] = {"estimated": max(net_est, 0), "confirmed": max(net_conf, 0)}

    return templates.TemplateResponse(request, "customer/application_detail.html", {
        "session": request.session,
        "app": app,
        "has_estimated": has_estimated,
        "asset_net_prices": asset_net_prices,
    })


@router.post("/applications/{app_id}/approve")
def approve_quote(request: Request, app_id: int, db: Session = Depends(get_db)):
    """단가확정(QUOTED) 상태에서 고객이 승인"""
    u, redir = _check(request)
    if redir: return redir
    customer_id = u["customer_id"]
    app = db.query(models.Application).filter(
        models.Application.id == app_id,
        models.Application.customer_id == customer_id,
        models.Application.status == AppStatus.QUOTED,
    ).first()
    if app:
        app.status = AppStatus.APPROVED
        app.updated_at = datetime.now()
        db.flush()

        # Settlement 사전 생성 (WM이 나중에 wm_paid 처리)
        if not app.settlement:
            dealer = app.dealer
            operator = dealer.operator if (dealer and dealer.operator_id) else None
            total = sum(a.unit_price_confirmed * a.quantity for a in app.assets)

            if operator:
                if operator.fee_type.value == "percent":
                    operator_fee = total * operator.fee_value / 100
                else:
                    operator_fee = operator.fee_value
            else:
                operator_fee = 0.0
            after_operator = total - operator_fee

            if dealer and dealer.fee_type.value == "percent":
                fee = after_operator * dealer.fee_value / 100
            elif dealer:
                fee = dealer.fee_value
            else:
                fee = 0.0
            stype = dealer.settlement_type if dealer else models.SettlementType.DIRECT
            db.add(models.Settlement(
                application_id=app.id,
                settlement_type=stype,
                total_amount=total,
                operator_fee_amount=operator_fee,
                dealer_fee_amount=fee,
                customer_amount=after_operator - fee,
            ))
        db.commit()
    return RedirectResponse(f"/customer/applications/{app_id}", status_code=302)


@router.get("/applications/{app_id}/quotation", response_class=HTMLResponse)
def quotation(request: Request, app_id: int, db: Session = Depends(get_db)):
    u, redir = _check(request)
    if redir: return redir
    customer_id = u["customer_id"]
    app = db.query(models.Application).filter(
        models.Application.id == app_id,
        models.Application.customer_id == customer_id,
    ).first()
    if not app:
        return RedirectResponse("/customer/applications", status_code=302)

    confirmed_statuses = {AppStatus.QUOTED, AppStatus.APPROVED, AppStatus.WIPED, AppStatus.SETTLED, AppStatus.CLOSED}
    use_confirmed = app.status in confirmed_statuses

    dealer = app.dealer
    operator = dealer.operator if (dealer and dealer.operator_id) else None
    total_raw = sum(
        (a.unit_price_confirmed if use_confirmed else a.unit_price_estimated) * a.quantity
        for a in app.assets
    ) or 1

    asset_prices = []
    grand_total = 0.0
    for a in app.assets:
        unit_raw = a.unit_price_confirmed if use_confirmed else a.unit_price_estimated
        item_raw = unit_raw * a.quantity

        if operator and operator.fee_type.value == "percent":
            item_after_op = item_raw * (1 - operator.fee_value / 100)
        elif operator and operator.fee_type.value == "fixed":
            op_share = operator.fee_value * (item_raw / total_raw)
            item_after_op = item_raw - op_share
        else:
            item_after_op = item_raw

        if dealer and dealer.fee_type.value == "percent":
            item_net = item_after_op * (1 - dealer.fee_value / 100)
        elif dealer and dealer.fee_type.value == "fixed":
            fee_share = dealer.fee_value * (item_raw / total_raw)
            item_net = item_after_op - fee_share
        else:
            item_net = item_after_op
        net = max(item_net / a.quantity, 0) if a.quantity else 0
        subtotal = net * a.quantity
        grand_total += subtotal
        asset_prices.append({"asset": a, "unit_net": net, "subtotal": subtotal})

    return templates.TemplateResponse(request, "customer/quotation.html", {
        "session": request.session,
        "app": app,
        "asset_prices": asset_prices,
        "grand_total": grand_total,
        "use_confirmed": use_confirmed,
        "today": datetime.now(),
    })


@router.post("/applications/{app_id}/reject")
async def reject_quote(request: Request, app_id: int, db: Session = Depends(get_db)):
    """단가확정(QUOTED) 상태에서 고객이 반려"""
    u, redir = _check(request)
    if redir: return redir
    form = await request.form()
    customer_id = u["customer_id"]
    app = db.query(models.Application).filter(
        models.Application.id == app_id,
        models.Application.customer_id == customer_id,
        models.Application.status == AppStatus.QUOTED,
    ).first()
    if app:
        app.status = AppStatus.REJECTED
        note = form.get("reject_reason", "").strip()
        if note:
            app.notes = (app.notes or "") + f"\n[반려사유] {note}"
        app.updated_at = datetime.now()
        db.commit()
    return RedirectResponse(f"/customer/applications/{app_id}", status_code=302)
