@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

where docker >nul 2>&1
if errorlevel 1 goto no_docker

echo Checking Docker...
set ready=0
for /L %%i in (1,1,30) do (
    docker info >nul 2>&1
    if not errorlevel 1 (
        set ready=1
        goto docker_ready
    )
    echo   waiting for Docker... %%i/30
    timeout /t 2 /nobreak >nul
)

:docker_ready
if "!ready!"=="0" goto docker_not_running

if not exist ".env" (
    copy /Y ".env.example" ".env" >nul
    echo Created .env from .env.example
    echo.
)

echo.
echo Step 1/3: Pull images (postgres)...
docker compose pull db
if errorlevel 1 goto network_error

echo.
echo Step 2/3: Build application (Maven compile, may take several minutes)...
docker compose build app --progress=plain
if errorlevel 1 goto compose_failed

echo.
echo Step 3/3: Start containers...
docker compose up -d
if errorlevel 1 goto compose_failed

echo.
echo Waiting for the application...
set tries=0

:wait_loop
set /a tries+=1
if !tries! GTR 60 goto wait_timeout

powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:8081/actuator/health' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } } catch { }; exit 1" >nul 2>&1
if not errorlevel 1 goto ready

timeout /t 2 /nobreak >nul
goto wait_loop

:wait_timeout
echo App is still starting. Open in browser: http://localhost:8081
goto finish

:ready
echo Application is ready.
start "" "http://localhost:8081"

:finish
echo.
echo  URL:    http://localhost:8081
echo  Logs:   docker compose logs -f app
echo  Stop:   stop.bat
echo  Reset:  fix-docker.bat
echo.
docker compose ps 2>nul
if errorlevel 1 echo NOTE: Could not list containers. Try fix-docker.bat
echo.
pause
exit /b 0

:no_docker
echo ERROR: Docker not found.
echo Install Docker Desktop for Windows:
echo https://docs.docker.com/desktop/setup/install/windows-install/
echo.
pause
exit /b 1

:docker_not_running
echo ERROR: Docker is not running.
echo 1. Open Docker Desktop
echo 2. Wait until status is "Running"
echo 3. Run start.bat again
echo.
pause
exit /b 1

:network_error
echo.
echo ERROR: Docker cannot download images (no such host / network).
echo.
echo This is usually a DNS or internet problem on Windows.
echo Try:
echo  1. Restart Docker Desktop
echo  2. Docker Desktop - Settings - Resources - Network - DNS: 8.8.8.8
echo  3. Turn off VPN / proxy temporarily
echo  4. Run fix-docker.bat, then start.bat again
echo  5. Check internet in browser
echo.
echo Last docker error:
docker compose pull db
echo.
pause
exit /b 1

:compose_failed
echo.
echo ERROR: Failed to build or start containers.
echo.
echo If build failed on "mvnw package":
echo  - scroll up and find the first [ERROR] line in Maven output
echo  - common causes: no internet, Docker DNS, or broken mvnw line endings
echo.
echo Try:
echo  1. Run fix-docker.bat
echo  2. Restart Docker Desktop
echo  3. Run: docker compose build app --progress=plain
echo  4. Run start.bat again
echo.
echo Last status:
docker compose ps 2>nul
docker compose logs --tail 20 2>nul
echo.
pause
exit /b 1
