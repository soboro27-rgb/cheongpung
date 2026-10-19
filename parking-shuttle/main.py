"""오갱끼데스까 — 월드메모리 공사기간 주차·셔틀 웹앱 (FastAPI + SQLite)

본사 주차 → 만차 사인 → 신평동 녹색주차장/개별 주차,
출근 셔틀(08:20까지 녹색주차장 주차자 있을 때만), 퇴근 셔틀(녹색주차장 차량 남아 있을 때만).
주차 기록은 KEEP_DAYS일 지나면 자동 정리, 직원 명단·설정은 보존.
"""
import os
import re
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

BASE = Path(__file__).parent
DB_PATH = Path(os.environ.get("PARKING_DB", BASE / "data" / "parking.db"))
KEEP_DAYS = int(os.environ.get("KEEP_DAYS", "30"))
KST = timezone(timedelta(hours=9))
CUT = 8 * 60 + 20  # 08:20 출근 셔틀 판정
DEFAULTS = {"hqCapacity": "30", "pmTime": "18:00"}
LOTS = {"hq", "green", "self"}

app = FastAPI(title="오갱끼데스까")


def now_kst():
    n = datetime.now(KST)
    return n, n.strftime("%Y-%m-%d"), n.strftime("%H:%M"), n.hour * 60 + n.minute


@contextmanager
def conn():
    c = sqlite3.connect(DB_PATH, timeout=10)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys = ON")
    try:
        yield c
        c.commit()
    finally:
        c.close()


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with conn() as c:
        c.executescript("""
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS employees(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL, dept TEXT DEFAULT '', phone TEXT DEFAULT '',
            plate TEXT DEFAULT '', car TEXT DEFAULT '',
            created_at TEXT, updated_at TEXT);
        CREATE TABLE IF NOT EXISTS parks(
            date TEXT NOT NULL, emp_id INTEGER NOT NULL, lot TEXT NOT NULL,
            at TEXT NOT NULL, hm TEXT NOT NULL, min INTEGER NOT NULL,
            pm_skip INTEGER DEFAULT 0,
            PRIMARY KEY(date, emp_id));
        CREATE TABLE IF NOT EXISTS days(
            date TEXT PRIMARY KEY, full INTEGER DEFAULT 0, full_hm TEXT,
            shuttle_done INTEGER DEFAULT 0, shuttle_hm TEXT,
            pm_done INTEGER DEFAULT 0, pm_hm TEXT);
        CREATE TABLE IF NOT EXISTS config(key TEXT PRIMARY KEY, value TEXT);
        """)


init_db()


def get_config(c):
    cfg = dict(DEFAULTS)
    cfg.update({r["key"]: r["value"] for r in c.execute("SELECT key, value FROM config")})
    return cfg


def cleanup(c, today):
    """하루 한 번 KEEP_DAYS일 지난 주차 기록 삭제 (직원·설정은 그대로)."""
    last = c.execute("SELECT value FROM config WHERE key='lastCleanup'").fetchone()
    if last and last["value"] == today:
        return
    cutoff = (datetime.strptime(today, "%Y-%m-%d") - timedelta(days=KEEP_DAYS)).strftime("%Y-%m-%d")
    c.execute("DELETE FROM parks WHERE date < ?", (cutoff,))
    c.execute("DELETE FROM days WHERE date < ?", (cutoff,))
    c.execute("INSERT OR REPLACE INTO config(key, value) VALUES('lastCleanup', ?)", (today,))


def norm_plate(s):
    return re.sub(r"\s+", " ", (s or "").strip())


