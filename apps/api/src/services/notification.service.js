"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const database_1 = require("../config/database");
const socket_1 = require("../config/socket");
const paginate_1 = require("../utils/paginate");
class NotificationService {
    async create(input) {
        const notification = await database_1.prisma.notification.create({
            data: {
                userId: input.userId,
                type: input.type,
                title: input.title,
                message: input.message,
                resourceType: input.resourceType,
                resourceId: input.resourceId,
                metadata: input.metadata || {},
            },
        });
        (0, socket_1.emitToUser)(input.userId, 'notification:new', notification);
        return notification;
    }
    async createBulk(inputs) {
        await database_1.prisma.notification.createMany({
            data: inputs.map((n) => ({
                userId: n.userId,
                type: n.type,
                title: n.title,
                message: n.message,
                resourceType: n.resourceType,
                resourceId: n.resourceId,
                metadata: n.metadata || {},
            })),
        });
        for (const n of inputs) {
            (0, socket_1.emitToUser)(n.userId, 'notification:new', { type: n.type, title: n.title });
        }
    }
    async list(userId, query) {
        const { skip, take, page, limit } = (0, paginate_1.parsePagination)(query);
        const [items, total, unreadCount] = await Promise.all([
            database_1.prisma.notification.findMany({
                where: { userId },
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            database_1.prisma.notification.count({ where: { userId } }),
            database_1.prisma.notification.count({ where: { userId, isRead: false } }),
        ]);
        return { items, meta: (0, paginate_1.buildMeta)(total, page, limit), unreadCount };
    }
    async markRead(id, userId) {
        await database_1.prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async markAllRead(userId) {
        await database_1.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async dismiss(id, userId) {
        await database_1.prisma.notification.deleteMany({ where: { id, userId } });
    }
    async notifyWorkspaceMembers(workspaceId, excludeUserId, notification) {
        const members = await database_1.prisma.workspaceMember.findMany({
            where: { workspaceId, userId: { not: excludeUserId } },
            select: { userId: true },
        });
        if (members.length === 0)
            return;
        await this.createBulk(members.map((m) => ({ ...notification, userId: m.userId })));
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
//# sourceMappingURL=notification.service.js.map