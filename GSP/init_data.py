"""
초기 데이터 시드 스크립트
실행: python init_data.py
"""
from database import engine, SessionLocal
import models
from models import UserRole, SettlementType, FeeType
import bcrypt

models.Base.metadata.create_all(bind=engine)


def _hash(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


db = SessionLocal()


def seed():
    # ── 슈퍼관리자 ──────────────────────────────
    if not db.query(models.User).filter(models.User.login_id == "admin").first():
        db.add(models.User(
            login_id="admin",
            password_hash=_hash("admin1234"),
            name="슈퍼관리자",
            role=UserRole.SUPER_ADMIN,
        ))
        print("✓ admin 계정 생성")
    else:
        print("- admin 계정 이미 존재")

    db.flush()

    # ── IDC 센터 ────────────────────────────────
    center_names = [
        ("서울 가산 IDC", "서울시 금천구 가산디지털1로", "평일 09:00~18:00"),
        ("부산 센텀 IDC", "부산시 해운대구 센텀서로", "평일 09:00~17:00"),
    ]
    centers = {}
    for name, address, hours in center_names:
        c = db.query(models.IdcCenter).filter(models.IdcCenter.name == name).first()
        if not c:
            c = models.IdcCenter(name=name, address=address, work_hours=hours)
            db.add(c)
            db.flush()
            print(f"✓ IDC 센터: {name}")
        centers[name] = c

    # ── 운영사: 포스라 (4단 정산 구조) ─────
    operator = db.query(models.Operator).filter(models.Operator.operator_code == "WMOPS").first()
    if not operator:
        operator = models.Operator(
            name="포스라",
            business_no="234-56-78901",
            manager_name="김운영",
            manager_phone="010-2345-6789",
            manager_email="kim@wmops.com",
            operator_code="WMOPS",
            fee_type=FeeType.PERCENT,
            fee_value=10.0,
        )
        db.add(operator)
        db.flush()
        print("✓ 운영사: 포스라")
    elif operator.name != "포스라":
        operator.name = "포스라"
        print("✓ 운영사 이름 보정: 포스라")
    else:
        print("- 운영사 포스라 이미 존재")

    # ── 운영사 관리자 계정 ──────────────────────
    if not db.query(models.User).filter(models.User.login_id == "operator1").first():
        db.add(models.User(
            login_id="operator1",
            password_hash=_hash("operator1234"),
            name="운영사관리자",
            role=UserRole.OPERATOR_ADMIN,
            operator_id=operator.id,
        ))
        print("✓ operator1 계정 생성")

    # ── 샘플 딜러 (기존, 운영사 미소속 → 3단: 매입사→딜러→고객, 회귀 테스트 기준) ─
    dealer = db.query(models.Dealer).filter(models.Dealer.dealer_code == "KTDS").first()
    if not dealer:
        dealer = models.Dealer(
            name="KT DS (샘플)",
            business_no="123-45-67890",
            manager_name="홍길동",
            manager_phone="010-1234-5678",
            manager_email="hong@ktds.com",
            dealer_code="KTDS",
            settlement_type=SettlementType.DIRECT,
            fee_type=FeeType.PERCENT,
            fee_value=5.0,
        )
        db.add(dealer)
        db.flush()
        # IDC 센터 연결
        db.add(models.DealerIdcCenter(dealer_id=dealer.id, idc_center_id=centers["서울 가산 IDC"].id))
        print("✓ 딜러: KT DS (3단 정산, 운영사 없음)")
    else:
        print("- 딜러 KT DS 이미 존재")

    # ── 샘플 딜러2 (운영사 소속 → 4단: 매입사→운영사→딜러→고객) ─
    dealer2 = db.query(models.Dealer).filter(models.Dealer.dealer_code == "SFSD2").first()
    if not dealer2:
        dealer2 = models.Dealer(
            operator_id=operator.id,
            name="SFS 딜러 (샘플, 운영사 소속)",
            business_no="345-67-89012",
            manager_name="박딜러",
            manager_phone="010-3456-7890",
            manager_email="park@sfsd2.com",
            dealer_code="SFSD2",
            settlement_type=SettlementType.DIRECT,
            fee_type=FeeType.PERCENT,
            fee_value=5.0,
        )
        db.add(dealer2)
        db.flush()
        db.add(models.DealerIdcCenter(dealer_id=dealer2.id, idc_center_id=centers["서울 가산 IDC"].id))
        print("✓ 딜러2: SFS 딜러 (운영사 소속, 4단 정산)")
    else:
        print("- 딜러2 SFS 딜러 이미 존재")

    # ── 딜러2 관리자 계정 ────────────────────
    if not db.query(models.User).filter(models.User.login_id == "dealer2").first():
        db.add(models.User(
            login_id="dealer2",
            password_hash=_hash("dealer1234"),
            name="딜러2관리자",
            role=UserRole.DEALER_ADMIN,
            dealer_id=dealer2.id,
        ))
        print("✓ dealer2 계정 생성")

    # ── 딜러 관리자 계정 ──────────────────────
    if not db.query(models.User).filter(models.User.login_id == "dealer1").first():
        db.add(models.User(
            login_id="dealer1",
            password_hash=_hash("dealer1234"),
            name="딜러관리자",
            role=UserRole.DEALER_ADMIN,
            dealer_id=dealer.id,
        ))
        print("✓ dealer1 계정 생성")

    # ── 샘플 고객사 ────────────────────────────
    customer = db.query(models.Customer).filter(models.Customer.customer_code == "KAKAO").first()
    if not customer:
        customer = models.Customer(
            dealer_id=dealer.id,
            name="카카오 (샘플)",
            customer_code="KAKAO",
            business_no="120-81-47521",
            manager_name="이순신",
            manager_phone="010-9999-1234",
            default_idc_center_id=centers["서울 가산 IDC"].id,
        )
        db.add(customer)
        db.flush()
        print("✓ 고객사: 카카오")
    else:
        print("- 고객사 카카오 이미 존재")

    # ── 고객사 관리자 계정 ───────────────────
    existing_c1 = db.query(models.User).filter(models.User.login_id == "customer1").first()
    if not existing_c1:
        db.add(models.User(
            login_id="customer1",
            password_hash=_hash("customer1234"),
            name="고객사관리자",
            role=UserRole.CUSTOMER_ADMIN,
            dealer_id=dealer.id,
            customer_id=customer.id,
        ))
        print("✓ customer1 계정 생성")
    elif existing_c1.customer_id is None:
        existing_c1.customer_id = customer.id
        existing_c1.dealer_id = dealer.id
        print("✓ customer1 customer_id 업데이트")

    # ── customer_id 누락된 고객사 역할 유저 일괄 보정 ──
    orphan_users = db.query(models.User).filter(
        models.User.role.in_([UserRole.CUSTOMER_ADMIN, UserRole.CUSTOMER_STAFF]),
        models.User.customer_id == None,
    ).all()
    for u in orphan_users:
        u.customer_id = customer.id
        u.dealer_id = dealer.id
        print(f"✓ {u.login_id} customer_id 보정")

    # ── WM 수거기사 계정 ─────────────────────
    if not db.query(models.User).filter(models.User.login_id == "collector1").first():
        db.add(models.User(
            login_id="collector1",
            password_hash=_hash("collect1234"),
            name="수거기사1",
            role=UserRole.WM_COLLECTOR,
        ))
        print("✓ collector1 계정 생성")

    # ── 샘플 서버 기준가 ─────────────────────
    if db.query(models.ServerPriceRef).count() == 0:
        sample_refs = [
            ("서버", "Dell",   "R740",    "PowerEdge R740",   "2×Xeon Gold 6230 / 128GB",  800000),
            ("서버", "Dell",   "R640",    "PowerEdge R640",   "2×Xeon Silver 4210 / 64GB", 500000),
            ("서버", "HP",     "DL380G9", "ProLiant DL380 G9","2×Xeon E5-2680v4 / 128GB",  600000),
            ("서버", "HP",     "DL360G9", "ProLiant DL360 G9","2×Xeon E5-2620v4 / 64GB",   350000),
            ("서버", "Lenovo", "SR650",   "ThinkSystem SR650","2×Xeon Gold 5118 / 128GB",  700000),
            ("스토리지", "Dell", "ME4024", "PowerVault ME4024","24-bay SAS", 300000),
            ("네트워크장비", "Cisco", "3850",  "Catalyst 3850",   "48-port",    150000),
        ]
        from datetime import datetime
        for cat, mfr, code, disp, spec, price in sample_refs:
            db.add(models.ServerPriceRef(
                category=cat, manufacturer=mfr, model_code=code,
                model_display=disp, spec_summary=spec, base_price=price,
                updated_at=datetime.now(),
            ))
        print(f"✓ 기준가 {len(sample_refs)}개 등록")

    db.commit()
    print("\n✅ 초기 데이터 시드 완료")
    print("\n계정 목록:")
    print("  admin      / admin1234     — 슈퍼관리자 (WM)")
    print("  collector1 / collect1234   — 수거기사   (WM)")
    print("  operator1  / operator1234  — 운영사 관리자 (월드메모리 파트너스)")
    print("  dealer1    / dealer1234    — 딜러 관리자 (KT DS, 3단 정산)")
    print("  dealer2    / dealer1234    — 딜러 관리자 (SFS 딜러, 운영사 소속 4단 정산)")
    print("  customer1  / customer1234  — 고객사 관리자 (카카오)")


if __name__ == "__main__":
    seed()
    db.close()
