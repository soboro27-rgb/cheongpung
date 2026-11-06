"""서버파츠비더 — 월드메모리 서버부품 거래 플랫폼 (즉시판매 + 비딩 + 알림톡)."""
import asyncio
import html
import io
import json
import secrets
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import quote

from fastapi import Depends, FastAPI, File, Form, Request, UploadFile
from fastapi.responses import HTMLResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware

import logic
import models
import notify
from auth import current_user, hash_password, is_approved, is_broker, is_partner, normalize_phone, verify_password
from config import (APP_NAME, CATEGORIES, DEFAULT_BID_HOURS, DEFAULT_PRIORITY_HOURS, MAX_BIDS_PER_CUSTOMER,
                    STOCK_CSV, alimtalk_config, ALIMTALK_FILE)
from db import Base, SessionLocal, engine, get_db

HERE = Path(__file__).parent
STATE = {"stock_mtime": None, "last_sync": None, "last_sync_result": None}


def init_db():
    Base.metadata.create_all(engine)
    with engine.begin() as conn:  # 기존 DB에 새 컬럼 추가 (create_all은 기존 테이블에 컬럼을 안 붙임)
        cols = {r[1] for r in conn.exec_driver_sql("PRAGMA table_info(listings)")}
        for name, typ in (("partner_id", "INTEGER REFERENCES users(id)"), ("partner_price", "REAL"), ("partner_currency", "VARCHAR(5)")):
            if name not in cols:
                conn.exec_driver_sql(f"ALTER TABLE listings ADD COLUMN {name} {typ}")
    db = SessionLocal()
    try:
        if not db.query(models.User).filter_by(role="broker").first():
            db.add(models.User(login_id="soboro27", password_hash=hash_password("11111111"), name="관리자",
                               company="월드메모리", role="broker", status="approved"))
            db.commit()
    finally:
        db.close()


def run_sync():
    db = SessionLocal()
    try:
        STATE["last_sync_result"] = logic.sync_stock(db)
        STATE["last_sync"] = datetime.now()
        if STOCK_CSV.exists():
            STATE["stock_mtime"] = STOCK_CSV.stat().st_mtime
    finally:
        db.close()


def background_tick():
    db = SessionLocal()
    try:
        if STOCK_CSV.exists() and STOCK_CSV.stat().st_mtime != STATE["stock_mtime"]:
            run_sync()
        logic.tick_bids(db)
        notify.process_queue(db)
    finally:
        db.close()


async def loop():
    while True:
        try:
            await asyncio.to_thread(background_tick)
        except Exception as e:  # 루프가 죽지 않게
            print("background error:", e)
        await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(app):
    init_db()
    alimtalk_config()  # 설정파일 틀 생성
    task = asyncio.create_task(loop())
    yield
    task.cancel()


app = FastAPI(lifespan=lifespan, title=APP_NAME)
app.add_middleware(SessionMiddleware, secret_key=__import__("config").SECRET_KEY, max_age=60 * 60 * 24 * 14)
app.mount("/static", StaticFiles(directory=HERE / "static"), name="static")
templates = Jinja2Templates(directory=HERE / "templates")
templates.env.filters["won"] = logic.won
templates.env.filters["dt"] = logic.fmt_dt
templates.env.globals.update(APP_NAME=APP_NAME, CATEGORIES=CATEGORIES, KIND_LABELS=notify.KIND_LABELS)

STATUS_LABELS = {
    "on_sale": "판매중", "hidden": "숨김", "sold_out": "품절",
    "active": "진행중", "pending_result": "결과 대기", "won": "낙찰", "lost": "미성사",
    "failed": "유찰", "cancelled": "취소", "review": "검토 대기",
    "pending": "승인 대기", "approved": "승인", "rejected": "반려",
    "requested": "접수", "confirmed": "확정",
    "queued": "대기", "sent": "발송", "not_configured": "설정 필요",
}
templates.env.globals["STATUS"] = STATUS_LABELS


def page(request: Request, name: str, db: Session, **ctx):
    ctx.setdefault("user", current_user(request, db))
    ctx["flash"] = request.session.pop("flash", None)
    ctx["now"] = datetime.now()
    return templates.TemplateResponse(request, name, ctx)


def go(request: Request, url: str, msg: str | None = None):
    if msg:
        request.session["flash"] = msg
    return RedirectResponse(url, status_code=303)


# ════════════════════ 고객 화면 ════════════════════

@app.get("/", response_class=HTMLResponse)
def home(request: Request, tab: str = "stock", cat: str = "", q: str = "", db: Session = Depends(get_db)):
    user = current_user(request, db)
    if user is not None and user.role == "partner":
        return go(request, "/partner")
    now = datetime.now()
    qry = db.query(models.Listing)
    if tab == "bid":
        qry = qry.filter(models.Listing.kind == "bid", models.Listing.status == "active")
    elif tab == "closed":
        qry = qry.filter(models.Listing.kind == "bid", models.Listing.status.in_(["pending_result", "won", "lost", "failed"]))
    else:
        tab = "stock"
        qry = qry.filter(models.Listing.kind == "stock", models.Listing.status == "on_sale")
    if cat:
        qry = qry.filter(models.Listing.category == cat)
    items = qry.order_by(models.Listing.bid_end if tab == "bid" else models.Listing.id.desc()).all()
    if q:
        toks = q.lower().split()
        items = [l for l in items if all(t in f"{l.title} {l.description}".lower() for t in toks)]
    locked = tab != "stock" and not is_approved(user)
    upcoming_priority = 0
    if tab == "bid" and not locked:
        visible = [l for l in items if logic.can_see(l, user, now)]
        upcoming_priority = len(items) - len(visible)
        items = visible
    if tab == "closed":
        items = items[:50]
    counts = {
        "stock": db.query(models.Listing).filter_by(kind="stock", status="on_sale").count(),
        "bid": db.query(models.Listing).filter_by(kind="bid", status="active").count(),
    }
    return page(request, "home.html", db, user=user, tab=tab, cat=cat, q=q, items=[] if locked else items,
                locked=locked, counts=counts, upcoming_priority=upcoming_priority, top_bid=logic.top_bid)


