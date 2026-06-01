"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.announcementService = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const prisma = (0, database_1.getPrisma)();
exports.announcementService = {
    async listAnnouncements(params = {}) {
        const { userId, organizationId, isActive = true, page = 1, limit = 10 } = params;
        const where = { isActive };
        if (organizationId)
            where.organizationId = organizationId;
        else
            where.organizationId = null; // global announcements
        const announcements = await prisma.announcement.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        });
        if (!userId)
            return announcements;
        // Mark which ones the user has read
        const readIds = await prisma.announcementRead.findMany({
            where: { userId, announcementId: { in: announcements.map((a) => a.id) } },
            select: { announcementId: true },
        });
        const readSet = new Set(readIds.map((r) => r.announcementId));
        return announcements.map((a) => ({ ...a, isRead: readSet.has(a.id) }));
    },
    async getAnnouncement(id) {
        return prisma.announcement.findUniqueOrThrow({ where: { id } });
    },
    async createAnnouncement(data) {
        const ann = await prisma.announcement.create({
            data: {
                title: data.title,
                content: data.content,
                type: data.type,
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
        logger_1.logger.info('Announcement created', { id: ann.id, title: ann.title });
        return ann;
    },
    async updateAnnouncement(id, data) {
        return prisma.announcement.update({ where: { id }, data: data });
    },
    async deleteAnnouncement(id) {
        return prisma.announcement.delete({ where: { id } });
    },
    async markAsRead(announcementId, userId) {
        return prisma.announcementRead.upsert({
            where: { announcementId_userId: { announcementId, userId } },
            update: {},
            create: { announcementId, userId },
        });
    },
    async markAllRead(userId, organizationId) {
        const announcements = await prisma.announcement.findMany({
            where: { isActive: true, organizationId: organizationId ?? null },
            select: { id: true },
        });
        await prisma.announcementRead.createMany({
            data: announcements.map((a) => ({ announcementId: a.id, userId })),
            skipDuplicates: true,
        });
    },
    async getUnreadCount(userId, organizationId) {
        const total = await prisma.announcement.count({
            where: { isActive: true, organizationId: organizationId ?? null },
        });
        const read = await prisma.announcementRead.count({
            where: { userId, announcement: { isActive: true, organizationId: organizationId ?? null } },
        });
        return Math.max(0, total - read);
    },
};
//# sourceMappingURL=announcement.service.js.map