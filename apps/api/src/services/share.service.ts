import { prisma } from '../config/database';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { generateShortToken } from '../utils/crypto';
import { buildMeta, parsePagination } from '../utils/paginate';
import type { CreateShareLinkInput } from '@hybridshare/shared/schemas/file.schema';
import type { PaginationQuery } from '../utils/paginate';

export class ShareService {
  async createShareLink(userId: string, input: CreateShareLinkInput) {
    const token = generateShortToken(16);
    const passwordHash = input.password ? await hashPassword(input.password) : null;

    const shareLink = await prisma.shareLink.create({
      data: {
        token,
        fileId: input.fileId || null,
        folderId: input.folderId || null,
        workspaceId: input.workspaceId || null,
        createdById: userId,
        permissions: input.permissions as string[],
        passwordHash,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        maxViews: input.maxViews || null,
      },
    });

    return shareLink;
  }

  async resolveShareLink(token: string) {
    const link = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        file: {
          include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
        },
        folder: true,
        workspace: { select: { id: true, name: true, iconUrl: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!link || !link.isActive) {
      throw Object.assign(new Error('Share link not found or revoked'), { statusCode: 404 });
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      throw Object.assign(new Error('Share link has expired'), { statusCode: 410 });
    }

    if (link.maxViews && link.viewCount >= link.maxViews) {
      throw Object.assign(new Error('Share link view limit reached'), { statusCode: 410 });
    }

    return {
      id: link.id,
      token: link.token,
      permissions: link.permissions,
      hasPassword: !!link.passwordHash,
      expiresAt: link.expiresAt,
      file: link.file,
      folder: link.folder,
      workspace: link.workspace,
      createdBy: link.createdBy,
    };
  }

  async verifySharePassword(token: string, password: string): Promise<boolean> {
    const link = await prisma.shareLink.findUnique({ where: { token } });
    if (!link?.passwordHash) return true;

    const valid = await verifyPassword(password, link.passwordHash);
    if (!valid) throw Object.assign(new Error('Incorrect password'), { statusCode: 401 });

    await prisma.shareLink.update({
      where: { token },
      data: { viewCount: { increment: 1 } },
    });

    return true;
  }

  async recordView(
    token: string,
    ipAddress?: string,
    userAgent?: string,
    referrer?: string
  ): Promise<void> {
    const link = await prisma.shareLink.findUnique({ where: { token } });
    if (!link) return;

    await Promise.all([
      prisma.shareLinkView.create({
        data: { shareLinkId: link.id, ipAddress, userAgent, referrer },
      }),
      prisma.shareLink.update({
        where: { id: link.id },
        data: { viewCount: { increment: 1 } },
      }),
    ]);
  }

  async revokeShareLink(id: string, userId: string): Promise<void> {
    const link = await prisma.shareLink.findFirst({ where: { id, createdById: userId } });
    if (!link) throw Object.assign(new Error('Share link not found'), { statusCode: 404 });

    await prisma.shareLink.update({ where: { id }, data: { isActive: false } });
  }

  async listShareLinks(userId: string, query: PaginationQuery) {
    const { skip, take, page, limit } = parsePagination(query);

    const [items, total] = await Promise.all([
      prisma.shareLink.findMany({
        where: { createdById: userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          file: { select: { id: true, name: true, mimeType: true } },
          _count: { select: { views: true } },
        },
      }),
      prisma.shareLink.count({ where: { createdById: userId } }),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  }

  async getShareAnalytics(id: string, userId: string) {
    const link = await prisma.shareLink.findFirst({
      where: { id, createdById: userId },
      include: { views: { orderBy: { viewedAt: 'desc' }, take: 100 } },
    });

    if (!link) throw Object.assign(new Error('Share link not found'), { statusCode: 404 });

    const views = link.views;
    const byDay: Record<string, number> = {};

    views.forEach((v) => {
      const day = v.viewedAt.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    const uniqueIPs = new Set(views.map((v) => v.ipAddress).filter(Boolean)).size;

    return {
      totalViews: link.viewCount,
      uniqueVisitors: uniqueIPs,
      viewsByDay: byDay,
      recentViews: views.slice(0, 20),
    };
  }
}

export const shareService = new ShareService();