@app.get("/item/{lid}", response_class=HTMLResponse)
def item(lid: int, request: Request, db: Session = Depends(get_db)):
    user = current_user(request, db)
    if user is not None and user.role == "partner":
        return go(request, "/partner")
    l = db.get(models.Listing, lid)
    if l is None:
        return go(request, "/", "없는 상품입니다.")
    if l.kind == "bid" and not is_approved(user):
        return go(request, "/login?next=" + quote(f"/item/{lid}"), "비딩은 승인된 회원만 볼 수 있습니다. 로그인해 주세요.")
    if not logic.can_see(l, user) and not (l.kind == "stock" and l.status == "sold_out"):
        return go(request, "/", "지금은 볼 수 없는 상품입니다.")
    mine = logic.user_bids(l, user)
    return page(request, "item.html", db, user=user, l=l, top=logic.top_bid(l), mine=mine,
                bidders=len({b.user_id for b in l.bids}), max_bids=MAX_BIDS_PER_CUSTOMER)


@app.post("/item/{lid}/bid")
def place_bid(lid: int, request: Request, unit_price: str = Form(...), quantity: int = Form(...),
              db: Session = Depends(get_db)):
    user = current_user(request, db)
    l = db.get(models.Listing, lid)
    back = f"/item/{lid}"
    if not is_approved(user) or user.role != "customer":
        return go(request, back, "승인된 고객 계정으로만 입찰할 수 있습니다.")
    if l is None or l.kind != "bid" or l.status != "active" or datetime.now() >= l.bid_end or not logic.can_see(l, user):
        return go(request, back, "입찰할 수 없는 상태입니다.")
    price = logic._to_int(unit_price)
    if not price or price <= 0:
        return go(request, back, "개당 희망가를 숫자로 입력해 주세요.")
    if quantity < 1 or quantity > l.quantity:
        return go(request, back, f"수량은 1~{l.quantity}개 사이로 입력해 주세요.")
    if l.price and price < l.price:
        return go(request, back, f"시작가({logic.won(l.price)}) 이상으로 입찰해 주세요.")
    mine = logic.user_bids(l, user)
    if len(mine) >= MAX_BIDS_PER_CUSTOMER:
        return go(request, back, f"입찰은 상품당 {MAX_BIDS_PER_CUSTOMER}번까지 가능합니다.")
    if mine and price <= max(b.unit_price for b in mine):
        return go(request, back, f"재입찰은 이전 희망가({logic.won(max(b.unit_price for b in mine))})보다 높아야 합니다.")
    db.add(models.Bid(listing_id=l.id, user_id=user.id, seq=len(mine) + 1, unit_price=price, quantity=quantity))
    db.commit()
    return go(request, back, f"입찰했습니다: 개당 {logic.won(price)} × {quantity}개")


@app.post("/item/{lid}/order")
def place_order(lid: int, request: Request, quantity: int = Form(...), note: str = Form(""),
                db: Session = Depends(get_db)):
    user = current_user(request, db)
    l = db.get(models.Listing, lid)
    back = f"/item/{lid}"
    if user is None:
        return go(request, "/login?next=" + quote(back), "구매요청은 로그인 후 가능합니다.")
    if not is_approved(user) or user.role != "customer":
        return go(request, back, "가입 승인 후 구매요청할 수 있습니다.")
    if l is None or l.kind != "stock" or l.status != "on_sale":
        return go(request, back, "지금은 구매요청할 수 없는 상품입니다.")
    if quantity < 1 or quantity > l.quantity:
        return go(request, back, f"수량은 1~{l.quantity}개 사이로 입력해 주세요.")
    db.add(models.Order(listing_id=l.id, user_id=user.id, quantity=quantity, unit_price=l.price or 0, note=note.strip()))
    notify.enqueue(db, user, "order_received", {"#{품목}": l.title, "#{수량}": quantity}, listing=l)
    db.commit()
    return go(request, back, "구매요청을 보냈습니다. 담당자가 확인 후 연락드립니다.")


@app.get("/login", response_class=HTMLResponse)
def login_form(request: Request, next: str = "/", db: Session = Depends(get_db)):
    return page(request, "login.html", db, next=next)


@app.post("/login")
def login(request: Request, login_id: str = Form(...), password: str = Form(...), next: str = Form("/"),
          db: Session = Depends(get_db)):
    lid = login_id.strip()
    u = db.query(models.User).filter(models.User.login_id.in_([lid, normalize_phone(lid) or lid])).first()
    if u is None or not verify_password(password, u.password_hash):
        return go(request, "/login", "아이디 또는 비밀번호가 맞지 않습니다.")
    request.session["uid"] = u.id
    if u.status == "pending":
        return go(request, "/my", "가입 승인 대기 중입니다. 승인되면 알림톡으로 알려드립니다.")
    if u.status == "rejected":
        request.session.clear()
        return go(request, "/login", "이용이 제한된 계정입니다. 담당자에게 문의해 주세요.")
    if u.role == "broker" and next in ("", "/"):
        next = "/admin"
    if u.role == "partner":
        next = "/partner"
    return go(request, next if next.startswith("/") else "/")


