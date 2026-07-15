"""
장전 종목 스크리닝.
WATCH_STOCKS 전체를 IntegratedStrategy로 분석해 BUY 신호 종목 추출.
"""

import time
import strategy as strat
from config import WATCH_STOCKS, STRATEGY

_STAR = {5: "★★★★★", 4: "★★★★ ", 3: "★★★  ", 2: "★★   ", 1: "★    ", 0: "✗    "}


def run() -> list:
    """
    전체 감시종목 스캔 → Signal 리스트 반환 (BUY 신호만).
    score 높은 순 정렬.
    """
    signals  = []
    all_info = []

    print("\n" + "=" * 65)
    print("  [장전 스크리닝] Farrell + Weinstein + Wyckoff")
    print(f"  매수 최소 점수: {STRATEGY['buy_score_min']}/5  |  Weinstein 2단계 필수")
    print("=" * 65)

    for code, name in WATCH_STOCKS.items():
        try:
            signal = strat.analyze(code, name)
        except Exception as e:
            print(f"  {name}({code}): 오류 — {e}")
            all_info.append({"name": name, "code": code, "score": -1, "signal": "ERROR"})
            time.sleep(0.3)
            continue

        if signal:
            signals.append(signal)
            all_info.append({"name": name, "code": code, "score": signal.score, "signal": "BUY"})
        else:
            all_info.append({"name": name, "code": code, "score": 0, "signal": "SKIP"})

        time.sleep(0.3)  # API rate limit

    _print_report(all_info, signals)
    signals.sort(key=lambda s: s.score, reverse=True)
    return signals


def _print_report(all_info: list, signals: list):
    buy_codes = {s.stock_code for s in signals}

    for r in sorted(all_info, key=lambda x: x["score"], reverse=True):
        score = max(r["score"], 0)
        star  = _STAR.get(score, "✗    ")
        tag   = "→ 매수 후보" if r["code"] in buy_codes else "→ 제외"
        print(f"  {star}  {r['name']}({r['code']})  점수 {score}/5  {tag}")

    print()
    if not signals:
        print("  ※ 오늘은 매수 조건 충족 종목 없음")
    else:
        names = [s.stock_name for s in signals]
        print(f"  매수 후보 ({len(signals)}종목): {', '.join(names)}")
    print("=" * 65 + "\n")
