import os
from pathlib import Path

_env = Path(__file__).parent / ".env"
if _env.exists():
    for _line in _env.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            k, v = _line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

APP_KEY        = os.environ["KIS_APP_KEY"]
APP_SECRET     = os.environ["KIS_APP_SECRET"]
ACCOUNT        = os.environ["KIS_ACCOUNT"]
ACCOUNT_SUFFIX = os.environ.get("KIS_ACCOUNT_SUFFIX", "01")

BASE_URL = "https://openapi.koreainvestment.com:9443"

# 감시 종목: KOSDAQ 중소형/테마주
WATCH_STOCKS = {
    "010170": "대한광통신",
    "000500": "가온전선",
    "219130": "OFC",
    "109080": "옵티시스",
    "006340": "대원전선",
    "103590": "일진전기",
    "006260": "LS",
    "229640": "LS전선아시아",
    "025820": "이구산업",
    "008490": "서울전선",
    "247540": "에코프로비엠",
    "086520": "에코프로",
    "035900": "JYP엔터",
    "263750": "펄어비스",
    "041510": "에스엠",
}

# 매매 파라미터
TRADE = {
    "buy_amount":    500_000,  # 종목당 매수금액 (원)
    "profit_target": 0.10,     # 익절 +10%
    "stop_loss":    -0.04,     # 손절 -4%
    "max_holdings":  5,        # 최대 동시 보유 종목 수
}

# 전략 파라미터 (Bob Farrell + Stan Weinstein + Richard Wyckoff)
STRATEGY = {
    "ma_short":        5,      # 단기 이동평균
    "ma_long":         20,     # Weinstein 기준선
    "rsi_period":      14,
    "rsi_buy_max":     70,     # Farrell: 과열 아닐 때 진입 (미만)
    "rsi_sell":        75,     # Farrell: 과열 이탈 기준 (이상)
    "volume_ratio":    1.5,    # Wyckoff 매집: 20일 평균 대비 거래량 비율
    "volume_dist":     3.0,    # Wyckoff 분산: 전일 대비 거래량 배수
    "price_near_ma5":  0.02,   # Weinstein 눌림목 허용 범위 ±2%
    "buy_score_min":   4,      # 매수 최소 점수 (5점 만점)
    "ohlcv_days":      60,     # 일봉 조회 기간
}

# 스케줄
SCHEDULE = {
    "screen_time":   "085000",  # 장전 스크리닝 시각
    "exit_interval": 30,        # 포지션 청산 체크 간격 (분)
    "force_close":   "153000",  # 마감 강제 청산
}
