#!/bin/bash
set -e

echo "=== DB 초기화 ==="
python -c "
from database import engine
import models
models.Base.metadata.create_all(bind=engine)
print('테이블 생성 완료')
"

echo "=== 초기 계정 확인 ==="
python -c "
from database import SessionLocal
import models
db = SessionLocal()
admin = db.query(models.User).filter(models.User.login_id == 'admin').first()
if not admin:
    import bcrypt
    db.add(models.User(
        login_id='admin',
        password_hash=bcrypt.hashpw(b'admin1234', bcrypt.gensalt()).decode(),
        name='슈퍼관리자',
        role=models.UserRole.SUPER_ADMIN,
    ))
    db.commit()
    print('admin 계정 생성')
else:
    print('admin 계정 이미 존재')
db.close()
"

echo "=== 서버 시작 ==="
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
