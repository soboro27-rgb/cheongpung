from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum


# ─────────────────────────────────────────
# Enums
# ─────────────────────────────────────────

class UserRole(str, enum.Enum):
    SUPER_ADMIN    = "super_admin"    # 월드와이드메모리 슈퍼관리자
    WM_COLLECTOR   = "wm_collector"   # 수거기사
    WM_INSPECTOR   = "wm_inspector"   # 검수자
    DEALER_ADMIN   = "dealer_admin"   # 딜러(호스팅업체) 관리자
    DEALER_STAFF   = "dealer_staff"   # 딜러 직원
    CUSTOMER_ADMIN = "customer_admin" # 고객사 관리자
    CUSTOMER_STAFF = "customer_staff" # 고객사 직원


class SettlementType(str, enum.Enum):
    DIRECT     = "direct"      # 고객 직지급
    VIA_DEALER = "via_dealer"  # 딜러 경유


class FeeType(str, enum.Enum):
    FIXED   = "fixed"    # 건당 정액
    PERCENT = "percent"  # 매각액 %


class AppStatus(str, enum.Enum):
    REQUESTED = "requested"  # 신청접수
    RECEIVED  = "received"   # 접수확인 (WM 확인)
    SCHEDULED = "scheduled"  # 수거예정
    COLLECTED = "collected"  # 수거완료
    QUOTED    = "quoted"     # 단가확정 (잠금 발동)
    APPROVED  = "approved"   # 고객승인
    REJECTED  = "rejected"   # 반려
    WIPED     = "wiped"      # 파기완료
    SETTLED   = "settled"    # 정산완료
    CLOSED    = "closed"     # 종결


class WipeMethod(str, enum.Enum):
    SOFTWARE  = "software"   # 소프트웨어 와이프
    PHYSICAL  = "physical"   # 물리 파기


# ─────────────────────────────────────────
# 마스터 데이터
# ─────────────────────────────────────────

class IdcCenter(Base):
    """IDC 센터 마스터 (고정 수거지)"""
    __tablename__ = "idc_centers"

    id             = Column(Integer, primary_key=True)
    name           = Column(String(100), nullable=False)
    address        = Column(String(300), default="")
    security_notes = Column(Text, default="")       # 반출 절차/보안
    work_hours     = Column(String(200), default="") # 작업 가능 시간대
    contact_name   = Column(String(50), default="")
    contact_phone  = Column(String(20), default="")
    is_active      = Column(Boolean, default=True)
    created_at     = Column(DateTime, default=datetime.now)

    applications = relationship("Application", back_populates="idc_center")
    dealer_links = relationship("DealerIdcCenter", back_populates="idc_center")


class Dealer(Base):
    """딜러(호스팅업체) 마스터"""
    __tablename__ = "dealers"

    id              = Column(Integer, primary_key=True)
    name            = Column(String(100), nullable=False)
    business_no     = Column(String(20), default="")
    manager_name    = Column(String(50), default="")
    manager_phone   = Column(String(20), default="")
    manager_email   = Column(String(100), default="")
    dealer_code     = Column(String(20), unique=True, nullable=False)  # 딜러 코드 (QR용)
    settlement_type = Column(SAEnum(SettlementType), default=SettlementType.DIRECT)
    fee_type        = Column(SAEnum(FeeType), default=FeeType.PERCENT)
    fee_value       = Column(Float, default=0.0)   # 정액(원) 또는 비율(%)
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime, default=datetime.now)

    users        = relationship("User", back_populates="dealer")
    customers    = relationship("Customer", back_populates="dealer")
    applications = relationship("Application", back_populates="dealer")
    idc_links    = relationship("DealerIdcCenter", back_populates="dealer")


class DealerIdcCenter(Base):
    """딜러 ↔ IDC센터 연결 (N:M)"""
    __tablename__ = "dealer_idc_centers"

    id            = Column(Integer, primary_key=True)
    dealer_id     = Column(Integer, ForeignKey("dealers.id"), nullable=False)
    idc_center_id = Column(Integer, ForeignKey("idc_centers.id"), nullable=False)

    dealer     = relationship("Dealer", back_populates="idc_links")
    idc_center = relationship("IdcCenter", back_populates="dealer_links")


class Customer(Base):
    """고객사 마스터 (소속 딜러 FK)"""
    __tablename__ = "customers"

    id                   = Column(Integer, primary_key=True)
    dealer_id            = Column(Integer, ForeignKey("dealers.id"), nullable=False)
    name                 = Column(String(100), nullable=False)
    customer_code        = Column(String(20), unique=True, nullable=False)  # QR용
    business_no          = Column(String(20), default="")
    manager_name         = Column(String(50), default="")
    manager_phone        = Column(String(20), default="")
    manager_email        = Column(String(100), default="")
    default_idc_center_id = Column(Integer, ForeignKey("idc_centers.id"), nullable=True)
    is_active            = Column(Boolean, default=True)
    created_at           = Column(DateTime, default=datetime.now)

    dealer       = relationship("Dealer", back_populates="customers")
    default_idc  = relationship("IdcCenter", foreign_keys=[default_idc_center_id])
    users        = relationship("User", back_populates="customer")
    applications = relationship("Application", back_populates="customer")


