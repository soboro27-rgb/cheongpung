@echo off
chcp 65001 > nul
title 광케이블 모의매매 - 대시보드
cd /d "%~dp0"
echo [대시보드] http://localhost:5002 에서 확인하세요
echo.
py -3 -m pip install -r requirements.txt -q
start "" "http://localhost:5002"
py -3 dashboard.py
pause
