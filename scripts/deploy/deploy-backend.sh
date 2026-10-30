#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.prod}"
COMPOSE_FILE="${2:-docker-compose.prod.yml}"

echo "==> Deploying backend services using ${COMPOSE_FILE} and ${ENV_FILE}..."

# Remove any existing/stale runner image so no incompatible architecture image (e.g. amd64 on arm64) remains
echo "==> Clearing any stale runner image..."
sudo docker image rm -f pedroaug4/algo-runner:latest >/dev/null 2>&1 || true

# Rebuild runner locally without cache for the current host architecture
echo "==> Building runner image locally for host architecture..."
sudo docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" build --no-cache runner

# Validate that the built runner image executes on the host architecture without pulling from Docker Hub
echo "==> Verifying local runner image execution..."
sudo docker run --pull never --rm --entrypoint /bin/sh pedroaug4/algo-runner:latest -c \
  'command -v av-instrumenter >/dev/null && test -x /usr/local/bin/av-runner'

# Start services (MySQL, runner verification, and API)
echo "==> Starting backend services..."
sudo docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --build --remove-orphans mysql runner api

# Clean dangling images
echo "==> Pruning dangling build images..."
sudo docker image prune -f

echo "==> Backend deploy completed successfully."