@app.get("/logout")
def logout(request: Request):
    request.session.clear()
    return go(request, "/")


@app.get("/signup", response_class=HTMLResponse)
def signup_form(request: Request, db: Session = Depends(get_db)):
    return page(request, "signup.html", db)


@app.post("/signup")
def signup(request: Request, company: str = Form(...), name: str = Form(...), phone: str = Form(...),
           email: str = Form(""), biz_no: str = Form(""), password: str = Form(...),
           interests: list[str] = Form([]), agree: str = Form(""), db: Session = Depends(get_db)):
    p = normalize_phone(phone)
    if len(p) < 10:
        return go(request, "/signup", "휴대폰 번호를 확인해 주세요.")
    if len(password) < 6:
        return go(request, "/signup", "비밀번호는 6자 이상으로 정해 주세요.")
    if db.query(models.User).filter_by(login_id=p).first():
        return go(request, "/login", "이미 가입된 번호입니다. 로그인해 주세요.")
    u = models.User(login_id=p, password_hash=hash_password(password), name=name.strip(), company=company.strip(),
                    email=email.strip(), biz_no=biz_no.strip(), alimtalk_ok=bool(agree))
    for c in interests:
        if c in CATEGORIES or c == "전체":
            u.interests.append(models.Interest(category=c, keyword=""))
    db.add(u)
    db.commit()
    request.session["uid"] = u.id
    return go(request, "/my", "가입 신청을 받았습니다. 확인 후 승인되면 알림톡으로 알려드립니다.")


@app.get("/my", response_class=HTMLResponse)
def my(request: Request, db: Session = Depends(get_db)):
    user = current_user(request, db)
    if user is None:
        return go(request, "/login?next=/my")
    orders = db.query(models.Order).filter_by(user_id=user.id).order_by(models.Order.id.desc()).all()
    bids = db.query(models.Bid).filter_by(user_id=user.id).order_by(models.Bid.id.desc()).all()
    by_listing = {}
    for b in bids:
        by_listing.setdefault(b.listing_id, b)
    return page(request, "my.html", db, user=user, orders=orders, bid_rows=list(by_listing.values()))


@app.post("/my/interest")
def add_interest(request: Request, category: str = Form(...), keyword: str = Form(""), db: Session = Depends(get_db)):
    user = current_user(request, db)
    if user is None:
        return go(request, "/login")
    if category in CATEGORIES or category == "전체":
        user.interests.append(models.Interest(category=category, keyword=keyword.strip()))
        db.commit()
    return go(request, "/my#interests", "관심품목을 추가했습니다.")


@app.post("/my/interest/{iid}/delete")
def del_interest(iid: int, request: Request, db: Session = Depends(get_db)):
    user = current_user(request, db)
    i = db.get(models.Interest, iid)
    if user and i and i.user_id == user.id:
        db.delete(i)
        db.commit()
    return go(request, "/my#interests", "관심품목을 지웠습니다.")


@app.post("/my/settings")
def my_settings(request: Request, alimtalk_ok: str = Form(""), new_password: str = Form(""),
                db: Session = Depends(get_db)):
    user = current_user(request, db)
    if user is None:
        return go(request, "/login")
    user.alimtalk_ok = bool(alimtalk_ok)
    msg = "알림 설정을 저장했습니다."
    if new_password:
        if len(new_password) < 6:
            return go(request, "/my#settings", "비밀번호는 6자 이상으로 정해 주세요.")
        user.password_hash = hash_password(new_password)
        msg = "비밀번호와 알림 설정을 저장했습니다."
    db.commit()
    return go(request, "/my#settings", msg)


# ════════════════════ 관리자(브로커) 화면 ════════════════════

def need_broker(fn):
    import functools
    import inspect

    def denied(kw):
        request, db = kw["request"], kw["db"]
        if not is_broker(current_user(request, db)):
            return go(request, "/login?next=/admin", "관리자 로그인이 필요합니다.")
        return None

    if inspect.iscoroutinefunction(fn):
        @functools.wraps(fn)
        async def awrapper(*a, **kw):
            return denied(kw) or await fn(*a, **kw)
        return awrapper

    @functools.wraps(fn)
    def wrapper(*a, **kw):
        return denied(kw) or fn(*a, **kw)
    return wrapper


@app.get("/admin", response_class=HTMLResponse)
@need_broker
def admin_home(request: Request, db: Session = Depends(get_db)):
    L = models.Listing
    stats = {
        "pending_users": db.query(models.User).filter_by(role="customer", status="pending").count(),
        "customers": db.query(models.User).filter_by(role="customer", status="approved").count(),
        "history": db.query(models.User).filter_by(role="customer", status="approved", has_history=True).count(),
        "orders": db.query(models.Order).filter_by(status="requested").count(),
        "on_sale": db.query(L).filter_by(kind="stock", status="on_sale").count(),
        "active_bids": db.query(L).filter_by(kind="bid", status="active").count(),
        "pending_result": db.query(L).filter_by(kind="bid", status="pending_result").count(),
        "review": db.query(L).filter_by(kind="bid", status="review").count(),
        "noti_unsent": db.query(models.Notification).filter(models.Notification.status.in_(["not_configured", "failed"])).count(),
    }
    todo_bids = db.query(L).filter(L.kind == "bid", L.status.in_(["review", "active", "pending_result"])).order_by(L.id).all()
    return page(request, "admin_home.html", db, stats=stats, todo_bids=todo_bids, state=STATE, price=logic.get_settings(db),
                stock_csv=str(STOCK_CSV), top_bid=logic.top_bid)