# ─────────────────────────────────────────
# 사용자
# ─────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True)
    login_id      = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name          = Column(String(50), nullable=False)
    email         = Column(String(100), default="")
    phone         = Column(String(20), default="")
    role          = Column(SAEnum(UserRole), nullable=False)

    # 소속 (역할에 따라 하나만 채움)
    dealer_id   = Column(Integer, ForeignKey("dealers.id"),   nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)

    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    last_login = Column(DateTime, nullable=True)

    dealer   = relationship("Dealer",   back_populates="users")
    customer = relationship("Customer", back_populates="users")


# ─────────────────────────────────────────
# 신청 건
# ─────────────────────────────────────────

class Application(Base):
    __tablename__ = "applications"

    id            = Column(Integer, primary_key=True)
    customer_id   = Column(Integer, ForeignKey("customers.id"), nullable=False)
    dealer_id     = Column(Integer, ForeignKey("dealers.id"),   nullable=False)
    idc_center_id = Column(Integer, ForeignKey("idc_centers.id"), nullable=True)
    status        = Column(SAEnum(AppStatus), default=AppStatus.REQUESTED)
    title         = Column(String(200), default="")
    notes         = Column(Text, default="")
    contact_name  = Column(String(50), default="")
    contact_phone = Column(String(20), default="")

    submitted_at  = Column(DateTime, nullable=True)
    received_at   = Column(DateTime, nullable=True)
    collected_at  = Column(DateTime, nullable=True)
    quoted_at     = Column(DateTime, nullable=True)
    created_at    = Column(DateTime, default=datetime.now)
    updated_at    = Column(DateTime, default=datetime.now)

    customer   = relationship("Customer",  back_populates="applications")
    dealer     = relationship("Dealer",    back_populates="applications")
    idc_center = relationship("IdcCenter", back_populates="applications")
    assets     = relationship("ServerAsset", back_populates="application", cascade="all, delete-orphan")
    schedule   = relationship("VisitSchedule", back_populates="application", uselist=False, cascade="all, delete-orphan")
    settlement = relationship("Settlement",    back_populates="application", uselist=False, cascade="all, delete-orphan")


class ServerAsset(Base):
    """서버 자산 단위"""
    __tablename__ = "server_assets"

    id             = Column(Integer, primary_key=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)

    # 서버 스펙
    manufacturer   = Column(String(50), default="")
    model          = Column(String(100), default="")
    form_factor    = Column(String(20), default="")  # 1U/2U/4U/타워/블레이드
    cpu_count      = Column(Integer, default=1)
    cpu_model      = Column(String(100), default="")
    ram_total_gb   = Column(Integer, default=0)
    ram_config     = Column(String(100), default="")  # 예: 8×32GB DDR4
    storage_config = Column(Text, default="")          # HDD/SSD/NVMe 수량·용량
    raid_config    = Column(String(50), default="")
    nic_info       = Column(String(100), default="")
    psu_redundant  = Column(Boolean, default=False)
    serial_number  = Column(String(100), default="")
    asset_tag      = Column(String(100), default="")   # 고객 자산번호
    rack_location  = Column(String(100), default="")
    quantity       = Column(Integer, default=1)

    # 상태
    age_years      = Column(Integer, nullable=True)
    condition_grade = Column(String(10), default="중")  # 상/중/하
    parts_missing  = Column(Boolean, default=False)
    is_functional  = Column(Boolean, default=True)
    description    = Column(Text, default="")

    # 데이터 파기
    data_wipe_required = Column(Boolean, default=True)
    wipe_method        = Column(SAEnum(WipeMethod), default=WipeMethod.SOFTWARE)
    on_site_wipe       = Column(Boolean, default=False)  # 현장 파기 여부
    cert_required      = Column(Boolean, default=True)

    # 단가
    unit_price_estimated  = Column(Float, default=0.0)
    unit_price_confirmed  = Column(Float, default=0.0)

    # QR 식별자: YYYY_MMDD_딜러코드_고객코드_번호
    qr_code  = Column(String(50), default="")

    # 잠금 (단가확정 후)
    is_locked  = Column(Boolean, default=False)
    locked_at  = Column(DateTime, nullable=True)
    locked_by  = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now)

    application = relationship("Application", back_populates="assets")
    edit_logs   = relationship("AssetEditLog", back_populates="asset", cascade="all, delete-orphan")
    wipe_record = relationship("DataWipeRecord", back_populates="asset", uselist=False, cascade="all, delete-orphan")


