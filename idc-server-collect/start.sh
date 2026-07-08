#!/bin/bash
set -e

echo "=== DB 초기화 ==="
python -c "
from database import engine
import models
models.Base.metadata.create_all(bind=engine)
print('테이블 생성 완료')
"

echo "=== 컬럼 마이그레이션 ==="
python migrate_columns.py

echo "=== 초기 데이터 시드 ==="
python init_data.py

echo "=== 서버 시작 ==="
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
