@echo off
chcp 65001 > nul
title 광케이블 모의매매 - 트레이더
cd /d "%~dp0"
echo [트레이더] 패키지 설치 확인 중...
py -3 -m pip install -r requirements.txt -q
echo.
echo [트레이더] 시작합니다. 이 창을 닫지 마세요.
echo.
py -3 scheduler.py
pause
