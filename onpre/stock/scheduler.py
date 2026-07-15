"""
메인 실행 루프.
  - 장전 (08:50~09:00): 전체 종목 스크리닝 → 매수 후보 확정
  - 장중 30분마다: 보유 포지션 청산 조건 체크 + 매수 후보 진입
  - 15:30 이후: 남은 포지션 마감 청산
"""

import time
import schedule
from datetime import datetime

import db
import screener
import simulator
from config import WATCH_STOCKS, TRADE, SCHEDULE

_candidates: list = []   # 오늘 매수 후보 Signal 리스트
_screened:   bool = False


def _now_hhmm() -> str:
    return datetime.now().strftime("%H%M%S")


def _market_open() -> bool:
    t = _now_hhmm()
    return "090000" <= t <= "153000"


def _should_screen() -> bool:
    t = _now_hhmm()
    return t >= SCHEDULE["screen_time"] and not _screened


def _log(msg: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def morning_screen():
    """장전 스크리닝 → 매수 후보 리스트 확정"""
    global _candidates, _screened
    _log("장전 스크리닝 시작...")
    _candidates = screener.run()
    _screened   = True
    if _candidates:
        _log(f"매수 후보 {len(_candidates)}종목 확정: {[s.stock_name for s in _candidates]}")
    else:
        _log("오늘 매수 조건 충족 종목 없음")


def tick():
    """30분마다 실행: 청산 체크 + 신규 진입"""
    if not _market_open():
        return

    t = _now_hhmm()

    # 15:30 마감 청산
    if t >= SCHEDULE["force_close"]:
        _log("장 마감 → 미청산 포지션 정리")
        simulator.force_close_all()
        return

    # 보유 포지션 청산 체크 (Wyckoff 분산, 손절, 익절, Weinstein 4단계)
    simulator.check_exits()

    # 신규 진입: 후보 중 아직 미진입 + 최대 보유 수 미달
    open_cnt = simulator.open_position_count()
    if open_cnt >= TRADE["max_holdings"]:
        _log(f"최대 보유 {TRADE['max_holdings']}종목 도달 → 신규 진입 보류")
        return

    for signal in _candidates:
        if db.has_open_trade_today(signal.stock_code):
            continue
        if simulator.open_position_count() >= TRADE["max_holdings"]:
            break

        _log(f"★ 매수 진입: {signal.stock_name} (점수 {signal.score}/5)")
        for r in signal.reasons[:3]:
            _log(f"   {r}")
        simulator.enter(signal)

        db.log_daily(
            signal.stock_code, signal.stock_name,
            0, 0,
            fvg_detected=0,
            signal_fired=1,
            note=f"score={signal.score} stage={signal.stage}",
        )


def main():
    global _screened
    db.init_db()

    print("=" * 60)
    print("  KOSDAQ 통합 전략 모의매매 시스템 시작")
    print("  전략: Farrell + Weinstein + Wyckoff + 외국인수급")
    print(f"  종목당 매수금액: {TRADE['buy_amount']:,}원 | "
          f"익절 +{TRADE['profit_target']*100:.0f}% | "
          f"손절 {TRADE['stop_loss']*100:.0f}%")
    print("=" * 60)

    # 장전 스크리닝 (지금 시각이 screen_time 이후면 즉시 실행)
    if _now_hhmm() >= SCHEDULE["screen_time"]:
        morning_screen()

    # 스케줄 등록
    screen_hhmm = SCHEDULE["screen_time"][:2] + ":" + SCHEDULE["screen_time"][2:4]
    schedule.every().day.at(screen_hhmm).do(lambda: (morning_screen(), setattr(__builtins__, '_screened', False)))

    interval = SCHEDULE["exit_interval"]
    schedule.every(interval).minutes.do(tick)

    # 시작 즉시 1회 실행
    tick()

    while True:
        schedule.run_pending()
        time.sleep(10)


if __name__ == "__main__":
    main()
