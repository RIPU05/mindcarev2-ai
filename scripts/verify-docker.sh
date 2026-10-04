#!/usr/bin/env bash
# MindCare AI v2.0 - Docker Environment & Runtime Validation Script (Bash)

set -e

echo "=== MindCare AI Docker Validation ==="

python scripts/check_docker.py
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    exit 0
fi

echo "Validating docker-compose.yml configuration..."
docker compose config --quiet
echo "[PASS] Compose configuration valid."

echo "Building Docker containers..."
docker compose build
echo "[PASS] Docker build succeeded."

echo "Starting container stack..."
docker compose up -d

echo "Waiting for backend service health..."
ATTEMPTS=0
MAX_ATTEMPTS=15
HEALTHY=false

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    sleep 2
    ATTEMPTS=$((ATTEMPTS + 1))
    if curl -s -f http://localhost:8000/health/live >/dev/null 2>&1; then
        HEALTHY=true
        break
    fi
done

echo "Stopping container stack..."
docker compose down

if [ "$HEALTHY" = true ]; then
    echo "[PASS] Backend container is healthy."
    echo "=== Docker Verification SUCCESS ==="
    exit 0
else
    echo "[FAIL] Backend container healthcheck timed out."
    echo "=== Docker Verification FAILED ==="
    exit 1
fi
