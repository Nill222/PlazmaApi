# Запуск: правый клик -> "Выполнить с помощью PowerShell"
# или: powershell -ExecutionPolicy Bypass -File .\start.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[Ошибка] Docker не найден. Установите Docker Desktop для Windows." -ForegroundColor Red
    Read-Host "Нажмите Enter для выхода"
    exit 1
}

try {
    docker info *> $null
} catch {
    Write-Host "[Ошибка] Docker не запущен. Откройте Docker Desktop." -ForegroundColor Red
    Read-Host "Нажмите Enter для выхода"
    exit 1
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Создан файл .env из .env.example"
}

Write-Host "Сборка и запуск PlazmaApi..."
docker compose up --build -d

$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:8081/actuator/health" -UseBasicParsing -TimeoutSec 2
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
    Start-Sleep -Seconds 2
}

if ($ready) {
    Write-Host "Приложение готово." -ForegroundColor Green
    Start-Process "http://localhost:8081"
} else {
    Write-Host "Приложение ещё стартует. Откройте: http://localhost:8081"
}

Write-Host ""
Write-Host "URL:       http://localhost:8081"
Write-Host "Остановка: .\stop.bat"
docker compose ps
Read-Host "Нажмите Enter для выхода"
