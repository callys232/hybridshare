import { prisma } from '../config/database';
import { buildMeta, parsePagination } from '../utils/paginate';
import type { PaginationQuery } from '../utils/paginate';

interface AuditQuery extends PaginationQuery {
  userId?: string;
  action?: string;
  resourceType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export class AuditService {
  async log(data: {
    userId?: string;
    action: string;
    resourceType: string;
    resourceId: string;
    resourceName?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await prisma.auditLog.create({ data: { ...data, metadata: data.metadata || {} } });
  }

  async list(query: AuditQuery) {
    const { skip, take, page, limit } = parsePagination(query);

    const where = {
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.action ? { action: { contains: query.action, mode: 'insensitive' as const } } : {}),
      ...(query.resourceType ? { resourceType: query.resourceType } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  }

  async exportCsv(query: Omit<AuditQuery, 'page' | 'limit'>): Promise<string> {
    const items = await prisma.auditLog.findMany({
      where: {
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.action ? { action: { contains: query.action } } : {}),
        ...(query.resourceType ? { resourceType: query.resourceType } : {}),
        ...(query.dateFrom || query.dateTo
          ? {
              createdAt: {
                ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
                ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
      include: { user: { select: { name: true, email: true } } },
    });

    const headers = ['Date', 'User', 'Email', 'Action', 'Resource Type', 'Resource ID', 'IP Address'];
    const rows = items.map((item) => [
      item.createdAt.toISOString(),
      item.user?.name || 'System',
      item.user?.email || '',
      item.action,
      item.resourceType,
      item.resourceId,
      item.ipAddress || '',
    ]);

    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  }
}

export const auditService = new AuditService();
