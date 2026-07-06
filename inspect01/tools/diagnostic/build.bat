@echo off
echo =====================================================
echo  inspect_spec_collector.exe 빌드
echo  Python 3.8+ 및 pip 필요
echo =====================================================

pip install pyinstaller --quiet
if errorlevel 1 (
    echo PyInstaller 설치 실패. pip을 확인해주세요.
    pause
    exit /b 1
)

python -m PyInstaller --onefile --windowed --uac-admin --name inspect_spec_collector collect_specs.py

if errorlevel 1 (
    echo 빌드 실패.
    pause
    exit /b 1
)

echo.
echo 빌드 완료: dist\inspect_spec_collector.exe
echo.

REM USB 자동 감지 및 복사
echo USB 드라이브를 감지 중...
for /f "delims=" %%D in ('powershell -NoProfile -Command "Get-PSDrive -PSProvider FileSystem | Where-Object { (Get-Volume -DriveLetter $_.Name -ErrorAction SilentlyContinue).DriveType -eq 'Removable' } | Select-Object -ExpandProperty Root"') do (
    set USB_ROOT=%%D
)

if not defined USB_ROOT (
    echo USB 드라이브를 찾을 수 없습니다.
    echo 수동으로 dist\inspect_spec_collector.exe 를 USB 루트에 복사하세요.
    pause
    exit /b 0
)

echo 감지된 USB: %USB_ROOT%
set /p CONFIRM="이 드라이브에 복사하시겠습니까? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo 복사가 취소되었습니다.
    echo 수동으로 dist\inspect_spec_collector.exe 를 USB 루트에 복사하세요.
    pause
    exit /b 0
)

copy /y "dist\inspect_spec_collector.exe" "%USB_ROOT%inspect_spec_collector.exe"
if errorlevel 1 (
    echo USB 복사 실패. 수동으로 복사해주세요.
) else (
    echo.
    echo USB 복사 완료: %USB_ROOT%inspect_spec_collector.exe
)

echo.
echo [USB 사용 방법]
echo   1. 검수 대상 노트북에서 USB의 inspect_spec_collector.exe 실행
echo   2. 스펙 수집 후 USB의 inspection_results\ 에 저장
echo   3. 검수 PC에서 [자동 불러오기] 버튼으로 결과 파일 선택
echo.
pause