@app.post("/admin/settings")
@need_broker
def admin_settings(request: Request, margin_pct: float = Form(...), fx_rate: float = Form(...),
                   cost_per_unit: float = Form(0), db: Session = Depends(get_db)):
    logic.save_settings(db, margin_pct=margin_pct, fx_rate=fx_rate, cost_per_unit=cost_per_unit)
    return go(request, "/admin", f"기본값 저장: 마진 {margin_pct:g}% · 환율 {fx_rate:,.0f}원 · 개당 부대비용 {cost_per_unit:,.0f}원")


def _price_form(margin_pct, fx_rate, cost_per_unit, db) -> dict:
    """폼 값이 비면 저장된 기본값, 있으면 그 값을 쓰고 새 기본값으로 저장."""
    d = logic.get_settings(db)
    f = lambda v, k: d[k] if v in (None, "") else float(str(v).replace(",", ""))
    vals = {"margin_pct": f(margin_pct, "margin_pct"), "fx_rate": f(fx_rate, "fx_rate"), "cost_per_unit": f(cost_per_unit, "cost_per_unit")}
    logic.save_settings(db, **vals)
    return vals


def _apply_price(l: models.Listing, pv: dict, override: str = "") -> None:
    l.margin_pct, l.fx_rate, l.cost_per_unit = pv["margin_pct"], pv["fx_rate"], int(pv["cost_per_unit"])
    l.price = logic._to_int(override) or logic.start_price(l.partner_price, l.partner_currency, pv["fx_rate"], pv["margin_pct"], pv["cost_per_unit"])


@app.post("/admin/sync")
@need_broker
def admin_sync(request: Request, db: Session = Depends(get_db)):
    run_sync()
    r = STATE["last_sync_result"] or {}
    if r.get("error"):
        return go(request, "/admin", r["error"])
    return go(request, "/admin", f"재고 동기화: {r['rows']}행, 신규 {r['added']}, 변경 {r['updated']}, 재입고 {r['restocked']}, 알림 {r['notified']}건")


# ── 고객 관리 ──

@app.get("/admin/users", response_class=HTMLResponse)
@need_broker
def admin_users(request: Request, status: str = "pending", q: str = "", db: Session = Depends(get_db)):
    qry = db.query(models.User).filter_by(role="customer")
    if status != "all":
        qry = qry.filter_by(status=status)
    users = qry.order_by(models.User.id.desc()).all()
    if q:
        users = [u for u in users if q.lower() in f"{u.company} {u.name} {u.login_id}".lower()]
    return page(request, "admin_users.html", db, users=users, status=status, q=q)


@app.post("/admin/users/{uid}")
@need_broker
def admin_user_update(uid: int, request: Request, action: str = Form(...), memo: str = Form(None),
                      db: Session = Depends(get_db)):
    u = db.get(models.User, uid)
    if u is None or u.role != "customer":
        return go(request, "/admin/users")
    if action == "approve":
        u.status = "approved"
        notify.enqueue(db, u, "signup_approved", {"#{링크}": notify.site_url("/my")})
        msg = f"{u.company} {u.name} 승인"
    elif action == "reject":
        u.status, msg = "rejected", f"{u.company} {u.name} 반려"
    elif action == "history":
        u.has_history = not u.has_history
        msg = f"{u.name} 거래이력 {'있음' if u.has_history else '없음'}으로 변경"
    elif action == "memo":
        u.internal_memo, msg = (memo or "").strip(), "메모 저장"
    else:
        msg = None
    db.commit()
    return go(request, request.headers.get("referer") or "/admin/users", msg)


@app.get("/admin/users/import", response_class=HTMLResponse)
@need_broker
def admin_import_form(request: Request, db: Session = Depends(get_db)):
    return page(request, "admin_import.html", db, rows=None)


@app.get("/admin/users/import/template")
@need_broker
def admin_import_template(request: Request, db: Session = Depends(get_db)):
    return _xlsx_response(logic.CUSTOMER_TEMPLATE_HEADERS, ["예시상사", "홍길동", "010-1234-5678", "", "", ""], "기존고객_양식.xlsx")


@app.post("/admin/users/import/preview", response_class=HTMLResponse)
@need_broker
async def admin_import_preview(request: Request, file: UploadFile = File(...), db: Session = Depends(get_db)):
    rows, err = logic.parse_customer_excel(await file.read())
    existing = {u.login_id for u in db.query(models.User.login_id).all()}
    for r in rows:
        if not r["error"] and r["phone"] in existing:
            r["error"] = "이미 등록된 번호"
    valid = [r for r in rows if not r["error"]]
    return page(request, "admin_import.html", db, rows=rows, err=err,
                rows_json=html.escape(json.dumps(valid, ensure_ascii=False), quote=True))


@app.post("/admin/users/import/confirm")
@need_broker
def admin_import_confirm(request: Request, rows_json: str = Form(...), send_invite: str = Form(""),
                         db: Session = Depends(get_db)):
    rows = json.loads(rows_json)
    made = 0
    for r in rows:
        if db.query(models.User).filter_by(login_id=r["phone"]).first():
            continue
        temp = f"{secrets.randbelow(10**6):06d}"
        u = models.User(login_id=r["phone"], password_hash=hash_password(temp), name=r["name"], company=r["company"],
                        email=r["email"], biz_no=r["biz_no"], internal_memo=r["memo"], status="approved", has_history=True)
        u.interests.append(models.Interest(category="전체", keyword=""))
        db.add(u)
        db.flush()
        if send_invite:
            notify.enqueue(db, u, "invite", {"#{아이디}": u.phone, "#{비밀번호}": temp, "#{링크}": notify.site_url("/login")})
        made += 1
    db.commit()
    return go(request, "/admin/users?status=approved",
              f"기존 고객 {made}명 등록 (거래이력 있음, 관심품목 '전체')" + (" · 초대 알림톡 대기열에 추가" if send_invite else ""))


