@echo off
chcp 65001 >nul
cd /d %~dp0
if not exist venv (
  python -m venv venv
  venv\Scripts\pip install -r requirements.txt
)
echo 월드메모리 그랑프리 주차레이스 서버 시작: http://이PC의IP:8010
venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8010
