#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$(dirname "$SCRIPT_DIR")/../.env" 2>/dev/null || true

DB_NAME="${POSTGRES_DB:-hybridshare}"
DB_USER="${POSTGRES_USER:-hybridshare}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

MINIO_ALIAS="hybridshare-minio"
MINIO_BUCKET="${MINIO_BUCKET:-hybridshare}"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://localhost:9000}"
RESTIC_REPO="${RESTIC_REPOSITORY:-}"
RESTIC_PASS="${RESTIC_PASSWORD:-}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

log "HybridShare Restore Utility"
log "═══════════════════════════"

if [ -z "${RESTIC_REPO:-}" ]; then
    echo "ERROR: RESTIC_REPOSITORY not configured"
    exit 1
fi

# List available snapshots
log "Available backups:"
RESTIC_PASSWORD="$RESTIC_PASS" restic snapshots --repo "$RESTIC_REPO" --tag "hybridshare"

echo ""
read -r -p "Enter snapshot ID to restore (or 'latest'): " SNAPSHOT_ID

RESTORE_DIR="/tmp/hybridshare-restore-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESTORE_DIR"

log "Restoring snapshot $SNAPSHOT_ID..."
RESTIC_PASSWORD="$RESTIC_PASS" restic restore "$SNAPSHOT_ID" \
    --repo "$RESTIC_REPO" \
    --target "$RESTORE_DIR"

# Find the backup directory
BACKUP_SUBDIR=$(find "$RESTORE_DIR" -maxdepth 2 -name "postgres_*.sql.gz" -exec dirname {} \; | head -1)

if [ -z "$BACKUP_SUBDIR" ]; then
    echo "ERROR: Could not find backup files in restore"
    exit 1
fi

# Restore PostgreSQL
PG_DUMP=$(find "$BACKUP_SUBDIR" -name "postgres_*.sql.gz" | head -1)
if [ -n "$PG_DUMP" ]; then
    log "Restoring PostgreSQL from $PG_DUMP..."
    read -r -p "⚠️  This will DROP and recreate the database. Continue? (yes/no): " CONFIRM
    if [ "$CONFIRM" = "yes" ]; then
        PGPASSWORD="${POSTGRES_PASSWORD:-}" \
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "DROP DATABASE IF EXISTS ${DB_NAME};"
        PGPASSWORD="${POSTGRES_PASSWORD:-}" \
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE ${DB_NAME};"
        gunzip -c "$PG_DUMP" | \
        PGPASSWORD="${POSTGRES_PASSWORD:-}" \
        pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --no-owner --no-privileges
        log "PostgreSQL restored"
    fi
fi

# Restore MinIO
MINIO_BACKUP="${BACKUP_SUBDIR}/minio"
if [ -d "$MINIO_BACKUP" ] && command -v mc &>/dev/null; then
    log "Restoring MinIO bucket..."
    mc alias set "$MINIO_ALIAS" "$MINIO_ENDPOINT" \
        "${MINIO_ACCESS_KEY:-minioadmin}" \
        "${MINIO_SECRET_KEY:-minioadmin}" --quiet

    mc mirror --overwrite "$MINIO_BACKUP" "${MINIO_ALIAS}/${MINIO_BUCKET}"
    log "MinIO restored"
fi

# Restore Redis
REDIS_BACKUP=$(find "$BACKUP_SUBDIR" -name "redis_*.rdb" | head -1)
if [ -n "$REDIS_BACKUP" ]; then
    REDIS_DIR="${REDIS_DIR:-/data}"
    log "Restoring Redis snapshot to $REDIS_DIR/dump.rdb..."
    redis-cli SHUTDOWN NOSAVE 2>/dev/null || true
    sleep 2
    cp "$REDIS_BACKUP" "${REDIS_DIR}/dump.rdb"
    log "Redis snapshot restored — restart Redis to load"
fi

rm -rf "$RESTORE_DIR"
log "Restore complete. Restart services: docker compose restart api"