# ── 상품 관리 ──

@app.get("/admin/listings", response_class=HTMLResponse)
@need_broker
def admin_listings(request: Request, kind: str = "bid", status: str = "", q: str = "", db: Session = Depends(get_db)):
    qry = db.query(models.Listing).filter_by(kind=kind)
    if status:
        qry = qry.filter_by(status=status)
    items = qry.order_by(models.Listing.id.desc()).all()
    if q:
        items = [l for l in items if q.lower() in f"{l.title} {l.source} {l.source_ref}".lower()]
    return page(request, "admin_listings.html", db, items=items, kind=kind, status=status, q=q, top_bid=logic.top_bid)


def _bid_schedule(start: str, hours: float, priority_hours: float):
    s = logic._to_dt(start.replace("T", " ")) if start else None
    s = s or datetime.now()
    return s, s + timedelta(hours=priority_hours), s + timedelta(hours=hours)


@app.get("/admin/listings/new", response_class=HTMLResponse)
@need_broker
def admin_new(request: Request, db: Session = Depends(get_db)):
    return page(request, "admin_listing_form.html", db, l=None, partners=_partners(db), price=logic.get_settings(db),
                defaults={"hours": DEFAULT_BID_HOURS, "priority": DEFAULT_PRIORITY_HOURS})


@app.post("/admin/listings/new")
@need_broker
def admin_new_save(request: Request, category: str = Form(...), title: str = Form(...), quantity: int = Form(...),
                   description: str = Form(""), partner_price: str = Form(""), currency: str = Form("USD"),
                   price: str = Form(""), margin_pct: str = Form(""), fx_rate: str = Form(""), cost_per_unit: str = Form(""),
                   source: str = Form("퀵솔"), partner_id: int = Form(0),
                   source_ref: str = Form(""), partner_deadline: str = Form(""), start: str = Form(""),
                   hours: float = Form(DEFAULT_BID_HOURS), priority_hours: float = Form(DEFAULT_PRIORITY_HOURS),
                   db: Session = Depends(get_db)):
    s, p, e = _bid_schedule(start, hours, priority_hours)
    partner = db.get(models.User, partner_id) if partner_id else None
    l = models.Listing(kind="bid", category=category, title=title.strip(), quantity=quantity,
                       description=description.strip(), status="active",
                       partner_price=logic.parse_price(partner_price), partner_currency=currency,
                       source=partner.company if partner else source.strip(), partner_id=partner.id if partner else None,
                       source_ref=source_ref.strip(),
                       partner_deadline=logic._to_dt(partner_deadline.replace("T", " ")),
                       bid_start=s, priority_until=p, bid_end=e)
    _apply_price(l, _price_form(margin_pct, fx_rate, cost_per_unit, db), price)
    db.add(l)
    db.commit()
    background_tick()
    return go(request, f"/admin/bids/{l.id}", "비딩을 등록했습니다.")


@app.get("/admin/listings/{lid}/edit", response_class=HTMLResponse)
@need_broker
def admin_edit(lid: int, request: Request, db: Session = Depends(get_db)):
    l = db.get(models.Listing, lid)
    return page(request, "admin_listing_form.html", db, l=l, defaults={}, partners=_partners(db), price=logic.get_settings(db))


@app.post("/admin/listings/{lid}/edit")
@need_broker
def admin_edit_save(lid: int, request: Request, title: str = Form(...), category: str = Form(...),
                    quantity: int = Form(...), description: str = Form(""), price: str = Form(""),
                    source: str = Form(""), source_ref: str = Form(""), partner_deadline: str = Form(""),
                    bid_end: str = Form(""), action: str = Form("save"), db: Session = Depends(get_db)):
    l = db.get(models.Listing, lid)
    if l is None:
        return go(request, "/admin/listings")
    if action == "cancel" and l.kind == "bid":
        l.status = "cancelled"
        db.commit()
        return go(request, f"/admin/listings?kind=bid", f"#{l.id} 비딩을 취소했습니다.")
    if action in ("hide", "show") and l.kind == "stock":
        l.status = "hidden" if action == "hide" else ("on_sale" if l.quantity > 0 else "sold_out")
        db.commit()
        return go(request, f"/admin/listings?kind=stock", f"#{l.id} {'숨김' if action == 'hide' else '다시 표시'}")
    l.title, l.category, l.description = title.strip(), category, description.strip()
    if l.kind == "bid":
        l.quantity, l.price = quantity, logic._to_int(price)
        l.source, l.source_ref = source.strip(), source_ref.strip()
        l.partner_deadline = logic._to_dt(partner_deadline.replace("T", " "))
        new_end = logic._to_dt(bid_end.replace("T", " "))
        if new_end and new_end != l.bid_end:
            l.bid_end = new_end
            l.notified_closing = False
            if l.status in ("pending_result", "failed") and new_end > datetime.now():
                l.status = "active"  # 마감 연장으로 재개
    db.commit()
    return go(request, f"/admin/bids/{l.id}" if l.kind == "bid" else "/admin/listings?kind=stock", "저장했습니다.")


# ── 비딩 취합·응찰·결과 ──

