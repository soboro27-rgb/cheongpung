"""
KOSDAQ 단기 통합 매매 전략 엔진
────────────────────────────────
법칙 조합:
  - Bob Farrell  : RSI 과열 경계, 약세장 필터
  - Stan Weinstein: 20일선 추세 필터, 4단계 판별
  - Richard Wyckoff: 거래량 수급 매집/분산 신호
  - 외국인/기관 역추적: 순매수 전환 확인
"""

from dataclasses import dataclass, field
from typing import Optional

import numpy as np
import pandas as pd

import kis_api
from config import STRATEGY, TRADE


@dataclass
class Signal:
    stock_code:  str
    stock_name:  str
    entry_price: int
    stop_loss:   int
    target_price: int
    score:       int
    reasons:     list
    stage:       str
    signal_time: str = ""


# ── 지표 계산 ──────────────────────────────────────

def _rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain  = delta.clip(lower=0).rolling(period).mean()
    loss  = (-delta.clip(upper=0)).rolling(period).mean()
    rs    = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def _weinstein_stage(close: pd.Series, ma20: pd.Series) -> str:
    """
    Weinstein 4단계 간이 판별
    2 = 상승추세 (매수 가능)  3 = 고점횡보  4 = 하락추세  1 = 바닥횡보
    """
    if len(close) < 25:
        return "unknown"
    above_ma  = close.iloc[-1] > ma20.iloc[-1]
    ma_rising = ma20.iloc[-1]  > ma20.iloc[-6]

    if above_ma and ma_rising:     return "2"
    elif above_ma:                 return "3"
    elif not ma_rising:            return "4"
    else:                          return "1"


# ── 핵심 분석 ──────────────────────────────────────

def analyze(stock_code: str, stock_name: str) -> Optional[Signal]:
    """
    종목 분석 → 매수 조건 충족 시 Signal 반환, 아니면 None.
    5점 만점 중 buy_score_min 이상 + Weinstein 2단계 필수.
    """
    cfg = STRATEGY

    try:
        raw = kis_api.get_daily_ohlcv(stock_code, days=cfg["ohlcv_days"])
    except Exception as e:
        print(f"  [{stock_name}] 일봉 조회 실패: {e}")
        return None

    if len(raw) < 25:
        return None

    df     = pd.DataFrame(raw)
    close  = df["close"].astype(float)
    volume = df["volume"].astype(float)
    latest = int(close.iloc[-1])

    ma5   = close.rolling(cfg["ma_short"]).mean()
    ma20  = close.rolling(cfg["ma_long"]).mean()
    rsi   = _rsi(close, cfg["rsi_period"])
    vol_r = volume / volume.rolling(20).mean()   # 20일 평균 대비

    ma5_now    = ma5.iloc[-1]
    ma20_now   = ma20.iloc[-1]
    rsi_now    = rsi.iloc[-1]
    vol_ratio  = vol_r.iloc[-1]
    vol_vs_prev = (volume.iloc[-1] / volume.iloc[-2]) if volume.iloc[-2] > 0 else 1.0
    stage      = _weinstein_stage(close, ma20)

    # 외국인/기관 순매수
    try:
        investor = kis_api.get_investor_trading(stock_code)
    except Exception:
        investor = {"foreign_net": 0, "institution_net": 0}

    foreign_net = investor["foreign_net"]
    inst_net    = investor["institution_net"]

    reasons    = []
    buy_score  = 0

    # ① Weinstein 2단계: 20일선 위 + 우상향 (필수 조건)
    if stage == "2":
        buy_score += 1
        reasons.append(f"✅ Weinstein 2단계: {latest:,} > MA20 {ma20_now:,.0f}, 우상향")
    else:
        reasons.append(f"❌ Weinstein {stage}단계: 추세 부적합")

    # ② Wyckoff 매집: 거래량 > 20일 평균 × volume_ratio
    if vol_ratio >= cfg["volume_ratio"]:
        buy_score += 1
        reasons.append(f"✅ Wyckoff 매집: 거래량비 {vol_ratio:.2f}x")
    else:
        reasons.append(f"⚠️  Wyckoff 거래량 미달: {vol_ratio:.2f}x")

    # ③ 외국인/기관 순매수 (Farrell #9 스마트머니 역추적)
    if foreign_net > 0 or inst_net > 0:
        buy_score += 1
        reasons.append(f"✅ 스마트머니: 외국인 {foreign_net:+,} / 기관 {inst_net:+,}")
    else:
        reasons.append(f"⚠️  스마트머니 없음: 외국인 {foreign_net:+,} / 기관 {inst_net:+,}")

    # ④ Farrell RSI 과열 아님 (< rsi_buy_max)
    if rsi_now < cfg["rsi_buy_max"]:
        buy_score += 1
        reasons.append(f"✅ Farrell RSI: {rsi_now:.1f} < {cfg['rsi_buy_max']}")
    else:
        reasons.append(f"❌ Farrell RSI 과열: {rsi_now:.1f}")

    # ⑤ Weinstein 눌림목: 종가가 5일선 ±price_near_ma5 이내
    if abs(latest - ma5_now) / ma5_now <= cfg["price_near_ma5"]:
        buy_score += 1
        reasons.append(f"✅ 눌림목: {latest:,} ≒ MA5 {ma5_now:,.0f}")
    else:
        reasons.append(f"⚠️  눌림목 이탈: MA5 대비 {abs(latest - ma5_now) / ma5_now * 100:.1f}%")

    # ── 즉시 매도/금지 조건 ─────────────────────────
    # Wyckoff 분산: 거래량 급증 + RSI 과열
    if vol_vs_prev >= cfg["volume_dist"] and rsi_now >= cfg["rsi_sell"]:
        reasons.insert(0, f"🚨 Wyckoff 분산: 거래량 {vol_vs_prev:.1f}배 + RSI {rsi_now:.1f}")
        return None

    # Farrell #9: 외국인 대량 매도
    if foreign_net < -50_000:
        reasons.insert(0, f"🚨 외국인 대량 매도: {foreign_net:,}")
        return None

    # Weinstein 4단계 진입 금지
    if stage == "4":
        return None

    # ── 매수 신호 판정 ───────────────────────────────
    if buy_score < cfg["buy_score_min"] or stage != "2":
        return None

    stop_loss    = int(latest * (1 + TRADE["stop_loss"]))
    target_price = int(latest * (1 + TRADE["profit_target"]))

    return Signal(
        stock_code=stock_code,
        stock_name=stock_name,
        entry_price=latest,
        stop_loss=stop_loss,
        target_price=target_price,
        score=buy_score,
        reasons=reasons,
        stage=stage,
        signal_time=datetime_now(),
    )


