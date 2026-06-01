import { getPrisma } from '../config/database';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const prisma = getPrisma();

export const organizationService = {
  // ─── Org CRUD ────────────────────────────────────────────────────────────────

  async createOrg(data: {
    name: string;
    slug: string;
    ownerId: string;
    domain?: string;
    logoUrl?: string;
    primaryColor?: string;
    plan?: string;
  }) {
    const existing = await prisma.organization.findUnique({ where: { slug: data.slug } });
    if (existing) throw Object.assign(new Error('Organization slug already taken'), { statusCode: 409 });

    const org = await prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        domain: data.domain,
        logoUrl: data.logoUrl,
        plan: (data.plan as never) ?? 'FREE',
        isActive: true,
      },
    });

    // Add owner as OWNER member
    await prisma.orgMember.create({
      data: { organizationId: org.id, userId: data.ownerId, role: 'OWNER' },
    });

    logger.info('Organization created', { orgId: org.id, owner: data.ownerId });
    return org;
  },

  async getOrg(orgIdOrSlug: string) {
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

  async updateOrg(orgId: string, data: Partial<{
    name: string;
    domain: string;
    logoUrl: string;
    faviconUrl: string;
    description: string;
  }>) {
    return prisma.organization.update({ where: { id: orgId }, data });
  },

  // ─── Members ─────────────────────────────────────────────────────────────────

  async listMembers(orgId: string, params: { page?: number; limit?: number; role?: string } = {}) {
    const { page = 1, limit = 20, role } = params;
    const where: Record<string, unknown> = { organizationId: orgId };
    if (role) where.role = role;

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

  async inviteMember(orgId: string, inviterId: string, email: string, role: 'ADMIN' | 'INSTRUCTOR' | 'MEMBER') {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw Object.assign(new Error('User not found with that email'), { statusCode: 404 });

    const existing = await prisma.orgMember.findFirst({ where: { organizationId: orgId, userId: user.id } });
    if (existing) throw Object.assign(new Error('User is already a member'), { statusCode: 409 });

    const member = await prisma.orgMember.create({
      data: { organizationId: orgId, userId: user.id, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    logger.info('Member invited', { orgId, userId: user.id, role, inviterId });
    return member;
  },

  async updateMemberRole(orgId: string, memberId: string, adminId: string, role: string) {
    // Cannot demote yourself if you're the only owner
    const member = await prisma.orgMember.findFirstOrThrow({ where: { id: memberId, organizationId: orgId } });
    if (member.userId === adminId && role !== 'OWNER') {
      const ownerCount = await prisma.orgMember.count({ where: { organizationId: orgId, role: 'OWNER' } });
      if (ownerCount <= 1) throw Object.assign(new Error('Cannot remove the last owner'), { statusCode: 400 });
    }
    return prisma.orgMember.update({ where: { id: memberId }, data: { role: role as never } });
  },

  async removeMember(orgId: string, memberId: string, adminId: string) {
    const member = await prisma.orgMember.findFirstOrThrow({ where: { id: memberId, organizationId: orgId } });
    if (member.role === 'OWNER') {
      const ownerCount = await prisma.orgMember.count({ where: { organizationId: orgId, role: 'OWNER' } });
      if (ownerCount <= 1) throw Object.assign(new Error('Cannot remove the last owner'), { statusCode: 400 });
    }
    await prisma.orgMember.delete({ where: { id: memberId } });
  },

  // ─── SSO Configuration ───────────────────────────────────────────────────────

  async setSSOConfig(orgId: string, data: {
    provider: 'SAML' | 'OIDC' | 'LDAP';
    entityId?: string;
    ssoUrl?: string;
    certificate?: string;
    clientId?: string;
    clientSecret?: string;
    issuer?: string;
    ldapUrl?: string;
    ldapBindDn?: string;
    ldapBindPassword?: string;
    ldapUserBase?: string;
  }) {
    return prisma.sSOConfig.upsert({
      where: { organizationId: orgId },
      update: { ...data },
      create: { organizationId: orgId, ...data, isEnabled: false } as never,
    });
  },

  async toggleSSO(orgId: string, enabled: boolean) {
    return prisma.sSOConfig.update({ where: { organizationId: orgId }, data: { isEnabled: enabled } });
  },

  // ─── White-labeling ──────────────────────────────────────────────────────────

  async setWhiteLabel(orgId: string, data: {
    brandName?: string;
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
    customDomain?: string;
    emailFromName?: string;
    emailFromAddress?: string;
    footerText?: string;
    hideHybridShareBranding?: boolean;
  }) {
    return prisma.orgWhiteLabel.upsert({
      where: { organizationId: orgId },
      update: data,
      create: { organizationId: orgId, ...data } as never,
    });
  },

  // ─── API Keys ────────────────────────────────────────────────────────────────

  async createAPIKey(orgId: string, userId: string, data: {
    name: string;
    scopes: string[];
    expiresInDays?: number;
  }) {
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
    if (invalid.length) throw Object.assign(new Error(`Invalid scopes: ${invalid.join(', ')}`), { statusCode: 400 });

    const rawKey = `hs_${crypto.randomBytes(24).toString('base64url')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
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

    logger.info('API key created', { keyId: key.id, orgId, userId, scopes: data.scopes });
    // Return raw key ONCE — never stored again
    return { ...key, rawKey, keyHash: undefined };
  },

  async listAPIKeys(orgId: string) {
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

  async revokeAPIKey(keyId: string, orgId: string) {
    return prisma.aPIKey.update({
      where: { id: keyId, organizationId: orgId },
      data: { isActive: false },
    });
  },

  // ─── Webhooks ────────────────────────────────────────────────────────────────

  async createWebhook(orgId: string, userId: string, data: {
    url: string;
    events: string[];
    description?: string;
  }) {
    const secret = crypto.randomBytes(32).toString('hex');
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
    logger.info('Webhook created', { webhookId: webhook.id, orgId, url: data.url });
    // Return secret once
    return { ...webhook, secret };
  },

  async listWebhooks(orgId: string) {
    return prisma.webhook.findMany({
      where: { organizationId: orgId },
      select: {
        id: true, url: true, events: true, isActive: true,
        description: true, failureCount: true, lastTriggeredAt: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async deleteWebhook(webhookId: string, orgId: string) {
    return prisma.webhook.delete({ where: { id: webhookId, organizationId: orgId } });
  },

  // ─── Stats ───────────────────────────────────────────────────────────────────

  async getOrgStats(orgId: string) {
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
