#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PORTS_ENV_FILE="${ROOT_DIR}/devops/ports.env"
if [ -f "$PORTS_ENV_FILE" ]; then
  set -a
  source "$PORTS_ENV_FILE"
  set +a
fi

BACKEND_PORT="${BACKEND_PORT:-4010}"
FRONTEND_PORT="${FRONTEND_PORT:-4012}"
COMPOSE_DEV_CMD=${COMPOSE_DEV_CMD:-"docker compose --env-file devops/ports.env -f devops/docker-compose.yaml"}

echo "🔍 Checking backend health..."
$COMPOSE_DEV_CMD exec -T symfony php bin/console dbal:run-sql "SELECT 1" >/dev/null 2>&1 && echo "✅ Symfony Console & Database are responding!" || echo "❌ Symfony Console or Database check failed!"

echo "🌐 Checking Nginx availability..."
if curl -s -f "http://localhost:${BACKEND_PORT}/api/v1/health" > /dev/null; then
  echo "✅ Backend API (Nginx + Symfony) is alive at http://localhost:${BACKEND_PORT}"
else
  echo "❌ Web Server (Nginx) is not reachable at port ${BACKEND_PORT}"
fi

echo "🚀 Frontend server is configured for port ${FRONTEND_PORT}"

