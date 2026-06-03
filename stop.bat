@echo off
setlocal EnableExtensions

cd /d "%~dp0"

where docker >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker not found.
    pause
    exit /b 1
)

echo Stopping PlazmaApi...
docker compose down

echo.
echo Done. Database data is kept in Docker volume.
echo To remove database too: docker compose down -v
echo.
pause
