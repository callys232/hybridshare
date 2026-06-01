#!/bin/bash
set -euo pipefail

source "$(dirname "$(dirname "${BASH_SOURCE[0]}")")/.env" 2>/dev/null || true

DOMAIN="${NGINX_DOMAIN:-yourdomain.com}"
EMAIL="${SSL_EMAIL:-admin@yourdomain.com}"
WEBROOT="/var/www/certbot"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

log "Checking SSL certificate renewal for $DOMAIN"

if command -v certbot &>/dev/null; then
    certbot renew \
        --webroot \
        --webroot-path "$WEBROOT" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive \
        --quiet

    log "Reloading Nginx..."
    docker compose exec nginx nginx -s reload 2>/dev/null || \
        nginx -s reload 2>/dev/null || \
        log "WARNING: Could not reload Nginx"

    log "SSL renewal check complete"
else
    log "ERROR: certbot not found"
    exit 1
fi
