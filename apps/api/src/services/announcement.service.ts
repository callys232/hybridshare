import { getPrisma } from '../config/database';
import { logger } from '../utils/logger';

const prisma = getPrisma();

export const announcementService = {
  async listAnnouncements(params: {
    userId?: string;
    organizationId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  } = {}) {
    const { userId, organizationId, isActive = true, page = 1, limit = 10 } = params;

    const where: Record<string, unknown> = { isActive };
    if (organizationId) where.organizationId = organizationId;
    else where.organizationId = null; // global announcements

    const announcements = await prisma.announcement.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });

    if (!userId) return announcements;

    // Mark which ones the user has read
    const readIds = await prisma.announcementRead.findMany({
      where: { userId, announcementId: { in: announcements.map((a) => a.id) } },
      select: { announcementId: true },
    });
    const readSet = new Set(readIds.map((r) => r.announcementId));

    return announcements.map((a) => ({ ...a, isRead: readSet.has(a.id) }));
  },

  async getAnnouncement(id: string) {
    return prisma.announcement.findUniqueOrThrow({ where: { id } });
  },

  async createAnnouncement(data: {
    title: string;
    content: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'FEATURE';
    isPinned?: boolean;
    actionUrl?: string;
    actionLabel?: string;
    expiresAt?: Date;
    organizationId?: string;
    authorId: string;
    targetRole?: string;
  }) {
    const ann = await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type as never,
        isPinned: data.isPinned ?? false,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        expiresAt: data.expiresAt,
        organizationId: data.organizationId ?? null,
        authorId: data.authorId,
        isActive: true,
        targetRole: data.targetRole ?? null,
      },
    });
    logger.info('Announcement created', { id: ann.id, title: ann.title });
    return ann;
  },

  async updateAnnouncement(id: string, data: Partial<{
    title: string;
    content: string;
    type: string;
    isPinned: boolean;
    actionUrl: string;
    actionLabel: string;
    expiresAt: Date;
    isActive: boolean;
  }>) {
    return prisma.announcement.update({ where: { id }, data: data as never });
  },

  async deleteAnnouncement(id: string) {
    return prisma.announcement.delete({ where: { id } });
  },

  async markAsRead(announcementId: string, userId: string) {
    return prisma.announcementRead.upsert({
      where: { announcementId_userId: { announcementId, userId } },
      update: {},
      create: { announcementId, userId },
    });
  },

  async markAllRead(userId: string, organizationId?: string) {
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true, organizationId: organizationId ?? null },
      select: { id: true },
    });

    await prisma.announcementRead.createMany({
      data: announcements.map((a) => ({ announcementId: a.id, userId })),
      skipDuplicates: true,
    });
  },

  async getUnreadCount(userId: string, organizationId?: string): Promise<number> {
    const total = await prisma.announcement.count({
      where: { isActive: true, organizationId: organizationId ?? null },
    });
    const read = await prisma.announcementRead.count({
      where: { userId, announcement: { isActive: true, organizationId: organizationId ?? null } },
    });
    return Math.max(0, total - read);
  },
};
