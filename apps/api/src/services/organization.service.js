"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationService = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const crypto_1 = __importDefault(require("crypto"));
const prisma = (0, database_1.getPrisma)();
exports.organizationService = {
    // ─── Org CRUD ────────────────────────────────────────────────────────────────
    async createOrg(data) {
        const existing = await prisma.organization.findUnique({ where: { slug: data.slug } });
        if (existing)
            throw Object.assign(new Error('Organization slug already taken'), { statusCode: 409 });
        const org = await prisma.organization.create({
            data: {
                name: data.name,
                slug: data.slug,
                domain: data.domain,
                logoUrl: data.logoUrl,
                plan: data.plan ?? 'FREE',
                isActive: true,
            },
        });
        // Add owner as OWNER member
        await prisma.orgMember.create({
            data: { organizationId: org.id, userId: data.ownerId, role: 'OWNER' },
        });
        logger_1.logger.info('Organization created', { orgId: org.id, owner: data.ownerId });
        return org;
    },
    async getOrg(orgIdOrSlug) {
        const where = orgIdOrSlug.length === 25
            ? { id: orgIdOrSlug }
            : { slug: orgIdOrSlug };
        return prisma.organization.findUniqueOrThrow({
            where,
            include: {
                members: {
                    take: 5,
                    include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
                },
                whiteLabel: true,
            },
        });
    },
    async updateOrg(orgId, data) {
        return prisma.organization.update({ where: { id: orgId }, data });
    },
    // ─── Members ─────────────────────────────────────────────────────────────────
    async listMembers(orgId, params = {}) {
        const { page = 1, limit = 20, role } = params;
        const where = { organizationId: orgId };
        if (role)
            where.role = role;
        const [items, total] = await Promise.all([
            prisma.orgMember.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: { user: { select: { id: true, name: true, email: true, avatar: true, xpPoints: true } } },
                orderBy: { createdAt: 'asc' },
            }),
            prisma.orgMember.count({ where }),
        ]);
        return { items, meta: { total, page, limit } };
    },
    async inviteMember(orgId, inviterId, email, role) {
        // Check if user exists
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            throw Object.assign(new Error('User not found with that email'), { statusCode: 404 });
        const existing = await prisma.orgMember.findFirst({ where: { organizationId: orgId, userId: user.id } });
        if (existing)
            throw Object.assign(new Error('User is already a member'), { statusCode: 409 });
        const member = await prisma.orgMember.create({
            data: { organizationId: orgId, userId: user.id, role },
            include: { user: { select: { id: true, name: true, email: true } } },
        });
        logger_1.logger.info('Member invited', { orgId, userId: user.id, role, inviterId });
        return member;
    },
    async updateMemberRole(orgId, memberId, adminId, role) {
        // Cannot demote yourself if you're the only owner
        const member = await prisma.orgMember.findFirstOrThrow({ where: { id: memberId, organizationId: orgId } });
        if (member.userId === adminId && role !== 'OWNER') {
            const ownerCount = await prisma.orgMember.count({ where: { organizationId: orgId, role: 'OWNER' } });
            if (ownerCount <= 1)
                throw Object.assign(new Error('Cannot remove the last owner'), { statusCode: 400 });
        }
        return prisma.orgMember.update({ where: { id: memberId }, data: { role: role } });
    },
    async removeMember(orgId, memberId, adminId) {
        const member = await prisma.orgMember.findFirstOrThrow({ where: { id: memberId, organizationId: orgId } });
        if (member.role === 'OWNER') {
            const ownerCount = await prisma.orgMember.count({ where: { organizationId: orgId, role: 'OWNER' } });
            if (ownerCount <= 1)
                throw Object.assign(new Error('Cannot remove the last owner'), { statusCode: 400 });
        }
        await prisma.orgMember.delete({ where: { id: memberId } });
    },
    // ─── SSO Configuration ───────────────────────────────────────────────────────
    async setSSOConfig(orgId, data) {
        return prisma.sSOConfig.upsert({
            where: { organizationId: orgId },
            update: { ...data },
            create: { organizationId: orgId, ...data, isEnabled: false },
        });
    },
    async toggleSSO(orgId, enabled) {
        return prisma.sSOConfig.update({ where: { organizationId: orgId }, data: { isEnabled: enabled } });
    },
    // ─── White-labeling ──────────────────────────────────────────────────────────
    async setWhiteLabel(orgId, data) {
        return prisma.orgWhiteLabel.upsert({
            where: { organizationId: orgId },
            update: data,
            create: { organizationId: orgId, ...data },
        });
    },
    // ─── API Keys ────────────────────────────────────────────────────────────────
    async createAPIKey(orgId, userId, data) {
        // Validate scopes
        const VALID_SCOPES = [
            'courses:read', 'courses:write',
            'enrollments:read', 'enrollments:write',
            'gamification:read',
            'events:write',
            'certificates:read',
            'organizations:read', 'organizations:write',
            'users:read',
            '*',
        ];
        const invalid = data.scopes.filter((s) => !VALID_SCOPES.includes(s));
        if (invalid.length)
            throw Object.assign(new Error(`Invalid scopes: ${invalid.join(', ')}`), { statusCode: 400 });
        const rawKey = `hs_${crypto_1.default.randomBytes(24).toString('base64url')}`;
        const keyHash = crypto_1.default.createHash('sha256').update(rawKey).digest('hex');
        const prefix = rawKey.slice(0, 12);
        const key = await prisma.aPIKey.create({
            data: {
                organizationId: orgId,
                createdById: userId,
                name: data.name,
                keyHash,
                prefix,
                scopes: data.scopes,
                isActive: true,
                expiresAt: data.expiresInDays
                    ? new Date(Date.now() + data.expiresInDays * 86400000)
                    : null,
                requestCount: 0,
            },
        });
        logger_1.logger.info('API key created', { keyId: key.id, orgId, userId, scopes: data.scopes });
        // Return raw key ONCE — never stored again
        return { ...key, rawKey, keyHash: undefined };
    },
    async listAPIKeys(orgId) {
        return prisma.aPIKey.findMany({
            where: { organizationId: orgId },
            select: {
                id: true, name: true, prefix: true, scopes: true,
                isActive: true, lastUsedAt: true, expiresAt: true,
                requestCount: true, createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    },
    async revokeAPIKey(keyId, orgId) {
        return prisma.aPIKey.update({
            where: { id: keyId, organizationId: orgId },
            data: { isActive: false },
        });
    },
    // ─── Webhooks ────────────────────────────────────────────────────────────────
    async createWebhook(orgId, userId, data) {
        const secret = crypto_1.default.randomBytes(32).toString('hex');
        const webhook = await prisma.webhook.create({
            data: {
                organizationId: orgId,
                createdById: userId,
                url: data.url,
                events: data.events,
                description: data.description,
                secret,
                isActive: true,
                failureCount: 0,
            },
        });
        logger_1.logger.info('Webhook created', { webhookId: webhook.id, orgId, url: data.url });
        // Return secret once
        return { ...webhook, secret };
    },
    async listWebhooks(orgId) {
        return prisma.webhook.findMany({
            where: { organizationId: orgId },
            select: {
                id: true, url: true, events: true, isActive: true,
                description: true, failureCount: true, lastTriggeredAt: true, createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    },
    async deleteWebhook(webhookId, orgId) {
        return prisma.webhook.delete({ where: { id: webhookId, organizationId: orgId } });
    },
    // ─── Stats ───────────────────────────────────────────────────────────────────
    async getOrgStats(orgId) {
        const [members, courses, enrollments] = await Promise.all([
            prisma.orgMember.count({ where: { organizationId: orgId } }),
            prisma.course.count({ where: { organizationId: orgId } }),
            prisma.enrollment.count({
                where: { course: { organizationId: orgId } },
            }),
        ]);
        return { members, courses, enrollments };
    },
};
//# sourceMappingURL=organization.service.js.map