"""관심품목 매칭 · 재고 동기화 · 비딩 진행 · 엑셀 파싱."""
import csv
import io
import re
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

import models
import notify
from config import CATEGORIES, CLOSING_NOTICE_HOURS, STOCK_CSV


# ── 표시용 ──────────────────────────────────────────────

def won(n) -> str:
    return "-" if n is None else f"{int(n):,}원"


def fmt_dt(d) -> str:
    return "-" if d is None else d.strftime("%m/%d %H:%M")


# ── 관심품목 매칭 ───────────────────────────────────────

def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").lower())


def matches(listing: models.Listing, interest: models.Interest) -> bool:
    if interest.category not in ("전체", listing.category):
        return False
    hay = _norm(f"{listing.title} {listing.description}")
    return all(tok in hay for tok in _norm(interest.keyword).split())


def interested_customers(db: Session, listing: models.Listing, history_only: bool | None = None):
    q = db.query(models.User).filter_by(role="customer", status="approved")
    if history_only is True:
        q = q.filter_by(has_history=True)
    elif history_only is False:
        q = q.filter_by(has_history=False)
    return [u for u in q.all() if any(matches(listing, i) for i in u.interests)]


# ── 고객 노출 규칙 ──────────────────────────────────────

def can_see(listing: models.Listing, user, now: datetime | None = None) -> bool:
    now = now or datetime.now()
    if user is not None and user.role == "broker":
        return True
    if listing.kind == "stock":
        return listing.status == "on_sale"
    if listing.status in ("cancelled", "review"):
        return False
    if listing.bid_start and now < listing.bid_start:
        return False
    if listing.status == "active" and listing.priority_until and now < listing.priority_until:
        return user is not None and user.has_history and user.status == "approved"
    return True


def top_bid(listing: models.Listing):
    return max(listing.bids, key=lambda b: (b.unit_price, -b.id), default=None)


def user_bids(listing: models.Listing, user):
    return sorted([b for b in listing.bids if user and b.user_id == user.id], key=lambda b: b.seq)


# ── 재고 동기화 (product_data.csv → 즉시판매) ───────────

def _category(raw: str) -> str:
    return raw if raw in CATEGORIES else "기타"


def sync_stock(db: Session) -> dict:
    if not STOCK_CSV.exists():
        return {"error": f"재고 파일 없음: {STOCK_CSV}"}
    with open(STOCK_CSV, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))

    existing = {l.stock_key: l for l in db.query(models.Listing).filter_by(kind="stock").all()}
    first_run = not existing
    seen, added, updated, restocked = set(), 0, 0, []

    for r in rows:
        cat, maker, spec = (r.get("분류") or "").strip(), (r.get("제조사") or "").strip(), (r.get("규격") or "").strip()
        if not spec:
            continue
        key = f"{cat}|{maker}|{spec}"
        seen.add(key)
        try:
            qty = int(float(r.get("수량") or 0))
        except ValueError:
            qty = 0
        try:
            price = int(float(r.get("별도가") or 0)) or None
        except ValueError:
            price = None
        selling = (r.get("상태") or "").strip() == "대기" and qty > 0
        title = f"{maker} {spec}".strip()
        desc = (r.get("상세내용") or "").strip()  # 메모 컬럼은 내부 기록이라 가져오지 않음

        l = existing.get(key)
        if l is None:
            l = models.Listing(kind="stock", category=_category(cat), title=title, description=desc,
                               quantity=qty, price=price, status="on_sale" if selling else "sold_out",
                               source="자사재고", stock_key=key)
            db.add(l)
            added += 1
            if selling:
                restocked.append(l)
            continue
        was_selling = l.status == "on_sale"
        changed = (l.quantity, l.price, l.title, l.description) != (qty, price, title, desc)
        l.quantity, l.price, l.title, l.description = qty, price, title, desc
        if l.status != "hidden":  # 관리자가 숨긴 품목은 숨김 유지
            l.status = "on_sale" if selling else "sold_out"
            if selling and not was_selling:
                restocked.append(l)
        if changed:
            updated += 1

    gone = 0
    for key, l in existing.items():
        if key not in seen and l.status == "on_sale":
            l.status, l.quantity = "sold_out", 0
            gone += 1
    db.flush()

    notified = 0
    if not first_run:  # 첫 동기화는 전체가 '신규'라 알림 폭탄이 되므로 건너뜀
        for l in restocked:
            for u in interested_customers(db, l):
                if notify.enqueue(db, u, "new_stock", {
                    "#{품목}": l.title, "#{수량}": l.quantity, "#{가격}": won(l.price) + " (VAT별도)",
                    "#{링크}": notify.site_url(f"/item/{l.id}"),
                }, listing=l, dedupe=False):
                    notified += 1
    db.commit()
    return {"rows": len(rows), "added": added, "updated": updated, "restocked": len(restocked),
            "gone": gone, "notified": notified, "first_run": first_run}


