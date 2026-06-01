FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

# Dependencies
FROM base AS deps
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --workspace=@hybridshare/api --workspace=@hybridshare/shared

# Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate --schema=apps/api/src/prisma/schema.prisma
RUN npm run build --workspace=@hybridshare/api

# Production
FROM base AS production
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/src/prisma ./prisma
COPY --from=deps /app/node_modules ./node_modules
RUN mkdir -p logs

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
