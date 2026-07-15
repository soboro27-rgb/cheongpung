@echo off
chcp 65001 > nul
echo IT Asset 관리 시스템 시작 중...
cd /d "%~dp0"
python app.py
pause
