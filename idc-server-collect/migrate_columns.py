"""
기존 테이블에 신규 컬럼(운영사 계층) 추가하는 마이그레이션.
start.sh에서 init_data.py보다 먼저 실행되어야 한다 (시드 스크립트가
이미 새 컬럼을 참조하는 User/Dealer/Settlement 모델로 쿼리하기 때문).
"""
from database import engine
from sqlalchemy import text, inspect


def _add_column_if_missing(table: str, column: str, ddl_type: str):
    try:
        cols = [c["name"] for c in inspect(engine).get_columns(table)]
        if column in cols:
            print(f"[migrate] {table}.{column} 이미 존재, 스킵", flush=True)
            return
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type}"))
        print(f"[migrate] {table}.{column} 컬럼 추가 완료", flush=True)
    except Exception as e:
        print(f"[migrate] {table}.{column} 추가 실패: {type(e).__name__}: {e}", flush=True)


def run_migrations():
    _add_column_if_missing("dealers", "operator_id", "INTEGER")
    _add_column_if_missing("users", "operator_id", "INTEGER")
    _add_column_if_missing("settlements", "operator_fee_amount", "FLOAT DEFAULT 0.0")
    _add_column_if_missing("settlements", "operator_paid", "BOOLEAN DEFAULT FALSE")
    _add_column_if_missing("settlements", "operator_paid_at", "TIMESTAMP")


if __name__ == "__main__":
    run_migrations()