class AssetEditLog(Base):
    """단가확정 후 수정이력 로그"""
    __tablename__ = "asset_edit_logs"

    id         = Column(Integer, primary_key=True)
    asset_id   = Column(Integer, ForeignKey("server_assets.id"), nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=True)
    field_name = Column(String(50), default="")
    old_value  = Column(Text, default="")
    new_value  = Column(Text, default="")
    changed_at = Column(DateTime, default=datetime.now)

    asset = relationship("ServerAsset", back_populates="edit_logs")
    user  = relationship("User", foreign_keys=[user_id])


# ─────────────────────────────────────────
# 수거 일정
# ─────────────────────────────────────────

class VisitSchedule(Base):
    __tablename__ = "visit_schedules"

    id             = Column(Integer, primary_key=True)
    application_id = Column(Integer, ForeignKey("applications.id"), unique=True, nullable=False)
    visit_date     = Column(String(20), default="")
    visit_time     = Column(String(10), default="")
    collector_name = Column(String(50), default="")
    collector_phone = Column(String(20), default="")
    notes          = Column(Text, default="")
    confirmed      = Column(Boolean, default=False)
    confirmed_at   = Column(DateTime, nullable=True)
    created_at     = Column(DateTime, default=datetime.now)

    application = relationship("Application", back_populates="schedule")


# ─────────────────────────────────────────
# 데이터 파기
# ─────────────────────────────────────────

class DataWipeRecord(Base):
    __tablename__ = "data_wipe_records"

    id              = Column(Integer, primary_key=True)
    asset_id        = Column(Integer, ForeignKey("server_assets.id"), unique=True, nullable=False)
    wipe_date       = Column(String(20), default="")
    wipe_method     = Column(SAEnum(WipeMethod), default=WipeMethod.SOFTWARE)
    is_on_site      = Column(Boolean, default=False)
    technician_name = Column(String(50), default="")
    technician_company = Column(String(100), default="")
    cert_number     = Column(String(100), default="")
    cert_file_path  = Column(String(255), default="")  # 생성된 PDF 경로
    notes           = Column(Text, default="")
    created_at      = Column(DateTime, default=datetime.now)
    updated_at      = Column(DateTime, default=datetime.now)

    asset = relationship("ServerAsset", back_populates="wipe_record")


# ─────────────────────────────────────────
# 정산
# ─────────────────────────────────────────

class Settlement(Base):
    __tablename__ = "settlements"

    id              = Column(Integer, primary_key=True)
    application_id  = Column(Integer, ForeignKey("applications.id"), unique=True, nullable=False)
    settlement_type = Column(SAEnum(SettlementType), nullable=False)

    # 금액 레이어
    total_amount        = Column(Float, default=0.0)  # 매입 합계 (확정단가 × 수량)
    dealer_fee_amount   = Column(Float, default=0.0)  # 딜러 수수료
    customer_amount     = Column(Float, default=0.0)  # 고객 수령 금액

    # 정산 상태
    wm_paid          = Column(Boolean, default=False)   # WM→고객(직지급) or WM→딜러(경유)
    wm_paid_at       = Column(DateTime, nullable=True)
    dealer_paid      = Column(Boolean, default=False)   # 딜러→고객 (경유 방식)
    dealer_paid_at   = Column(DateTime, nullable=True)

    # 세금계산서 메모
    tax_invoice_notes = Column(Text, default="")
    evidence_file     = Column(String(255), default="")  # 증빙 첨부
    pricing_notes     = Column(Text, default="")
    created_at        = Column(DateTime, default=datetime.now)

    application = relationship("Application", back_populates="settlement")


# ─────────────────────────────────────────
# 서버 시세 기준표 (mgit AssetPriceRef 구조 재사용)
# ─────────────────────────────────────────

class ServerPriceRef(Base):
    __tablename__ = "server_price_refs"

    id            = Column(Integer, primary_key=True)
    category      = Column(String(30), nullable=False, index=True)  # 서버/스토리지/네트워크
    manufacturer  = Column(String(50), default="")
    model_code    = Column(String(100), default="")
    model_display = Column(String(300), default="")
    spec_summary  = Column(String(200), default="")  # CPU/RAM 요약
    base_price    = Column(Integer, default=0)
    is_active     = Column(Boolean, default=True)
    updated_at    = Column(DateTime, default=datetime.now)


# ─────────────────────────────────────────
# 로그인 이력 (mgit LoginLog 재사용)
# ─────────────────────────────────────────

class LoginLog(Base):
    __tablename__ = "login_logs"

    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=True)
    login_id   = Column(String(50), default="")
    role       = Column(String(30), default="")
    action     = Column(String(20), default="")  # login_success / login_failed / logout
    ip_address = Column(String(50), default="")
    user_agent = Column(String(300), default="")
    created_at = Column(DateTime, default=datetime.now)

    user = relationship("User", foreign_keys=[user_id])


class SystemConfig(Base):
    __tablename__ = "system_configs"

    id         = Column(Integer, primary_key=True)
    key        = Column(String(50), unique=True, nullable=False)
    value      = Column(String(200), default="")
    updated_at = Column(DateTime, default=datetime.now)
