#!/bin/sh
# Backup do banco de produção (pg_dump compactado), mantendo os 14 mais recentes.
#
# Uso manual (na VPS, na pasta do projeto):  ./scripts/backup-db.sh
# Agendado (todo dia às 4h), via "crontab -e":
#   0 4 * * * cd /home/SEU_USUARIO/bolao-tga && ./scripts/backup-db.sh >> backups/backup.log 2>&1
#
# Restaurar um backup (APAGA os dados atuais do banco):
#   gunzip -c backups/ARQUIVO.sql.gz | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
set -eu

cd "$(dirname "$0")/.."
mkdir -p backups

FILE="backups/bolao-$(date +%Y%m%d-%H%M%S).sql.gz"

# --clean/--if-exists: o arquivo já sabe recriar as tabelas ao ser restaurado
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' | gzip > "$FILE"

echo "Backup salvo em $FILE ($(du -h "$FILE" | cut -f1))"

# Mantém só os 14 backups mais recentes
ls -1t backups/bolao-*.sql.gz | tail -n +15 | while read -r old; do
  rm -- "$old"
  echo "Removido backup antigo: $old"
done
