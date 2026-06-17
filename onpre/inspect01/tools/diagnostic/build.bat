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

pyinstaller --onefile --windowed --uac-admin --name inspect_spec_collector collect_specs.py

if errorlevel 1 (
    echo 빌드 실패.
    pause
    exit /b 1
)

echo.
echo 빌드 완료: dist\inspect_spec_collector.exe
echo.
echo [USB 배포 방법]
echo   1. dist\inspect_spec_collector.exe 를 USB 루트에 복사
echo   2. USB에 inspection_results\ 폴더가 자동 생성됩니다
echo   3. 검수 대상 노트북에서 exe 실행 → 스펙 수집 → USB에 저장
echo   4. 검수 PC에서 [자동 불러오기] 버튼으로 결과 파일 선택
echo.
pause
