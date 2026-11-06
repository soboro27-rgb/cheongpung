@echo off
rem ServerPartsBidder - server parts sales + bidding platform (port 8060)
rem If a data folder sits next to this file (laptop package), use it for DB and keys.
if exist "%~dp0data\spb.db" set "SPB_DATA=%~dp0data"
cd /d "%~dp0app"
python -m pip install -q -r requirements.txt
echo.
echo  ServerPartsBidder
echo  This PC     : http://localhost:8060
echo  Other PCs   : http://%COMPUTERNAME%:8060  (or http://THIS-PC-IP:8060)
echo  Admin       : http://localhost:8060/admin
if defined SPB_DATA (echo  Data        : %SPB_DATA%) else (echo  Data        : %LOCALAPPDATA%\serverpartsbidder)
echo  Closing this window stops the server.
echo.
python -m uvicorn main:app --host 0.0.0.0 --port 8060
pause
