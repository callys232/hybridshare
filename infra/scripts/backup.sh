#!/bin/bash
set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/hybridshare-backup-${TIMESTAMP}"
LOG_FILE="/var/log/hybridshare/backup.log"

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
NOTIFY_EMAIL="${BACKUP_NOTIFY_EMAIL:-}"

# ─── Logging ──────────────────────────────────────────────────────────────────
mkdir -p "$(dirname "$LOG_FILE")" "$BACKUP_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

notify_failure() {
    local message="$1"
    log "ERROR: $message"
    if [ -n "${NOTIFY_EMAIL:-}" ] && command -v mail &>/dev/null; then
        echo "$message" | mail -s "[HybridShare] Backup FAILED - $(hostname) $(date)" "$NOTIFY_EMAIL"
    fi
    exit 1
}

log "═══════════════════════════════════════════"
log "Starting HybridShare backup: ${TIMESTAMP}"
log "═══════════════════════════════════════════"

# ─── PostgreSQL dump ──────────────────────────────────────────────────────────
log "Step 1/4: Dumping PostgreSQL database..."
PG_DUMP_FILE="${BACKUP_DIR}/postgres_${TIMESTAMP}.sql.gz"

PGPASSWORD="${POSTGRES_PASSWORD:-}" \
pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-privileges \
    --format=custom \
    --compress=9 \
    | gzip > "$PG_DUMP_FILE" \
    || notify_failure "PostgreSQL dump failed"

log "PostgreSQL dump: $(du -sh "$PG_DUMP_FILE" | cut -f1)"

# ─── MinIO mirror ─────────────────────────────────────────────────────────────
log "Step 2/4: Mirroring MinIO bucket..."
MINIO_BACKUP_DIR="${BACKUP_DIR}/minio"
mkdir -p "$MINIO_BACKUP_DIR"

if command -v mc &>/dev/null; then
    mc alias set "$MINIO_ALIAS" "$MINIO_ENDPOINT" \
        "${MINIO_ACCESS_KEY:-minioadmin}" \
        "${MINIO_SECRET_KEY:-minioadmin}" --quiet

    mc mirror \
        --overwrite \
        --remove \
        "${MINIO_ALIAS}/${MINIO_BUCKET}" \
        "$MINIO_BACKUP_DIR" \
        || notify_failure "MinIO mirror failed"

    log "MinIO mirror: $(du -sh "$MINIO_BACKUP_DIR" | cut -f1)"
else
    log "WARNING: mc not found, skipping MinIO mirror"
fi

# ─── Redis snapshot ───────────────────────────────────────────────────────────
log "Step 3/4: Creating Redis snapshot..."
REDIS_BACKUP_FILE="${BACKUP_DIR}/redis_${TIMESTAMP}.rdb"

if command -v redis-cli &>/dev/null; then
    redis-cli BGSAVE || log "WARNING: Redis BGSAVE failed"
    sleep 3

    REDIS_RDB="${REDIS_DIR:-/data}/dump.rdb"
    if [ -f "$REDIS_RDB" ]; then
        cp "$REDIS_RDB" "$REDIS_BACKUP_FILE"
        log "Redis snapshot: $(du -sh "$REDIS_BACKUP_FILE" | cut -f1)"
    else
        log "WARNING: Redis RDB not found at $REDIS_RDB"
    fi
else
    log "WARNING: redis-cli not found, skipping Redis backup"
fi

# ─── Compress all ─────────────────────────────────────────────────────────────
log "Step 4/4: Compressing and uploading backup..."
ARCHIVE_FILE="/tmp/hybridshare-backup-${TIMESTAMP}.tar.gz"

tar -czf "$ARCHIVE_FILE" -C "$(dirname "$BACKUP_DIR")" "$(basename "$BACKUP_DIR")" \
    || notify_failure "Compression failed"

log "Archive: $(du -sh "$ARCHIVE_FILE" | cut -f1)"

# ─── Upload to Restic ─────────────────────────────────────────────────────────
if [ -n "${RESTIC_REPO:-}" ] && command -v restic &>/dev/null; then
    RESTIC_PASSWORD="$RESTIC_PASS" \
    restic backup \
        --repo "$RESTIC_REPO" \
        --tag "hybridshare,backup,${TIMESTAMP}" \
        "$BACKUP_DIR" \
        || notify_failure "Restic upload failed"

    RESTIC_PASSWORD="$RESTIC_PASS" \
    restic forget \
        --repo "$RESTIC_REPO" \
        --keep-daily 7 \
        --keep-weekly 4 \
        --keep-monthly 12 \
        --prune \
        || log "WARNING: Restic prune failed"

    log "Backup uploaded to Restic repository"
else
    log "WARNING: Restic not configured, backup stored locally at $ARCHIVE_FILE"
fi

# ─── Cleanup ──────────────────────────────────────────────────────────────────
rm -rf "$BACKUP_DIR"
log "Temporary files cleaned up"

log "═══════════════════════════════════════════"
log "Backup complete: ${TIMESTAMP}"
log "═══════════════════════════════════════════"

# Send success email
if [ -n "${NOTIFY_EMAIL:-}" ] && command -v mail &>/dev/null; then
    echo "HybridShare backup completed successfully at $(date)" | \
        mail -s "[HybridShare] Backup succeeded - $(hostname)" "$NOTIFY_EMAIL"
fi
