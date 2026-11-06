from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from db import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    login_id = Column(String(50), unique=True, nullable=False, index=True)  # 휴대폰 숫자만 (관리자는 아이디)
    password_hash = Column(String(200))
    name = Column(String(50), nullable=False)
    company = Column(String(100))
    biz_no = Column(String(20))
    email = Column(String(120))
    role = Column(String(20), default="customer", nullable=False)  # customer / broker / partner(퀵솔 등 비딩 업체)
    status = Column(String(20), default="pending", nullable=False)  # pending / approved / rejected
    has_history = Column(Boolean, default=False, nullable=False)  # 거래이력 → 비딩 선공개 대상
    alimtalk_ok = Column(Boolean, default=True, nullable=False)
    internal_memo = Column(Text)  # 내부용, 고객 화면 노출 금지
    created_at = Column(DateTime, default=datetime.now, nullable=False)

    interests = relationship("Interest", back_populates="user", cascade="all, delete-orphan")

    @property
    def phone(self):
        p = self.login_id or ""
        if p.isdigit() and len(p) >= 10:
            return f"{p[:3]}-{p[3:-4]}-{p[-4:]}"
        return p


class Interest(Base):
    __tablename__ = "interests"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String(30), nullable=False)
    keyword = Column(String(100), default="")  # 공백으로 나눈 단어가 모두 제목에 있으면 매칭
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    user = relationship("User", back_populates="interests")


class Listing(Base):
    __tablename__ = "listings"
    id = Column(Integer, primary_key=True)
    kind = Column(String(10), nullable=False)  # stock(즉시판매) / bid(비딩)
    category = Column(String(30), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    quantity = Column(Integer, default=0, nullable=False)
    price = Column(Integer)  # stock: 개당 판매가(VAT별도) / bid: 참고가(선택)
    # stock: on_sale / hidden / sold_out
    # bid: review(파트너 등록 → 검토 대기) / active / pending_result / won / lost / failed / cancelled
    status = Column(String(20), nullable=False)
    # ── 내부 전용 (고객 화면 노출 금지) ──
    partner_id = Column(Integer, ForeignKey("users.id"))  # 비딩 업체 계정 (파트너 화면에서 자기 건만 봄)
    source = Column(String(50))  # 자사재고 / 퀵솔 ...
    source_ref = Column(String(200))  # 파트너 품번·문서번호
    partner_price = Column(Float)  # 업체 공급가 (개당)
    partner_currency = Column(String(5))  # USD / KRW
    stock_key = Column(String(300), index=True)  # 재고CSV 동기화 키
    partner_deadline = Column(DateTime)
    fx_rate = Column(Float)
    margin_pct = Column(Float)
    cost_per_unit = Column(Integer)  # 운송·통관 등 개당 부대비용(원)
    partner_bid_usd = Column(Float)
    winning_bid_id = Column(Integer, ForeignKey("bids.id", use_alter=True, name="fk_win_bid"))
    # ── 비딩 일정 ──
    bid_start = Column(DateTime)
    priority_until = Column(DateTime)  # 이 시각까지 거래이력 고객만 보임
    bid_end = Column(DateTime)
    notified_open = Column(Boolean, default=False, nullable=False)
    notified_all = Column(Boolean, default=False, nullable=False)
    notified_closing = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    bids = relationship("Bid", back_populates="listing", foreign_keys="Bid.listing_id", cascade="all, delete-orphan")
    winning_bid = relationship("Bid", foreign_keys=[winning_bid_id], post_update=True)
    partner = relationship("User", foreign_keys=[partner_id])


class Setting(Base):
    """관리자 기본값 (마진·환율 등)."""
    __tablename__ = "settings"
    key = Column(String(50), primary_key=True)
    value = Column(String(200))


class Bid(Base):
    __tablename__ = "bids"
    id = Column(Integer, primary_key=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    seq = Column(Integer, nullable=False)
    unit_price = Column(Integer, nullable=False)  # 개당 희망가(원, VAT별도)
    quantity = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    listing = relationship("Listing", back_populates="bids", foreign_keys=[listing_id])
    user = relationship("User")


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Integer, nullable=False)
    note = Column(Text, default="")
    status = Column(String(20), default="requested", nullable=False)  # requested / confirmed / cancelled
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    listing = relationship("Listing")
    user = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    listing_id = Column(Integer, ForeignKey("listings.id"))
    kind = Column(String(30), nullable=False)
    channel = Column(String(20), default="alimtalk", nullable=False)
    status = Column(String(20), nullable=False)  # sent / failed / not_configured
    to = Column(String(30))
    message = Column(Text)
    error = Column(Text)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    user = relationship("User")
    listing = relationship("Listing")
