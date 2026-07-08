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


def _add_enum_value_if_missing(enum_type: str, value: str):
    """Postgres 네이티브 enum 타입에 새 값 추가 (SQLite는 enum을 VARCHAR로 다뤄서 해당 없음).
    ALTER TYPE ... ADD VALUE는 옛 Postgres 버전에서 트랜잭션 블록 안에서 실행 불가하므로
    autocommit으로 실행한다."""
    if engine.dialect.name != "postgresql":
        return
    try:
        conn = engine.connect().execution_options(isolation_level="AUTOCOMMIT")
        try:
            conn.execute(text(f"ALTER TYPE {enum_type} ADD VALUE IF NOT EXISTS '{value}'"))
        finally:
            conn.close()
        print(f"[migrate] enum {enum_type}에 '{value}' 추가 완료(또는 이미 존재)", flush=True)
    except Exception as e:
        print(f"[migrate] enum {enum_type}에 '{value}' 추가 실패: {type(e).__name__}: {e}", flush=True)


def run_migrations():
    _add_column_if_missing("dealers", "operator_id", "INTEGER")
    _add_column_if_missing("users", "operator_id", "INTEGER")
    _add_column_if_missing("settlements", "operator_fee_amount", "FLOAT DEFAULT 0.0")
    _add_column_if_missing("settlements", "operator_paid", "BOOLEAN DEFAULT FALSE")
    _add_column_if_missing("settlements", "operator_paid_at", "TIMESTAMP")

    # UserRole enum(Postgres 네이티브 타입)에 신규 역할값 추가
    _add_enum_value_if_missing("userrole", "OPERATOR_ADMIN")
    _add_enum_value_if_missing("userrole", "OPERATOR_STAFF")


if __name__ == "__main__":
    run_migrations()
