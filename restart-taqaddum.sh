#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

cleanup() {
  trap - INT TERM EXIT
  echo
  echo "Arrêt des services..."
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" 2>/dev/null || true
  [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

command -v docker >/dev/null 2>&1 || { echo "Erreur : docker est introuvable." >&2; exit 1; }

if [[ ! -f docker-compose.yml && ! -f compose.yml && ! -f docker-compose.yaml && ! -f compose.yaml ]]; then
  echo "Erreur : fichier Compose introuvable dans $ROOT_DIR" >&2
  exit 1
fi

echo "Redémarrage de PostgreSQL..."
docker compose restart postgres || docker compose up -d postgres

echo "Attente de PostgreSQL..."
for _ in {1..30}; do
  if docker compose exec -T postgres pg_isready -U taqaddum -d taqaddum >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

docker compose exec -T postgres pg_isready -U taqaddum -d taqaddum >/dev/null 2>&1 || {
  echo "Erreur : PostgreSQL n'est pas prêt." >&2
  exit 1
}

echo "Démarrage du backend..."
if [[ -f apps/api/package.json ]]; then
  (cd apps/api && npm run dev) > /tmp/taqaddum-backend.log 2>&1 &
  BACKEND_PID=$!
else
  echo "Erreur : apps/api/package.json introuvable." >&2
  exit 1
fi

echo "Démarrage du frontend..."
if [[ -f apps/web/package.json ]]; then
  (cd apps/web && npm run dev -- --host 0.0.0.0) > /tmp/taqaddum-frontend.log 2>&1 &
  FRONTEND_PID=$!
else
  echo "Erreur : apps/web/package.json introuvable." >&2
  exit 1
fi

echo
echo "Services démarrés."
echo "Logs backend  : /tmp/taqaddum-backend.log"
echo "Logs frontend : /tmp/taqaddum-frontend.log"
echo "Appuyez sur Ctrl+C pour arrêter frontend et backend."

wait