@app.get("/admin/bids/{lid}", response_class=HTMLResponse)
@need_broker
def admin_bid(lid: int, request: Request, db: Session = Depends(get_db)):
    l = db.get(models.Listing, lid)
    if l is None or l.kind != "bid":
        return go(request, "/admin/listings")
    bids = sorted(l.bids, key=lambda b: (-b.unit_price, b.id))
    best = {}
    for b in bids:
        best.setdefault(b.user_id, b)
    top = logic.top_bid(l)
    calc = logic.partner_bid_usd(top.unit_price if top else 0, l.fx_rate, l.margin_pct, l.cost_per_unit)
    sent = db.query(models.Notification).filter_by(listing_id=l.id).count()
    pv = logic.get_settings(db)
    preview = logic.start_price(l.partner_price, l.partner_currency, pv["fx_rate"], pv["margin_pct"], pv["cost_per_unit"])
    return page(request, "admin_bid.html", db, l=l, bids=bids, best=list(best.values()), top=top, calc=calc, sent=sent,
                price=pv, preview=preview, defaults={"hours": DEFAULT_BID_HOURS, "priority": DEFAULT_PRIORITY_HOURS})


@app.post("/admin/bids/{lid}/publish")
@need_broker
def admin_bid_publish(lid: int, request: Request, action: str = Form(...), start: str = Form(""),
                      hours: float = Form(DEFAULT_BID_HOURS), priority_hours: float = Form(DEFAULT_PRIORITY_HOURS),
                      title: str = Form(""), category: str = Form(""), description: str = Form(""),
                      margin_pct: str = Form(""), fx_rate: str = Form(""), cost_per_unit: str = Form(""),
                      price: str = Form(""), db: Session = Depends(get_db)):
    """업체가 올린 '검토 대기' 건을 마진 반영 시작가로 공개하거나 반려."""
    l = db.get(models.Listing, lid)
    if l is None or l.status != "review":
        return go(request, f"/admin/bids/{lid}", "검토 대기 상태가 아닙니다.")
    if action == "reject":
        l.status = "cancelled"
        db.commit()
        return go(request, "/admin/listings?kind=bid&status=review", f"#{l.id} 반려했습니다.")
    if title.strip():
        l.title = title.strip()
    if category in CATEGORIES:
        l.category = category
    l.description = description.strip()
    _apply_price(l, _price_form(margin_pct, fx_rate, cost_per_unit, db), price)
    l.bid_start, l.priority_until, l.bid_end = _bid_schedule(start, hours, priority_hours)
    l.status = "active"
    db.commit()
    background_tick()
    return go(request, f"/admin/bids/{lid}", f"시작가 {logic.won(l.price) if l.price else '없음'}으로 공개했습니다. 관심 고객에게 알림이 나갑니다.")


@app.post("/admin/bids/{lid}/calc")
@need_broker
def admin_bid_calc(lid: int, request: Request, fx_rate: str = Form(""), margin_pct: str = Form(""),
                   cost_per_unit: str = Form(""), partner_bid_usd: str = Form(""), db: Session = Depends(get_db)):
    l = db.get(models.Listing, lid)
    f = lambda s: float(s.replace(",", "")) if s and s.strip() else None
    l.fx_rate, l.margin_pct = f(fx_rate), f(margin_pct)
    l.cost_per_unit = logic._to_int(cost_per_unit)
    l.partner_bid_usd = f(partner_bid_usd)
    db.commit()
    return go(request, f"/admin/bids/{lid}#calc", "응찰 계산값을 저장했습니다.")


@app.post("/admin/bids/{lid}/result")
@need_broker
def admin_bid_result(lid: int, request: Request, result: str = Form(...), winning_bid_id: int = Form(0),
                     db: Session = Depends(get_db)):
    l = db.get(models.Listing, lid)
    if l is None or l.status not in ("pending_result", "active"):
        return go(request, f"/admin/bids/{lid}", "결과를 넣을 수 있는 상태가 아닙니다.")
    if l.status == "active" and datetime.now() < l.bid_end:
        return go(request, f"/admin/bids/{lid}", "마감 전입니다. 마감 후 또는 마감시각을 앞당긴 뒤 결과를 넣어 주세요.")
    if result == "won" and not l.bids:
        return go(request, f"/admin/bids/{lid}", "입찰이 없어 낙찰 처리할 수 없습니다.")
    logic.settle_bid(db, l, result == "won", winning_bid_id or None)
    return go(request, f"/admin/bids/{lid}", "결과를 저장하고 참여 고객에게 알림을 보냈습니다.")


@app.get("/admin/bids-bulk", response_class=HTMLResponse)
@need_broker
def admin_bulk_form(request: Request, db: Session = Depends(get_db)):
    return page(request, "admin_bulk.html", db, rows=None, partners=_partners(db), price=logic.get_settings(db),
                defaults={"hours": DEFAULT_BID_HOURS, "priority": DEFAULT_PRIORITY_HOURS})


@app.get("/admin/bids-bulk/template")
@need_broker
def admin_bulk_template(request: Request, db: Session = Depends(get_db)):
    return _xlsx_response(logic.BID_TEMPLATE_HEADERS,
                          ["서버메모리", "Samsung DDR5 64GB 4800 RDIMM", 100, "신품 벌크", 210, "USD", "퀵솔", "M321R8GA0BB0-CQK", "2026-11-20 17:00"],
                          "비딩등록_양식.xlsx")


