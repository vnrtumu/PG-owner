#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
umask 077
mkdir -p backups
backup_stamp=$(date -u +%Y%m%dT%H%M%SZ)
docker compose exec -T db pg_dump -U pgowner -d pgowner -Fc > "backups/database-${backup_stamp}.dump"
docker compose exec -T app tar -C /app/uploads -czf - . > "backups/uploads-${backup_stamp}.tar.gz"
printf 'Backup complete: %s. Copy both files to encrypted off-server storage.\n' "$backup_stamp"
