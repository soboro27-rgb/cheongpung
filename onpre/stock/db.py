import sqlite3
from pathlib import Path
from datetime import datetime

DB_PATH = Path(__file__).parent / "data" / "trades.db"


def get_conn():
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS trades (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                date         TEXT NOT NULL,
                stock_code   TEXT NOT NULL,
                stock_name   TEXT NOT NULL,
                entry_price  INTEGER NOT NULL,
                stop_loss    INTEGER NOT NULL,
                target_price INTEGER NOT NULL,
                quantity     INTEGER NOT NULL,
                status       TEXT NOT NULL DEFAULT 'OPEN',
                exit_price   INTEGER,
                pnl          INTEGER,
                pnl_rate     REAL,
                signal_time  TEXT,
                exit_time    TEXT,
                created_at   TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS daily_log (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                date         TEXT NOT NULL,
                stock_code   TEXT NOT NULL,
                stock_name   TEXT NOT NULL,
                or_high      INTEGER,
                or_low       INTEGER,
                fvg_detected INTEGER DEFAULT 0,
                signal_fired INTEGER DEFAULT 0,
                note         TEXT,
                created_at   TEXT NOT NULL
            );
        """)
        # 신규 컬럼 마이그레이션 (기존 DB 호환)
        for col, definition in [
            ("strategy", "TEXT DEFAULT 'INTEGRATED'"),
            ("score",    "INTEGER DEFAULT 0"),
        ]:
            try:
                conn.execute(f"ALTER TABLE trades ADD COLUMN {col} {definition}")
            except Exception:
                pass  # 이미 존재하면 무시


def insert_trade(
    stock_code, stock_name, entry_price, stop_loss, target_price,
    quantity, signal_time, strategy="INTEGRATED", score=0,
) -> int:
    now   = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    today = datetime.now().strftime("%Y-%m-%d")
    with get_conn() as conn:
        cur = conn.execute(
            """INSERT INTO trades
               (date, stock_code, stock_name, entry_price, stop_loss, target_price,
                quantity, status, signal_time, strategy, score, created_at)
               VALUES (?,?,?,?,?,?,?,'OPEN',?,?,?,?)""",
            (today, stock_code, stock_name, entry_price, stop_loss, target_price,
             quantity, signal_time, strategy, score, now),
        )
        return cur.lastrowid


def close_trade(trade_id: int, exit_price: int, status: str):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM trades WHERE id=?", (trade_id,)).fetchone()
        if row is None:
            return
        pnl      = (exit_price - row["entry_price"]) * row["quantity"]
        pnl_rate = (exit_price - row["entry_price"]) / row["entry_price"]
        exit_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        conn.execute(
            """UPDATE trades
               SET status=?, exit_price=?, pnl=?, pnl_rate=?, exit_time=?
               WHERE id=?""",
            (status, exit_price, pnl, pnl_rate, exit_time, trade_id),
        )


def get_open_trades() -> list:
    with get_conn() as conn:
        return conn.execute(
            "SELECT * FROM trades WHERE status='OPEN' ORDER BY created_at DESC"
        ).fetchall()


def get_all_trades(limit: int = 200) -> list:
    with get_conn() as conn:
        return conn.execute(
            "SELECT * FROM trades ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()


def get_summary() -> dict:
    with get_conn() as conn:
        row = conn.execute("""
            SELECT
                COUNT(*) total,
                SUM(CASE WHEN status='WIN'  THEN 1 ELSE 0 END) wins,
                SUM(CASE WHEN status='LOSS' THEN 1 ELSE 0 END) losses,
                SUM(CASE WHEN status='OPEN' THEN 1 ELSE 0 END) open_cnt,
                COALESCE(SUM(pnl), 0) total_pnl
            FROM trades
        """).fetchone()
        return dict(row) if row else {}


def has_open_trade_today(stock_code: str) -> bool:
    """오늘 이미 진입한 종목이면 True (중복 진입 방지)"""
    today = datetime.now().strftime("%Y-%m-%d")
    with get_conn() as conn:
        row = conn.execute(
            "SELECT 1 FROM trades WHERE date=? AND stock_code=? LIMIT 1",
            (today, stock_code),
        ).fetchone()
        return row is not None


def log_daily(stock_code, stock_name, or_high, or_low, fvg_detected, signal_fired, note=""):
    now   = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    today = datetime.now().strftime("%Y-%m-%d")
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO daily_log
               (date, stock_code, stock_name, or_high, or_low,
                fvg_detected, signal_fired, note, created_at)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (today, stock_code, stock_name, or_high, or_low,
             fvg_detected, signal_fired, note, now),
        )
