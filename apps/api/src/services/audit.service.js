"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = exports.AuditService = void 0;
const database_1 = require("../config/database");
const paginate_1 = require("../utils/paginate");
class AuditService {
    async log(data) {
        await database_1.prisma.auditLog.create({ data: { ...data, metadata: data.metadata || {} } });
    }
    async list(query) {
        const { skip, take, page, limit } = (0, paginate_1.parsePagination)(query);
        const where = {
            ...(query.userId ? { userId: query.userId } : {}),
            ...(query.action ? { action: { contains: query.action, mode: 'insensitive' } } : {}),
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
            database_1.prisma.auditLog.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, email: true, avatar: true } },
                },
            }),
            database_1.prisma.auditLog.count({ where }),
        ]);
        return { items, meta: (0, paginate_1.buildMeta)(total, page, limit) };
    }
    async exportCsv(query) {
        const items = await database_1.prisma.auditLog.findMany({
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
exports.AuditService = AuditService;
exports.auditService = new AuditService();
//# sourceMappingURL=audit.service.js.map