@app.post("/admin/bids-bulk/preview", response_class=HTMLResponse)
@need_broker
async def admin_bulk_preview(request: Request, file: UploadFile = File(...), source: str = Form("퀵솔"),
                             partner_id: int = Form(0), currency: str = Form("USD"),
                             margin_pct: str = Form(""), fx_rate: str = Form(""), cost_per_unit: str = Form(""),
                             start: str = Form(""), hours: float = Form(DEFAULT_BID_HOURS),
                             priority_hours: float = Form(DEFAULT_PRIORITY_HOURS), db: Session = Depends(get_db)):
    partner = db.get(models.User, partner_id) if partner_id else None
    if partner is not None and partner.role == "partner":
        source = partner.company
    else:
        partner = None
    rows, err = logic.parse_bid_excel(await file.read(), source.strip() or "퀵솔", currency)
    pv = _price_form(margin_pct, fx_rate, cost_per_unit, db)
    for r in rows:
        r["price"] = logic.start_price(r["partner_price"], r["currency"], pv["fx_rate"], pv["margin_pct"], pv["cost_per_unit"])
    valid = [r for r in rows if not r["error"]]
    s, p, e = _bid_schedule(start, hours, priority_hours)
    sched = {"start": start, "hours": hours, "priority_hours": priority_hours,
             "partner_id": partner.id if partner else None, **pv}
    shown = {"start": "등록 시점" if not start else s.strftime("%Y-%m-%d %H:%M"),
             "priority": f"오픈 후 {priority_hours:g}시간" if not start else p.strftime("%Y-%m-%d %H:%M"),
             "end": f"오픈 후 {hours:g}시간 ({e.strftime('%m/%d %H:%M')}경)" if not start else e.strftime("%Y-%m-%d %H:%M")}
    return page(request, "admin_bulk.html", db, rows=rows, err=err, sched=shown, defaults={}, partners=_partners(db),
                partner=partner, price=pv,
                rows_json=html.escape(json.dumps(valid, ensure_ascii=False), quote=True),
                sched_json=html.escape(json.dumps(sched), quote=True))


@app.post("/admin/bids-bulk/confirm")
@need_broker
def admin_bulk_confirm(request: Request, rows_json: str = Form(...), sched_json: str = Form(...),
                       db: Session = Depends(get_db)):
    rows, sched = json.loads(rows_json), json.loads(sched_json)
    s, p, e = _bid_schedule(sched["start"], sched["hours"], sched["priority_hours"])
    for r in rows:
        db.add(models.Listing(kind="bid", category=r["category"], title=r["title"], quantity=r["quantity"],
                              description=r["description"], price=r["price"], status="active",
                              partner_price=r["partner_price"], partner_currency=r["currency"],
                              margin_pct=sched["margin_pct"], fx_rate=sched["fx_rate"], cost_per_unit=int(sched["cost_per_unit"]),
                              source=r["source"], source_ref=r["source_ref"], partner_id=sched.get("partner_id"),
                              partner_deadline=logic._to_dt(r["partner_deadline"] or ""),
                              bid_start=s, priority_until=p, bid_end=e))
    db.commit()
    background_tick()
    return go(request, "/admin/listings?kind=bid", f"비딩 {len(rows)}건을 등록했습니다.")


# ── 비딩 업체(파트너) 계정 ──

def _partners(db):
    return db.query(models.User).filter_by(role="partner").order_by(models.User.id).all()


def _temp_password() -> str:
    alphabet = "abcdefghjkmnpqrstuvwxyz23456789"
    return "".join(secrets.choice(alphabet) for _ in range(10))


@app.get("/admin/partners", response_class=HTMLResponse)
@need_broker
def admin_partners(request: Request, db: Session = Depends(get_db)):
    counts = {}
    for l in db.query(models.Listing).filter(models.Listing.partner_id.isnot(None)).all():
        c = counts.setdefault(l.partner_id, {"all": 0})
        c["all"] += 1
        c[l.status] = c.get(l.status, 0) + 1
    created = request.session.pop("new_partner_pw", None)
    return page(request, "admin_partners.html", db, partners=_partners(db), counts=counts, created=created)


@app.post("/admin/partners")
@need_broker
def admin_partner_create(request: Request, company: str = Form(...), login_id: str = Form(...), name: str = Form(""),
                         phone: str = Form(""), email: str = Form(""), db: Session = Depends(get_db)):
    lid = login_id.strip().lower()
    if len(lid) < 4 or not lid.replace("_", "").replace("-", "").isalnum() or not lid.isascii():
        return go(request, "/admin/partners", "아이디는 영문·숫자 4자 이상으로 정해 주세요.")
    if db.query(models.User).filter_by(login_id=lid).first():
        return go(request, "/admin/partners", f"이미 있는 아이디입니다: {lid}")
    pw = _temp_password()
    u = models.User(login_id=lid, password_hash=hash_password(pw), name=name.strip() or company.strip(),
                    company=company.strip(), email=email.strip(), internal_memo=phone.strip(),
                    role="partner", status="approved", alimtalk_ok=False)
    db.add(u)
    db.commit()
    request.session["new_partner_pw"] = {"company": u.company, "login_id": lid, "password": pw}
    return go(request, "/admin/partners")


@app.post("/admin/partners/{uid}")
@need_broker
def admin_partner_update(uid: int, request: Request, action: str = Form(...), db: Session = Depends(get_db)):
    u = db.get(models.User, uid)
    if u is None or u.role != "partner":
        return go(request, "/admin/partners")
    msg = None
    if action == "reset":
        pw = _temp_password()
        u.password_hash = hash_password(pw)
        request.session["new_partner_pw"] = {"company": u.company, "login_id": u.login_id, "password": pw}
    elif action == "disable":
        u.status, msg = "rejected", f"{u.company} 계정을 정지했습니다."
    elif action == "enable":
        u.status, msg = "approved", f"{u.company} 계정을 다시 열었습니다."
    db.commit()
    return go(request, "/admin/partners", msg)


