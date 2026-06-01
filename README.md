# HybridShare

Enterprise file sharing and workspace platform — a complete, production-ready replacement for Microsoft SharePoint.

## What's included

- **File management**: Upload, preview, version history, star, bulk operations, recycle bin
- **Workspaces**: Team/project workspaces with granular role-based access control
- **Universal Data Connector (UDC)**: 22+ connectors — Google Drive, Dropbox, OneDrive, S3, SFTP, PostgreSQL, MySQL, MongoDB, HubSpot, Airtable, Notion, and more
- **Share links**: Password-protected, expiry-limited, analytics-tracked sharing
- **Real-time collaboration**: Socket.io presence, notifications, activity feeds
- **Social publishing**: Publish files to Twitter, LinkedIn, Facebook, Instagram, Slack, Teams via Zernio API
- **Analytics**: Storage usage, activity timelines, per-user/workspace breakdowns
- **Task management**: Kanban board with file attachments
- **Admin panel**: User management, audit logs, storage quota management
- **Security**: AES-256-GCM credential encryption, bcrypt passwords, JWT + refresh rotation, 2FA (TOTP), virus scanning (ClamAV), RBAC
- **Infrastructure**: Docker Compose, Nginx, Prometheus + Grafana monitoring, Restic backups, SSL via Let's Encrypt

---

## Prerequisites

- Node.js ≥ 20 LTS
- Docker + Docker Compose ≥ 2.x
- 4 GB RAM minimum (8 GB recommended for production)

---

## Quick Start (Development)

### 1. Clone and install

```bash
git clone https://github.com/yourorg/hybridshare.git
cd hybridshare
cp .env.example .env
npm install
```

### 2. Edit `.env`

At minimum set these values:

```env
DATABASE_URL=postgresql://hybridshare:password@localhost:5432/hybridshare
JWT_SECRET=your-64-char-random-string-here
JWT_REFRESH_SECRET=another-64-char-random-string
AES_ENCRYPTION_KEY=64-hex-characters-for-aes-256-key-here
APP_URL=http://localhost:3000
```

Generate secure keys:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # AES key
```

### 3. Start infrastructure

```bash
docker compose up -d postgres redis minio meilisearch
```

### 4. Run database migrations

```bash
npm run db:migrate
npm run db:generate
```

### 5. Start dev servers

```bash
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:4000
- MinIO Console: http://localhost:9001 (minioadmin / minioadmin)
- Meilisearch: http://localhost:7700

---

## Production Deployment

### 1. Configure production environment

```bash
cp .env.example .env
# Fill all values in .env, especially:
# - Strong JWT_SECRET and JWT_REFRESH_SECRET
# - Real SMTP settings
# - OAuth client IDs/secrets
# - NGINX_DOMAIN for SSL
```

### 2. SSL setup

```bash
# Install certbot on the host, then:
./infra/scripts/ssl-renew.sh
```

Add to cron for auto-renewal:
```bash
0 12 * * * /path/to/hybridshare/infra/scripts/ssl-renew.sh >> /var/log/ssl-renew.log 2>&1
```

### 3. Deploy with Docker

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. Run migrations

```bash
docker compose exec api npx prisma migrate deploy
```

### 5. Set up backups

```bash
chmod +x infra/scripts/backup.sh infra/scripts/restore.sh
# Test backup:
./infra/scripts/backup.sh
# Add to daily cron:
0 2 * * * /path/to/hybridshare/infra/scripts/backup.sh >> /var/log/hybridshare/backup.log 2>&1
```

---

## Monitoring

- Grafana: https://yourdomain.com/grafana (admin / changeme — change in `.env`)
- Prometheus: http://localhost:9090 (internal only)

---

## Project Structure

```
hybridshare/
├── apps/
│   ├── api/          Express.js backend (TypeScript)
│   └── web/          Next.js 14 frontend (TypeScript)
├── packages/
│   └── shared/       Shared types, schemas, utilities
└── infra/
    ├── nginx/        Nginx configuration
    ├── monitoring/   Prometheus + Grafana
    └── scripts/      Backup, restore, SSL renewal
```

---

## Environment Variables Reference

See [.env.example](.env.example) for all available variables with descriptions.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add connectors, routes, and frontend pages.
