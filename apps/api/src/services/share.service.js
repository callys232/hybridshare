"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shareService = exports.ShareService = void 0;
const database_1 = require("../config/database");
const crypto_1 = require("../utils/crypto");
const crypto_2 = require("../utils/crypto");
const paginate_1 = require("../utils/paginate");
class ShareService {
    async createShareLink(userId, input) {
        const token = (0, crypto_2.generateShortToken)(16);
        const passwordHash = input.password ? await (0, crypto_1.hashPassword)(input.password) : null;
        const shareLink = await database_1.prisma.shareLink.create({
            data: {
                token,
                fileId: input.fileId || null,
                folderId: input.folderId || null,
                workspaceId: input.workspaceId || null,
                createdById: userId,
                permissions: input.permissions,
                passwordHash,
                expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
                maxViews: input.maxViews || null,
            },
        });
        return shareLink;
    }
    async resolveShareLink(token) {
        const link = await database_1.prisma.shareLink.findUnique({
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
    async verifySharePassword(token, password) {
        const link = await database_1.prisma.shareLink.findUnique({ where: { token } });
        if (!link?.passwordHash)
            return true;
        const valid = await (0, crypto_1.verifyPassword)(password, link.passwordHash);
        if (!valid)
            throw Object.assign(new Error('Incorrect password'), { statusCode: 401 });
        await database_1.prisma.shareLink.update({
            where: { token },
            data: { viewCount: { increment: 1 } },
        });
        return true;
    }
    async recordView(token, ipAddress, userAgent, referrer) {
        const link = await database_1.prisma.shareLink.findUnique({ where: { token } });
        if (!link)
            return;
        await Promise.all([
            database_1.prisma.shareLinkView.create({
                data: { shareLinkId: link.id, ipAddress, userAgent, referrer },
            }),
            database_1.prisma.shareLink.update({
                where: { id: link.id },
                data: { viewCount: { increment: 1 } },
            }),
        ]);
    }
    async revokeShareLink(id, userId) {
        const link = await database_1.prisma.shareLink.findFirst({ where: { id, createdById: userId } });
        if (!link)
            throw Object.assign(new Error('Share link not found'), { statusCode: 404 });
        await database_1.prisma.shareLink.update({ where: { id }, data: { isActive: false } });
    }
    async listShareLinks(userId, query) {
        const { skip, take, page, limit } = (0, paginate_1.parsePagination)(query);
        const [items, total] = await Promise.all([
            database_1.prisma.shareLink.findMany({
                where: { createdById: userId },
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    file: { select: { id: true, name: true, mimeType: true } },
                    _count: { select: { views: true } },
                },
            }),
            database_1.prisma.shareLink.count({ where: { createdById: userId } }),
        ]);
        return { items, meta: (0, paginate_1.buildMeta)(total, page, limit) };
    }
    async getShareAnalytics(id, userId) {
        const link = await database_1.prisma.shareLink.findFirst({
            where: { id, createdById: userId },
            include: { views: { orderBy: { viewedAt: 'desc' }, take: 100 } },
        });
        if (!link)
            throw Object.assign(new Error('Share link not found'), { statusCode: 404 });
        const views = link.views;
        const byDay = {};
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
exports.ShareService = ShareService;
exports.shareService = new ShareService();
//# sourceMappingURL=share.service.js.map