# ── 비딩 진행 (백그라운드 루프에서 1분마다) ─────────────

def _bid_vars(l: models.Listing) -> dict:
    return {"#{품목}": l.title, "#{수량}": l.quantity, "#{마감}": l.bid_end.strftime("%m/%d %H:%M"),
            "#{링크}": notify.site_url(f"/item/{l.id}")}


def tick_bids(db: Session, now: datetime | None = None) -> None:
    now = now or datetime.now()
    for l in db.query(models.Listing).filter_by(kind="bid", status="active").all():
        if l.bid_start and now < l.bid_start:
            continue
        in_priority = l.priority_until and now < l.priority_until
        if not l.notified_open:
            for u in interested_customers(db, l, history_only=True if in_priority else None):
                notify.enqueue(db, u, "bid_open", _bid_vars(l), listing=l, dedupe=True)
            l.notified_open = True
            l.notified_all = not in_priority
        if not in_priority and not l.notified_all:
            for u in interested_customers(db, l, history_only=False):
                notify.enqueue(db, u, "bid_open", _bid_vars(l), listing=l, dedupe=True)
            l.notified_all = True
        if not l.notified_closing and now >= l.bid_end - timedelta(hours=CLOSING_NOTICE_HOURS) and now < l.bid_end:
            targets = {u.id: u for u in interested_customers(db, l)}
            for b in l.bids:
                targets[b.user_id] = b.user
            for u in targets.values():
                notify.enqueue(db, u, "bid_closing", _bid_vars(l), listing=l, dedupe=True)
            l.notified_closing = True
        if now >= l.bid_end:
            l.status = "pending_result" if l.bids else "failed"
    db.commit()


PRICE_DEFAULTS = {"margin_pct": "10", "fx_rate": "1400", "cost_per_unit": "0"}


def get_settings(db: Session) -> dict:
    vals = dict(PRICE_DEFAULTS)
    for s in db.query(models.Setting).all():
        vals[s.key] = s.value
    return {k: float(v or 0) for k, v in vals.items()}


def save_settings(db: Session, **kw) -> None:
    for k, v in kw.items():
        if v is None:
            continue
        s = db.get(models.Setting, k) or models.Setting(key=k)
        s.value = str(v)
        db.add(s)
    db.commit()


