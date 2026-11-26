#!/bin/sh
# Executado a cada início do container da API.
set -e

echo "[entrypoint] Aplicando migrations pendentes..."
./node_modules/.bin/prisma migrate deploy

echo "[entrypoint] Iniciando a API..."
exec "$@"
