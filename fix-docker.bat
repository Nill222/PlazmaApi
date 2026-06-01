@echo off
setlocal EnableExtensions

cd /d "%~dp0"

where docker >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker not found.
    pause
    exit /b 1
)

echo Stopping and removing PlazmaApi containers...
docker compose down --remove-orphans 2>nul

echo.
echo Cleaning failed build cache (safe)...
docker builder prune -f 2>nul

echo.
echo Done.
echo.
echo Next steps:
echo  1. Restart Docker Desktop (important)
echo  2. Wait until Docker shows "Running"
echo  3. Run start.bat
echo.
pause