def start_price(partner_price, currency: str | None, fx: float, margin_pct: float, cost: float) -> int | None:
    """업체 공급가 → 고객 시작가(원, 1,000원 단위 올림): 공급가×환율 + 부대비용, 거기에 마진."""
    if not partner_price:
        return None
    krw = partner_price * (fx if (currency or "USD") == "USD" else 1)
    total = (krw + (cost or 0)) * (1 + (margin_pct or 0) / 100)
    return int(-(-total // 1000) * 1000)


def parse_price(s: str):
    """'Sell-$560.00', '$1,200', '560' → 560.0 / 'Sell-$BID', 'CALL', '' → None."""
    m = re.search(r"\d[\d,]*(?:\.\d+)?", s or "")
    return float(m.group().replace(",", "")) if m else None


def partner_bid_usd(top_unit_krw: int, fx: float, margin_pct: float, cost: int) -> float | None:
    """고객 최고 단가에서 마진·부대비용을 빼고 환율로 나눈 파트너 응찰 단가(USD)."""
    if not top_unit_krw or not fx:
        return None
    net = top_unit_krw / (1 + (margin_pct or 0) / 100) - (cost or 0)
    return round(max(net, 0) / fx, 2)


def settle_bid(db: Session, l: models.Listing, won_: bool, winning_bid_id: int | None) -> None:
    bidders = {b.user_id: b.user for b in l.bids}
    if won_:
        win = next((b for b in l.bids if b.id == winning_bid_id), None) or top_bid(l)
        l.status, l.winning_bid_id = "won", win.id
        win.user.has_history = True
        for uid, u in bidders.items():
            result = f"낙찰 (개당 {won(win.unit_price)}, {win.quantity}개)" if uid == win.user_id else "다른 고객에게 낙찰되었습니다"
            notify.enqueue(db, u, "bid_result", {"#{품목}": l.title, "#{결과}": result,
                                                 "#{링크}": notify.site_url(f"/item/{l.id}")}, listing=l)
    else:
        l.status = "lost"
        for u in bidders.values():
            notify.enqueue(db, u, "bid_result", {"#{품목}": l.title, "#{결과}": "이번 건은 성사되지 않았습니다",
                                                 "#{링크}": notify.site_url(f"/item/{l.id}")}, listing=l)
    db.commit()


# ── 엑셀 파싱 (비딩 일괄등록 / 기존고객 일괄등록) ──────

def _sheet_rows(data: bytes):
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(data), data_only=True, read_only=True)
    ws = wb.worksheets[0]
    rows = [[("" if c is None else str(c).strip()) for c in r] for r in ws.iter_rows(values_only=True)]
    rows = [r for r in rows if any(r)]
    return rows


def _guess_category(text: str) -> str:
    t = text.upper()
    if "SSD" in t or "NVME" in t or "U.2" in t or "U.3" in t or "HDD" in t:
        return "SSD/스토리지"
    if "DIMM" in t or "DDR" in t:
        return "서버메모리"
    if "XEON" in t or "EPYC" in t:
        return "서버CPU"
    if "GPU" in t or "RTX" in t or "TESLA" in t:
        return "그래픽카드"
    return "기타"


def _to_int(s: str):
    s = re.sub(r"[^\d.]", "", s or "")
    return int(float(s)) if s else None


def _to_dt(s: str):
    s = (s or "").strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d", "%Y.%m.%d %H:%M", "%Y.%m.%d"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            pass
    return None


BID_TEMPLATE_HEADERS = ["분류", "품목명", "수량", "설명", "공급가", "통화", "소싱처", "소싱품번", "파트너마감"]


def parse_bid_excel(data: bytes, default_source: str, default_currency: str = "USD") -> tuple[list[dict], str]:
    """우리 양식 또는 퀵솔 원본 양식(Brand / Part Number / Description / QTY)을 읽는다."""
    rows = _sheet_rows(data)
    hi = next((i for i, r in enumerate(rows[:10]) if {"품목명", "수량"} <= set(r) or {"Part Number", "Description"} <= set(r)), None)
    if hi is None:
        return [], "헤더를 찾지 못했습니다. 양식(품목명·수량) 또는 퀵솔 원본(Part Number·Description)인지 확인해 주세요."
    head = rows[hi]
    col = {h: i for i, h in enumerate(head) if h}
    quiksol = "Part Number" in col
    out = []
    for n, r in enumerate(rows[hi + 1:], start=hi + 2):
        g = lambda k: r[col[k]] if k in col and col[k] < len(r) else ""
        if quiksol:
            title = f"{g('Brand')} {g('Description')}".strip()
            raw_price = g("Sell Price") or g("Resell") or g("Price")
            item = {"category": _guess_category(title), "title": title, "quantity": _to_int(g("QTY")),
                    "description": "", "partner_price": parse_price(raw_price),
                    "currency": "KRW" if "₩" in raw_price or "원" in raw_price else "USD",
                    "source": default_source, "source_ref": g("Part Number"), "partner_deadline": None}
        else:
            cat = g("분류") or _guess_category(g("품목명"))
            cur = (g("통화") or default_currency).upper()
            item = {"category": cat if cat in CATEGORIES else "기타", "title": g("품목명"),
                    "quantity": _to_int(g("수량")), "description": g("설명"),
                    "partner_price": parse_price(g("공급가") or g("참고가(원)")),
                    "currency": "KRW" if cur in ("KRW", "원") or (not g("공급가") and g("참고가(원)")) else "USD",
                    "source": g("소싱처") or default_source, "source_ref": g("소싱품번"),
                    "partner_deadline": _to_dt(g("파트너마감"))}
        err = None
        if not item["title"]:
            err = "품목명 없음"
        elif not item["quantity"]:
            err = "수량 없음"
        item.update(row=n, error=err)
        if item["partner_deadline"]:
            item["partner_deadline"] = item["partner_deadline"].strftime("%Y-%m-%d %H:%M")
        out.append(item)
    return out, ""


CUSTOMER_TEMPLATE_HEADERS = ["회사명", "담당자", "휴대폰", "이메일", "사업자번호", "메모"]


def parse_customer_excel(data: bytes) -> tuple[list[dict], str]:
    from auth import normalize_phone
    rows = _sheet_rows(data)
    hi = next((i for i, r in enumerate(rows[:10]) if {"담당자", "휴대폰"} <= set(r)), None)
    if hi is None:
        return [], "헤더(담당자·휴대폰)를 찾지 못했습니다."
    col = {h: i for i, h in enumerate(rows[hi]) if h}
    out = []
    for n, r in enumerate(rows[hi + 1:], start=hi + 2):
        g = lambda k: r[col[k]] if k in col and col[k] < len(r) else ""
        phone = normalize_phone(g("휴대폰"))
        item = {"row": n, "company": g("회사명"), "name": g("담당자"), "phone": phone,
                "email": g("이메일"), "biz_no": g("사업자번호"), "memo": g("메모")}
        item["error"] = None if item["name"] and len(phone) >= 10 else "담당자 또는 휴대폰 번호 확인"
        out.append(item)
    return out, ""
