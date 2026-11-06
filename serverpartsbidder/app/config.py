"""서버파츠비더 설정. 비밀값(세션키·알림톡 키)은 Z드라이브가 아닌 서버PC 로컬 폴더에 둔다."""
import json
import os
import secrets
from pathlib import Path

APP_NAME = "서버파츠비더"
PORT = 8060

DATA_DIR = Path(os.environ.get("SPB_DATA") or Path(os.environ.get("LOCALAPPDATA", ".")) / "serverpartsbidder")
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "spb.db"

# 자사 재고 원본 (재고업데이트 스킬이 갱신하는 파일). 원본이 없는 PC(노트북 등)에선 패키지 안 stock\ 사본을 씀
STOCK_CSV = Path(os.environ.get("SPB_STOCK_CSV") or r"D:\claude_soboro\seversales\자동화\script\product_data.csv")
if not os.environ.get("SPB_STOCK_CSV") and not STOCK_CSV.exists():
    STOCK_CSV = Path(__file__).resolve().parent.parent / "stock" / "product_data.csv"

# 고객에게 보여줄 분류 순서
CATEGORIES = ["서버메모리", "서버CPU", "그래픽카드", "SSD/스토리지", "서버웍베어본", "광트랜시버", "기타"]

# 비딩 기본값
DEFAULT_BID_HOURS = 48        # 오픈부터 우리 마감까지
DEFAULT_PRIORITY_HOURS = 3    # 거래이력 고객 선공개 시간
CLOSING_NOTICE_HOURS = 3      # 마감 임박 알림 시점
MAX_BIDS_PER_CUSTOMER = 3


def _secret_key() -> str:
    f = DATA_DIR / "secret_key.txt"
    if not f.exists():
        f.write_text(secrets.token_hex(32), encoding="utf-8")
    return f.read_text(encoding="utf-8").strip()


SECRET_KEY = _secret_key()

ALIMTALK_FILE = DATA_DIR / "alimtalk.json"
ALIMTALK_SAMPLE = {
    "provider": "solapi",
    "api_key": "",
    "api_secret": "",
    "sender_phone": "",
    "pf_id": "",
    "site_url": "http://서버주소:8060",
    "templates": {
        "signup_approved": "",
        "invite": "",
        "new_stock": "",
        "bid_open": "",
        "bid_closing": "",
        "bid_result": "",
        "order_received": "",
    },
}


def alimtalk_config() -> dict:
    if not ALIMTALK_FILE.exists():
        ALIMTALK_FILE.write_text(json.dumps(ALIMTALK_SAMPLE, ensure_ascii=False, indent=2), encoding="utf-8")
    try:
        return json.loads(ALIMTALK_FILE.read_text(encoding="utf-8"))
    except ValueError:
        return dict(ALIMTALK_SAMPLE)
