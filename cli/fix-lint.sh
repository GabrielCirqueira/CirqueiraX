#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🛠️  Running all auto-fixers..."

echo "🐘 Fixing PHP code style (phpcbf)..."
./cli/phpcbf.sh || echo "⚠️  Some PHP issues could not be fixed automatically."

echo "⚛️  Fixing TypeScript/React issues (biome)..."
if command -v docker >/dev/null 2>&1 && docker compose --env-file devops/ports.env -f devops/docker-compose.yaml ps --services --filter "status=running" 2>/dev/null | grep -q "^vite-react$"; then
  make fix-tsx
else
  npx biome check --write web
fi

echo "✅ Lint fixing complete!"