# ---------- 조회 ----------
@app.get("/api/state")
def state():
    _, today, hm, mn = now_kst()
    with conn() as c:
        cleanup(c, today)
        cfg = get_config(c)
        day = c.execute("SELECT * FROM days WHERE date=?", (today,)).fetchone()
        parks = c.execute("SELECT * FROM parks WHERE date=? ORDER BY at", (today,)).fetchall()
        emps = c.execute("SELECT * FROM employees ORDER BY name").fetchall()
    return {
        "today": today, "hm": hm, "min": mn,
        "config": {"hqCapacity": int(cfg["hqCapacity"]), "pmTime": cfg["pmTime"]},
        "day": {
            "full": bool(day and day["full"]), "fullHm": day["full_hm"] if day else None,
            "shuttleDone": bool(day and day["shuttle_done"]), "shuttleHm": day["shuttle_hm"] if day else None,
            "pmDone": bool(day and day["pm_done"]), "pmHm": day["pm_hm"] if day else None,
        },
        "parks": [{"empId": str(p["emp_id"]), "lot": p["lot"], "at": p["at"], "hm": p["hm"],
                   "min": p["min"], "pmSkip": bool(p["pm_skip"])} for p in parks],
        "employees": [{"id": str(e["id"]), "name": e["name"], "dept": e["dept"], "phone": e["phone"],
                       "plate": e["plate"], "car": e["car"]} for e in emps],
    }


# ---------- 주차 체크 ----------
class ParkIn(BaseModel):
    empId: int
    lot: str


@app.post("/api/park")
def park(body: ParkIn):
    if body.lot not in LOTS:
        raise HTTPException(400, "주차 장소가 올바르지 않습니다")
    n, today, hm, mn = now_kst()
    with conn() as c:
        if not c.execute("SELECT 1 FROM employees WHERE id=?", (body.empId,)).fetchone():
            raise HTTPException(404, "등록되지 않은 직원입니다")
        day = c.execute("SELECT full FROM days WHERE date=?", (today,)).fetchone()
        prev = c.execute("SELECT lot FROM parks WHERE date=? AND emp_id=?", (today, body.empId)).fetchone()
        if body.lot == "hq" and day and day["full"] and not (prev and prev["lot"] == "hq"):
            raise HTTPException(409, "본사 주차장이 만차입니다. 녹색주차장 또는 개별 주차를 선택하세요")
        c.execute("INSERT OR REPLACE INTO parks(date, emp_id, lot, at, hm, min, pm_skip) VALUES(?,?,?,?,?,?,0)",
                  (today, body.empId, body.lot, n.isoformat(), hm, mn))
    return {"ok": True, "hm": hm, "min": mn}


@app.delete("/api/park/{emp_id}")
def cancel_park(emp_id: int):
    _, today, _, _ = now_kst()
    with conn() as c:
        c.execute("DELETE FROM parks WHERE date=? AND emp_id=?", (today, emp_id))
    return {"ok": True}


class PmSkipIn(BaseModel):
    pmSkip: bool


@app.post("/api/park/{emp_id}/pmskip")
def pm_skip(emp_id: int, body: PmSkipIn):
    _, today, _, _ = now_kst()
    with conn() as c:
        cur = c.execute("UPDATE parks SET pm_skip=? WHERE date=? AND emp_id=? AND lot='green'",
                        (int(body.pmSkip), today, emp_id))
        if cur.rowcount == 0:
            raise HTTPException(404, "오늘 녹색주차장 체크 기록이 없습니다")
    return {"ok": True}


# ---------- 관리: 만차·셔틀 확인·설정 ----------
class DayIn(BaseModel):
    action: str  # full_on | full_off | shuttle | pm


@app.post("/api/day")
def day_action(body: DayIn):
    _, today, hm, _ = now_kst()
    sets = {
        "full_on": ("full=1, full_hm=?", (hm,)),
        "full_off": ("full=0, full_hm=NULL", ()),
        "shuttle": ("shuttle_done=1, shuttle_hm=?", (hm,)),
        "pm": ("pm_done=1, pm_hm=?", (hm,)),
    }
    if body.action not in sets:
        raise HTTPException(400, "알 수 없는 동작입니다")
    sql, args = sets[body.action]
    with conn() as c:
        c.execute("INSERT OR IGNORE INTO days(date) VALUES(?)", (today,))
        c.execute(f"UPDATE days SET {sql} WHERE date=?", (*args, today))
    return {"ok": True, "hm": hm}


