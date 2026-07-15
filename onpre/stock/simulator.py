"""
모의매매 시뮬레이터.
실제 주문 없이 DB에 가상 체결을 기록하고,
30분마다 현재가/일봉 분석으로 청산 조건 체크.
"""

import db
import kis_api
import strategy as strat
from config import TRADE


def enter(signal) -> int:
    """전략 신호 수신 → 모의 매수"""
    qty = max(1, TRADE["buy_amount"] // signal.entry_price)

    trade_id = db.insert_trade(
        stock_code=signal.stock_code,
        stock_name=signal.stock_name,
        entry_price=signal.entry_price,
        stop_loss=signal.stop_loss,
        target_price=signal.target_price,
        quantity=qty,
        signal_time=signal.signal_time,
        strategy=getattr(signal, "strategy_name", "INTEGRATED"),
        score=getattr(signal, "score", 0),
    )

    print(
        f"[매수] {signal.stock_name}({signal.stock_code}) "
        f"{signal.entry_price:,}원 × {qty}주 | "
        f"손절 {signal.stop_loss:,} / 목표 {signal.target_price:,} | "
        f"점수 {signal.score}/5"
    )
    return trade_id


def check_exits():
    """열린 포지션의 청산 조건을 전략 함수로 체크"""
    open_trades = db.get_open_trades()
    for row in open_trades:
        code = row["stock_code"]
        try:
            result = strat.check_exit(code, row["entry_price"])
        except Exception as e:
            print(f"[청산체크 오류] {row['stock_name']}: {e}")
            continue

        if result["exit"]:
            try:
                price = kis_api.get_current_price(code)
            except Exception:
                price = row["entry_price"]

            status = "WIN" if result["pnl_pct"] >= 0 else "LOSS"
            db.close_trade(row["id"], price, status)
            pnl = (price - row["entry_price"]) * row["quantity"]
            print(
                f"[{'익절' if status == 'WIN' else '손절'}] "
                f"{row['stock_name']} {price:,}원 | "
                f"{result['reason']} | 손익 {pnl:+,}원"
            )


def force_close_all():
    """장 마감 시 남은 포지션 강제 청산"""
    open_trades = db.get_open_trades()
    for row in open_trades:
        try:
            price = kis_api.get_current_price(row["stock_code"])
        except Exception:
            price = row["entry_price"]
        db.close_trade(row["id"], price, "EXPIRED")
        pnl = (price - row["entry_price"]) * row["quantity"]
        print(f"[마감청산] {row['stock_name']} {price:,}원 | 손익 {pnl:+,}원")


def open_position_count() -> int:
    return len(db.get_open_trades())
