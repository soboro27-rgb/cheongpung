@echo off
cd /d "%~dp0"

echo.
echo ============================================
echo  Daum Cafe Price Scraper - Setup ^& Run
echo ============================================
echo.

echo [Step 1] Installing Python packages...
py -3 -m pip install playwright beautifulsoup4 pandas openpyxl lxml
if errorlevel 1 (
    echo FAILED: pip install error. Check Python installation.
    pause
    exit /b 1
)

echo.
echo [Step 2] Installing Playwright Chromium browser...
py -3 -m playwright install chromium
if errorlevel 1 (
    echo FAILED: Playwright chromium install error.
    pause
    exit /b 1
)

echo.
echo [Step 3] Starting scraper... Browser will open automatically.
echo.
py -3 scraper.py

echo.
echo Done. Check the output folder for the Excel file.
pause
