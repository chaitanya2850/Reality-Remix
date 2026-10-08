#!/usr/bin/env bash

set -e

CONTAINER_NAME="hacktoberfest_ollama"
IMAGE="ollama/ollama:latest"
MODEL="gemma3:4b"
VOLUME="reality-remix-ollama"

echo "======================================"
echo " Reality Remix - Ollama Setup"
echo "======================================"

# Check Docker
if ! command -v docker >/dev/null 2>&1; then
    echo "Error: Docker is not installed."
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo "Error: Docker is not running."
    exit 1
fi

echo
echo "[1/5] Pulling Ollama Docker image..."
docker pull "$IMAGE"

echo
echo "[2/5] Creating persistent Ollama volume..."
docker volume create "$VOLUME" >/dev/null

echo
echo "[3/5] Starting Ollama container..."

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "Ollama container is already running."
    else
        echo "Starting existing Ollama container..."
        docker start "$CONTAINER_NAME" >/dev/null
    fi
else
    docker run -d \
        --name "$CONTAINER_NAME" \
        -p 11434:11434 \
        -v "$VOLUME:/root/.ollama" \
        "$IMAGE"
fi

echo
echo "[4/5] Waiting for Ollama..."

for i in {1..30}; do
    if curl -fsS http://localhost:11434/api/tags >/dev/null 2>&1; then
        echo "Ollama is ready."
        break
    fi

    if [ "$i" -eq 30 ]; then
        echo "Error: Ollama did not become ready."
        docker logs "$CONTAINER_NAME"
        exit 1
    fi

    sleep 2
done

echo
echo "[5/5] Pulling $MODEL..."

docker exec "$CONTAINER_NAME" ollama pull "$MODEL"

echo
echo "======================================"
echo " Ollama setup complete!"
echo "======================================"
echo
echo "Container : $CONTAINER_NAME"
echo "Model     : $MODEL"
echo "API       : http://localhost:11434"
echo
echo "Verify with:"
echo "  curl http://localhost:11434/api/tags"
echo
