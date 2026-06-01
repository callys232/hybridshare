import { prisma } from '../config/database';
import { emitToUser } from '../config/socket';
import { buildMeta, parsePagination } from '../utils/paginate';
import type { PaginationQuery } from '../utils/paginate';

interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export class NotificationService {
  async create(input: CreateNotificationInput) {
    const notification = await prisma.notification.create({
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

    emitToUser(input.userId, 'notification:new', notification);
    return notification;
  }

  async createBulk(inputs: CreateNotificationInput[]): Promise<void> {
    await prisma.notification.createMany({
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
      emitToUser(n.userId, 'notification:new', { type: n.type, title: n.title });
    }
  }

  async list(userId: string, query: PaginationQuery) {
    const { skip, take, page, limit } = parsePagination(query);

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { items, meta: buildMeta(total, page, limit), unreadCount };
  }

  async markRead(id: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async dismiss(id: string, userId: string): Promise<void> {
    await prisma.notification.deleteMany({ where: { id, userId } });
  }

  async notifyWorkspaceMembers(
    workspaceId: string,
    excludeUserId: string,
    notification: Omit<CreateNotificationInput, 'userId'>
  ): Promise<void> {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId, userId: { not: excludeUserId } },
      select: { userId: true },
    });

    if (members.length === 0) return;

    await this.createBulk(members.map((m) => ({ ...notification, userId: m.userId })));
  }
}

export const notificationService = new NotificationService();
