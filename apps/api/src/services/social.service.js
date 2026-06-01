"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socialService = exports.SocialService = void 0;
const axios_1 = __importDefault(require("axios"));
const database_1 = require("../config/database");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const socket_1 = require("../config/socket");
const paginate_1 = require("../utils/paginate");
class SocialService {
    async publishPost(userId, data) {
        const share = await database_1.prisma.socialShare.create({
            data: {
                userId,
                platforms: data.platforms,
                message: data.message,
                mediaUrls: data.mediaUrls || [],
                status: data.scheduledAt ? 'SCHEDULED' : 'PUBLISHING',
                scheduledAt: data.scheduledAt || null,
                fileId: data.fileIds[0] || null,
            },
        });
        if (data.scheduledAt && new Date(data.scheduledAt) > new Date()) {
            return share;
        }
        return this.publishNow(share.id, userId);
    }
    async publishNow(shareId, userId) {
        const share = await database_1.prisma.socialShare.findUnique({ where: { id: shareId } });
        if (!share)
            throw Object.assign(new Error('Post not found'), { statusCode: 404 });
        try {
            const response = await axios_1.default.post(`${env_1.env.ZERNIO_API_URL}/publish`, {
                platforms: share.platforms,
                message: share.message,
                mediaUrls: share.mediaUrls,
            }, {
                headers: {
                    Authorization: `Bearer ${env_1.env.ZERNIO_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            });
            const postRecords = Object.entries(response.data.postIds || {}).map(([platform, externalPostId]) => ({
                shareId,
                platform: platform.toUpperCase(),
                externalPostId,
                status: 'PUBLISHED',
                publishedAt: new Date(),
            }));
            const updated = await database_1.prisma.socialShare.update({
                where: { id: shareId },
                data: {
                    status: 'PUBLISHED',
                    publishedAt: new Date(),
                    externalPostIds: response.data.postIds,
                    posts: {
                        create: postRecords,
                    },
                },
                include: { posts: true },
            });
            (0, socket_1.emitToUser)(userId, 'social:posted', { shareId, platforms: share.platforms });
            return updated;
        }
        catch (error) {
            await database_1.prisma.socialShare.update({
                where: { id: shareId },
                data: {
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                },
            });
            throw error;
        }
    }
    async listPosts(userId, query) {
        const { skip, take, page, limit } = (0, paginate_1.parsePagination)(query);
        const [items, total] = await Promise.all([
            database_1.prisma.socialShare.findMany({
                where: { userId },
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    posts: true,
                    file: { select: { id: true, name: true, mimeType: true } },
                    analytics: true,
                },
            }),
            database_1.prisma.socialShare.count({ where: { userId } }),
        ]);
        return { items, meta: (0, paginate_1.buildMeta)(total, page, limit) };
    }
    async cancelPost(id, userId) {
        const share = await database_1.prisma.socialShare.findFirst({ where: { id, userId, status: 'SCHEDULED' } });
        if (!share)
            throw Object.assign(new Error('Scheduled post not found'), { statusCode: 404 });
        await database_1.prisma.socialShare.update({ where: { id }, data: { status: 'CANCELLED' } });
    }
    async getPostAnalytics(postId, userId) {
        const share = await database_1.prisma.socialShare.findFirst({
            where: { id: postId, userId },
            include: { analytics: true, posts: true },
        });
        if (!share)
            throw Object.assign(new Error('Post not found'), { statusCode: 404 });
        if (share.status === 'PUBLISHED' && env_1.env.ZERNIO_API_KEY) {
            try {
                const response = await axios_1.default.get(`${env_1.env.ZERNIO_API_URL}/analytics/${postId}`, { headers: { Authorization: `Bearer ${env_1.env.ZERNIO_API_KEY}` }, timeout: 10000 });
                const analyticsData = response.data.analytics;
                if (analyticsData) {
                    for (const [platform, stats] of Object.entries(analyticsData)) {
                        const s = stats;
                        await database_1.prisma.socialAnalytics.upsert({
                            where: { id: `${share.id}_${platform}` },
                            create: {
                                id: `${share.id}_${platform}`,
                                shareId: share.id,
                                platform: platform.toUpperCase(),
                                impressions: s.impressions || 0,
                                reach: s.reach || 0,
                                clicks: s.clicks || 0,
                                likes: s.likes || 0,
                                shares: s.shares || 0,
                                comments: s.comments || 0,
                            },
                            update: {
                                impressions: s.impressions || 0,
                                clicks: s.clicks || 0,
                                likes: s.likes || 0,
                            },
                        });
                    }
                }
            }
            catch (err) {
                logger_1.logger.warn('Failed to fetch social analytics', { postId, err });
            }
        }
        return database_1.prisma.socialShare.findFirst({
            where: { id: postId, userId },
            include: { analytics: true, posts: true },
        });
    }
}
exports.SocialService = SocialService;
exports.socialService = new SocialService();
//# sourceMappingURL=social.service.js.map