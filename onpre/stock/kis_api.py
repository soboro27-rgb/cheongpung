import requests
import json
from datetime import datetime, timedelta
from pathlib import Path
from config import APP_KEY, APP_SECRET, BASE_URL

_TOKEN_FILE = Path(__file__).parent / "data" / ".token_cache.json"


def get_access_token() -> str:
    _TOKEN_FILE.parent.mkdir(exist_ok=True)
    now = datetime.now()

    if _TOKEN_FILE.exists():
        try:
            cached = json.loads(_TOKEN_FILE.read_text(encoding="utf-8"))
            expires = datetime.fromisoformat(cached["expires"])
            if now < expires and cached.get("token"):
                return cached["token"]
        except Exception:
            pass

    res = requests.post(
        f"{BASE_URL}/oauth2/tokenP",
        headers={"content-type": "application/json"},
        json={
            "grant_type": "client_credentials",
            "appkey": APP_KEY,
            "appsecret": APP_SECRET,
        },
        timeout=10,
    )
    res.raise_for_status()
    data = res.json()
    token = data["access_token"]
    expires = now + timedelta(hours=23)

    _TOKEN_FILE.write_text(
        json.dumps({"token": token, "expires": expires.isoformat()}, ensure_ascii=False),
        encoding="utf-8",
    )
    return token


def _headers(tr_id: str) -> dict:
    return {
        "authorization": f"Bearer {get_access_token()}",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET,
        "tr_id": tr_id,
        "custtype": "P",
        "content-type": "application/json; charset=utf-8",
    }


def get_current_price(stock_code: str) -> int:
    res = requests.get(
        f"{BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price",
        headers=_headers("FHKST01010100"),
        params={
            "FID_COND_MRKT_DIV_CODE": "J",
            "FID_INPUT_ISCD": stock_code,
        },
        timeout=10,
    )
    res.raise_for_status()
    return int(res.json()["output"].get("stck_prpr", 0))


def get_stock_summary(stock_code: str) -> dict:
    """현재가, 전일 거래량, 전일 등락률 (스크리닝용)"""
    res = requests.get(
        f"{BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price",
        headers=_headers("FHKST01010100"),
        params={
            "FID_COND_MRKT_DIV_CODE": "J",
            "FID_INPUT_ISCD": stock_code,
        },
        timeout=10,
    )
    res.raise_for_status()
    out = res.json()["output"]
    return {
        "price":     int(out.get("stck_prpr", 0)),
        "prdy_vol":  int(out.get("prdy_vol", 0)),
        "prdy_ctrt": float(out.get("prdy_ctrt", 0)),
    }


def get_daily_ohlcv(stock_code: str, days: int = 60) -> list[dict]:
    """
    일봉 OHLCV 조회. 과거→최신 순으로 정렬해 반환.
    반환: [{"date": "20260601", "open": 1000, "high": 1100, "low": 950, "close": 1050, "volume": 500000}, ...]
    """
    end_dt   = datetime.today().strftime("%Y%m%d")
    start_dt = (datetime.today() - timedelta(days=days + 30)).strftime("%Y%m%d")

    res = requests.get(
        f"{BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice",
        headers=_headers("FHKST03010100"),
        params={
            "FID_COND_MRKT_DIV_CODE": "J",
            "FID_INPUT_ISCD": stock_code,
            "FID_INPUT_DATE_1": start_dt,
            "FID_INPUT_DATE_2": end_dt,
            "FID_PERIOD_DIV_CODE": "D",
            "FID_ORG_ADJ_PRC": "1",
        },
        timeout=10,
    )
    res.raise_for_status()
    raw = res.json().get("output2", [])

    result = []
    for c in raw:
        try:
            result.append({
                "date":   c.get("stck_bsop_date", ""),
                "open":   int(c.get("stck_oprc", 0)),
                "high":   int(c.get("stck_hgpr", 0)),
                "low":    int(c.get("stck_lwpr", 0)),
                "close":  int(c.get("stck_clpr", 0)),
                "volume": int(c.get("acml_vol", 0)),
            })
        except (ValueError, TypeError):
            continue

    # API는 최신→과거 순. 과거→최신으로 뒤집어서 반환
    result.reverse()
    return result[-days:]


def get_investor_trading(stock_code: str) -> dict:
    """
    당일 투자자별 순매수 조회 (외국인/기관).
    반환: {"foreign_net": int, "institution_net": int}
    """
    res = requests.get(
        f"{BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-investor",
        headers=_headers("FHKST01010900"),
        params={
            "FID_COND_MRKT_DIV_CODE": "J",
            "FID_INPUT_ISCD": stock_code,
        },
        timeout=10,
    )
    res.raise_for_status()
    output = res.json().get("output", [])
    today = output[0] if output else {}
    return {
        "foreign_net":     int(today.get("frgn_ntby_qty", 0)),
        "institution_net": int(today.get("orgn_ntby_qty", 0)),
    }


def get_minute_candles(stock_code: str, time_str: str = "103000") -> list[dict]:
    """5분봉 (기존 호환용). 최신→과거 순."""
    res = requests.get(
        f"{BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice",
        headers=_headers("FHKST03010200"),
        params={
            "FID_ETC_CLS_CODE": "",
            "FID_COND_MRKT_DIV_CODE": "J",
            "FID_INPUT_ISCD": stock_code,
            "FID_INPUT_HOUR_1": time_str,
            "FID_PW_DATA_INCU_YN": "Y",
        },
        timeout=10,
    )
    res.raise_for_status()
    candles = []
    for c in res.json().get("output2", []):
        try:
            candles.append({
                "time":  c.get("stck_cntg_hour", ""),
                "open":  int(c.get("stck_oprc", 0)),
                "high":  int(c.get("stck_hgpr", 0)),
                "low":   int(c.get("stck_lwpr", 0)),
                "close": int(c.get("stck_prpr", 0)),
                "vol":   int(c.get("cntg_vol", 0)),
            })
        except (ValueError, TypeError):
            continue
    return candles