def check_exit(stock_code: str, buy_price: int) -> dict:
    """
    보유 종목 청산 조건 체크.
    반환: {"exit": bool, "reason": str, "pnl_pct": float}
    """
    cfg = STRATEGY

    try:
        raw = kis_api.get_daily_ohlcv(stock_code, days=30)
    except Exception:
        return {"exit": False, "reason": "", "pnl_pct": 0.0}

    if len(raw) < 5:
        return {"exit": False, "reason": "", "pnl_pct": 0.0}

    df      = pd.DataFrame(raw)
    close   = df["close"].astype(float)
    volume  = df["volume"].astype(float)
    latest  = int(close.iloc[-1])
    ma20    = close.rolling(cfg["ma_long"]).mean()
    rsi     = _rsi(close, cfg["rsi_period"])
    stage   = _weinstein_stage(close, ma20)
    pnl_pct = (latest - buy_price) / buy_price
    vol_vs_prev = (volume.iloc[-1] / volume.iloc[-2]) if volume.iloc[-2] > 0 else 1.0

    if pnl_pct >= TRADE["profit_target"]:
        return {"exit": True, "reason": f"익절 +{pnl_pct*100:.1f}%", "pnl_pct": pnl_pct}

    if pnl_pct <= TRADE["stop_loss"]:
        return {"exit": True, "reason": f"손절 {pnl_pct*100:.1f}%", "pnl_pct": pnl_pct}

    if stage == "4":
        return {"exit": True, "reason": "Weinstein 4단계 이탈", "pnl_pct": pnl_pct}

    if vol_vs_prev >= cfg["volume_dist"] and rsi.iloc[-1] >= cfg["rsi_sell"]:
        return {"exit": True, "reason": f"Wyckoff 분산 (거래량 {vol_vs_prev:.1f}배, RSI {rsi.iloc[-1]:.1f})", "pnl_pct": pnl_pct}

    return {"exit": False, "reason": "보유 유지", "pnl_pct": pnl_pct}


def datetime_now() -> str:
    from datetime import datetime
    return datetime.now().strftime("%H:%M:%S")