def need_partner(fn):
    import functools
    import inspect

    def denied(kw):
        request, db = kw["request"], kw["db"]
        if not is_partner(current_user(request, db)):
            return go(request, "/login?next=/partner", "업체 계정으로 로그인해 주세요.")
        return None

    if inspect.iscoroutinefunction(fn):
        @functools.wraps(fn)
        async def awrapper(*a, **kw):
            return denied(kw) or await fn(*a, **kw)
        return awrapper

    @functools.wraps(fn)
    def wrapper(*a, **kw):
        return denied(kw) or fn(*a, **kw)
    return wrapper


def _partner_items(db, user):
    return db.query(models.Listing).filter_by(partner_id=user.id).order_by(models.Listing.id.desc()).all()


@app.get("/partner", response_class=HTMLResponse)
@need_partner
def partner_home(request: Request, db: Session = Depends(get_db)):
    user = current_user(request, db)
    return page(request, "partner.html", db, user=user, items=_partner_items(db, user), rows=None)


@app.get("/partner/template")
@need_partner
def partner_template(request: Request, db: Session = Depends(get_db)):
    return _xlsx_response(["Brand", "Part Number", "Description", "QTY", "Sell Price", "Lead time"],
                          ["Samsung", "M321R8GA0BB0-CQK", "DDR5 RDIMM 64GB 4800", 200, "$210.00", "STOCK"],
                          "bid_items_template.xlsx")


@app.post("/partner/preview", response_class=HTMLResponse)
@need_partner
async def partner_preview(request: Request, file: UploadFile = File(...), deadline: str = Form(""),
                          currency: str = Form("USD"), db: Session = Depends(get_db)):
    user = current_user(request, db)
    rows, err = logic.parse_bid_excel(await file.read(), user.company, currency)
    dl = logic._to_dt(deadline.replace("T", " ")) if deadline else None
    for r in rows:
        r["source"] = user.company
        if not r["partner_deadline"] and dl:
            r["partner_deadline"] = dl.strftime("%Y-%m-%d %H:%M")
    valid = [r for r in rows if not r["error"]]
    return page(request, "partner.html", db, user=user, items=_partner_items(db, user), rows=rows, err=err,
                rows_json=html.escape(json.dumps(valid, ensure_ascii=False), quote=True))


@app.post("/partner/confirm")
@need_partner
def partner_confirm(request: Request, rows_json: str = Form(...), db: Session = Depends(get_db)):
    user = current_user(request, db)
    rows = json.loads(rows_json)
    for r in rows:
        db.add(models.Listing(kind="bid", category=r["category"], title=r["title"], quantity=r["quantity"],
                              description="", status="review", source=user.company, source_ref=r["source_ref"],
                              partner_id=user.id, partner_price=r["partner_price"], partner_currency=r["currency"],
                              partner_deadline=logic._to_dt(r["partner_deadline"] or "")))
    db.commit()
    return go(request, "/partner", f"{len(rows)}건 접수했습니다. 월드메모리 검토 후 진행됩니다.")


# ── 구매요청 ──

@app.get("/admin/orders", response_class=HTMLResponse)
@need_broker
def admin_orders(request: Request, status: str = "requested", db: Session = Depends(get_db)):
    qry = db.query(models.Order)
    if status != "all":
        qry = qry.filter_by(status=status)
    return page(request, "admin_orders.html", db, orders=qry.order_by(models.Order.id.desc()).all(), status=status)


@app.post("/admin/orders/{oid}")
@need_broker
def admin_order_update(oid: int, request: Request, action: str = Form(...), db: Session = Depends(get_db)):
    o = db.get(models.Order, oid)
    if o and o.status == "requested":
        o.status = "confirmed" if action == "confirm" else "cancelled"
        if o.status == "confirmed":
            o.user.has_history = True
        db.commit()
    return go(request, "/admin/orders", f"구매요청 #{oid} {STATUS_LABELS.get(o.status) if o else ''}")


# ── 알림톡 ──

@app.get("/admin/notify", response_class=HTMLResponse)
@need_broker
def admin_notify(request: Request, status: str = "", db: Session = Depends(get_db)):
    qry = db.query(models.Notification)
    if status:
        qry = qry.filter_by(status=status)
    items = qry.order_by(models.Notification.id.desc()).limit(300).all()
    for n in items:
        try:
            n.preview = notify.render(n.kind, json.loads(n.message or "{}"))
        except (KeyError, ValueError):
            n.preview = n.message
    cfg = alimtalk_config()
    checks = {k: bool(cfg.get(k)) for k in ("api_key", "api_secret", "pf_id", "sender_phone")}
    tpl = {k: bool((cfg.get("templates") or {}).get(k)) for k in notify.TEMPLATES}
    return page(request, "admin_notify.html", db, items=items, status=status, checks=checks, tpl=tpl,
                cfg_path=str(ALIMTALK_FILE), site_url=cfg.get("site_url"), templates_text=notify.TEMPLATES)


@app.post("/admin/notify/requeue")
@need_broker
def admin_requeue(request: Request, db: Session = Depends(get_db)):
    n = notify.requeue_unsent(db)
    notify.process_queue(db)
    return go(request, "/admin/notify", f"미발송 {n}건 재시도")


def _xlsx_response(headers, example, filename):
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(headers)
    ws.append(example)
    for i in range(1, len(headers) + 1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width = 20
    buf = io.BytesIO()
    wb.save(buf)
    return Response(buf.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename)}"})
