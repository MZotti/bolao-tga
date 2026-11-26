#!/bin/sh
# Atualiza o bolão na VPS com a versão mais recente do repositório.
# Uso (na VPS, dentro da pasta do projeto):  ./deploy.sh
set -eu

cd "$(dirname "$0")"

echo "==> Baixando a versão mais recente"
git pull --ff-only

echo "==> Reconstruindo e subindo os containers"
# A API aplica as migrations pendentes sozinha ao iniciar
docker compose up -d --build

echo "==> Removendo imagens antigas"
docker image prune -f

echo "==> Status"
docker compose ps