class ConfigIn(BaseModel):
    hqCapacity: int
    pmTime: str


@app.post("/api/config")
def set_config(body: ConfigIn):
    if not 1 <= body.hqCapacity <= 500:
        raise HTTPException(400, "주차면 수는 1~500 사이로 입력하세요")
    if not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", body.pmTime):
        raise HTTPException(400, "퇴근 셔틀 시각 형식이 올바르지 않습니다 (예: 18:00)")
    with conn() as c:
        c.executemany("INSERT OR REPLACE INTO config(key, value) VALUES(?, ?)",
                      [("hqCapacity", str(body.hqCapacity)), ("pmTime", body.pmTime)])
    return {"ok": True}


# ---------- 직원·차량 ----------
class EmpIn(BaseModel):
    name: str
    dept: str = ""
    phone: str = ""
    plate: str = ""
    car: str = ""


def _clean(e: EmpIn):
    d = {k: (v or "").strip() for k, v in e.model_dump().items()}
    d["plate"] = norm_plate(d["plate"])
    if not d["name"]:
        raise HTTPException(400, "이름을 입력하세요")
    return d


def _plate_taken(c, plate, exclude_id=None):
    if not plate:
        return False
    row = c.execute("SELECT id FROM employees WHERE plate=?", (plate,)).fetchone()
    return bool(row and row["id"] != exclude_id)


@app.post("/api/employees")
def add_employee(e: EmpIn):
    d = _clean(e)
    stamp = datetime.now(KST).isoformat()
    with conn() as c:
        if _plate_taken(c, d["plate"]):
            raise HTTPException(409, f"차량번호 {d['plate']}는 이미 등록되어 있습니다")
        cur = c.execute("INSERT INTO employees(name, dept, phone, plate, car, created_at) VALUES(?,?,?,?,?,?)",
                        (d["name"], d["dept"], d["phone"], d["plate"], d["car"], stamp))
    return {"ok": True, "id": str(cur.lastrowid)}


@app.put("/api/employees/{emp_id}")
def edit_employee(emp_id: int, e: EmpIn):
    d = _clean(e)
    with conn() as c:
        if _plate_taken(c, d["plate"], emp_id):
            raise HTTPException(409, f"차량번호 {d['plate']}는 이미 등록되어 있습니다")
        cur = c.execute("UPDATE employees SET name=?, dept=?, phone=?, plate=?, car=?, updated_at=? WHERE id=?",
                        (d["name"], d["dept"], d["phone"], d["plate"], d["car"], datetime.now(KST).isoformat(), emp_id))
        if cur.rowcount == 0:
            raise HTTPException(404, "직원을 찾을 수 없습니다")
    return {"ok": True}


@app.delete("/api/employees/{emp_id}")
def delete_employee(emp_id: int):
    with conn() as c:
        c.execute("DELETE FROM parks WHERE emp_id=?", (emp_id,))
        c.execute("DELETE FROM employees WHERE id=?", (emp_id,))
    return {"ok": True}


class BulkIn(BaseModel):
    rows: list[EmpIn]


@app.post("/api/employees/bulk")
def bulk_employees(body: BulkIn):
    added = skipped = 0
    stamp = datetime.now(KST).isoformat()
    with conn() as c:
        for e in body.rows:
            name = (e.name or "").strip()
            plate = norm_plate(e.plate)
            if not name or name == "이름" or _plate_taken(c, plate):
                skipped += 1
                continue
            c.execute("INSERT INTO employees(name, dept, phone, plate, car, created_at) VALUES(?,?,?,?,?,?)",
                      (name, e.dept.strip(), e.phone.strip(), plate, e.car.strip(), stamp))
            added += 1
    return {"added": added, "skipped": skipped}


# ---------- 페이지 ----------
app.mount("/static", StaticFiles(directory=BASE / "static"), name="static")


@app.get("/")
def index():
    return FileResponse(BASE / "static" / "index.html")
