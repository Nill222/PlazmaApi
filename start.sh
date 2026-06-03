#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Создан .env из .env.example — при необходимости отредактируйте пароли."
fi

docker compose up --build -d

echo ""
echo "Запуск..."
docker compose ps

echo ""
echo "Приложение: http://localhost:${APP_PORT:-8081}"
echo "Логи:       docker compose logs -f app"
echo "Остановка:  docker compose down"
