#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "$0")"

cleanup() {
  trap - INT TERM EXIT
  echo
  echo "Arrêt du backend et du frontend..."
  kill "${BACKEND_PID:-}" "${FRONTEND_PID:-}" 2>/dev/null || true
  wait 2>/dev/null || true
}

trap cleanup INT TERM EXIT

echo "Configuration frontend..."

python3 - <<'PY2'
from pathlib import Path

path = Path("apps/web/src/pages/Demo.tsx")
text = path.read_text()
old = "const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';"
new = "const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';"

if old in text:
    path.write_text(text.replace(old, new, 1))
PY2

cat > apps/web/vite.config.ts <<'VITE'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/health': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/v1': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
});
VITE

echo "Redémarrage de PostgreSQL..."
docker compose restart postgres || docker compose up -d postgres

echo "Attente de PostgreSQL..."
for i in $(seq 1 30); do
  docker compose exec -T postgres pg_isready -U taqaddum -d taqaddum >/dev/null 2>&1 && break
  sleep 1
done

docker compose exec -T postgres pg_isready -U taqaddum -d taqaddum >/dev/null 2>&1 || {
  echo "PostgreSQL n'est pas prêt." >&2
  exit 1
}

echo "Arrêt des anciennes instances..."
pkill -f 'tsx watch src/main.ts' 2>/dev/null || true
pkill -f 'vite' 2>/dev/null || true

echo "Démarrage du backend..."
(
  cd apps/api
  npm run dev
) >/tmp/taqaddum-backend.log 2>&1 &
BACKEND_PID=$!

echo "Attente du backend..."
for i in $(seq 1 30); do
  curl -fsS http://127.0.0.1:3000/health/ready >/dev/null 2>&1 && break
  sleep 1
done

curl -fsS http://127.0.0.1:3000/health/ready >/dev/null 2>&1 || {
  echo "Le backend n'est pas disponible." >&2
  cat /tmp/taqaddum-backend.log >&2
  exit 1
}

echo "Démarrage du frontend..."
(
  cd apps/web
  npm run dev -- --host 0.0.0.0
) >/tmp/taqaddum-frontend.log 2>&1 &
FRONTEND_PID=$!

echo
echo "PostgreSQL, backend et frontend sont démarrés."
echo "Logs backend  : tail -f /tmp/taqaddum-backend.log"
echo "Logs frontend : tail -f /tmp/taqaddum-frontend.log"
echo "Ctrl+C arrête le backend et le frontend."

wait
