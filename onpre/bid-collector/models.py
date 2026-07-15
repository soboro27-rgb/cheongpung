from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()


class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(60), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(60), nullable=False)
    role = db.Column(db.String(20), default='INSPECTOR')  # ADMIN | INSPECTOR
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    inspections = db.relationship('Inspection',
                                  foreign_keys='Inspection.inspector_id',
                                  backref='inspector', lazy=True)
    edits = db.relationship('InspectionEdit',
                            foreign_keys='InspectionEdit.editor_id',
                            backref='editor', lazy=True)

    def set_password(self, pw):
        self.password_hash = generate_password_hash(pw)

    def check_password(self, pw):
        return check_password_hash(self.password_hash, pw)

    @property
    def is_admin(self):
        return self.role == 'ADMIN'

    def get_id(self):
        return str(self.id)


class PurchaseOrder(db.Model):
    __tablename__ = 'purchase_orders'
    id = db.Column(db.Integer, primary_key=True)
    order_no = db.Column(db.String(60), unique=True, nullable=False)
    vendor_name = db.Column(db.String(100), nullable=False)      # 업체명 한글
    vendor_name_en = db.Column(db.String(100), nullable=False)   # 업체명 영문
    manager_last_en = db.Column(db.String(10), nullable=False)   # 담당자 성 영문2자
    purchase_date = db.Column(db.Date, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    memo = db.Column(db.Text)
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    qr_codes = db.relationship('QRCode', backref='order', lazy=True,
                                order_by='QRCode.seq')

    @property
    def locked_count(self):
        return sum(1 for q in self.qr_codes if q.is_locked)

    @property
    def inspected_count(self):
        return sum(1 for q in self.qr_codes if q.inspection is not None)


class QRCode(db.Model):
    __tablename__ = 'qr_codes'
    id = db.Column(db.Integer, primary_key=True)
    qr_string = db.Column(db.String(60), unique=True, nullable=False)
    purchase_order_id = db.Column(db.Integer, db.ForeignKey('purchase_orders.id'))
    seq = db.Column(db.Integer, nullable=False)
    is_locked = db.Column(db.Boolean, default=False)
    locked_at = db.Column(db.DateTime)
    locked_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    inspection = db.relationship('Inspection', backref='qr_code',
                                 uselist=False, lazy=True)
    locked_by = db.relationship('User', foreign_keys=[locked_by_id])


class Inspection(db.Model):
    __tablename__ = 'inspections'
    id = db.Column(db.Integer, primary_key=True)
    qr_id = db.Column(db.Integer, db.ForeignKey('qr_codes.id'), unique=True)
    inspector_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    saved_at = db.Column(db.DateTime, default=datetime.utcnow)

    # B: 제품 스펙
    maker = db.Column(db.String(100))
    model_name = db.Column(db.String(200))
    cpu = db.Column(db.String(100))
    ram = db.Column(db.String(50))
    storage = db.Column(db.String(100))
    vga = db.Column(db.String(100))
    screen_size = db.Column(db.String(30))
    resolution = db.Column(db.String(50))
    lcd_condition = db.Column(db.String(100))
    keyboard_touch = db.Column(db.String(20))   # 정상/불량/없음
    battery_loss_rate = db.Column(db.Float)
    battery_45_checked = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text)

    # C: 상태 평가
    has_adapter = db.Column(db.Boolean)   # O/X
    is_barasi = db.Column(db.Boolean)     # O/X
    quality = db.Column(db.String(10))    # 불량/양품
    grade = db.Column(db.String(5))       # S/A/B/C
    purchase_price = db.Column(db.Integer)

    edits = db.relationship('InspectionEdit', backref='inspection',
                            lazy=True, order_by='InspectionEdit.edited_at.desc()')


class InspectionEdit(db.Model):
    __tablename__ = 'inspection_edits'
    id = db.Column(db.Integer, primary_key=True)
    inspection_id = db.Column(db.Integer, db.ForeignKey('inspections.id'))
    editor_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    edited_at = db.Column(db.DateTime, default=datetime.utcnow)
    field_name = db.Column(db.String(60))
    old_value = db.Column(db.Text)
    new_value = db.Column(db.Text)
