#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: Docker no está instalado o no está disponible en PATH." >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Error: falta el fichero .env requerido por docker-compose.yml." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Error: Docker Compose no está disponible." >&2
  exit 1
fi

echo "Deteniendo el contenedor app..."
docker compose stop app

echo "Eliminando el contenedor app..."
docker compose rm --force app

echo "Reconstruyendo y recreando app en modo producción..."
docker compose up --detach --build app

for attempt in {1..30}; do
  if [[ -n "$(docker compose ps --status running --quiet app)" ]]; then
    echo "El contenedor app está ejecutándose."
    docker compose ps app
    exit 0
  fi
  sleep 2
done

echo "Error: app no se ha mantenido en ejecución." >&2
docker compose ps app >&2 || true
docker compose logs --tail=100 app >&2 || true
exit 1
