import axios from 'axios';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { emitToUser } from '../config/socket';
import { buildMeta, parsePagination } from '../utils/paginate';
import type { ShareComposerData } from '@hybridshare/shared/types/social';
import type { PaginationQuery } from '../utils/paginate';

export class SocialService {
  async publishPost(userId: string, data: ShareComposerData) {
    const share = await prisma.socialShare.create({
      data: {
        userId,
        platforms: data.platforms as string[],
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

  async publishNow(shareId: string, userId: string) {
    const share = await prisma.socialShare.findUnique({ where: { id: shareId } });
    if (!share) throw Object.assign(new Error('Post not found'), { statusCode: 404 });

    try {
      const response = await axios.post<{
        success: boolean;
        postIds: Record<string, string>;
        errors?: Record<string, string>;
      }>(
        `${env.ZERNIO_API_URL}/publish`,
        {
          platforms: share.platforms,
          message: share.message,
          mediaUrls: share.mediaUrls,
        },
        {
          headers: {
            Authorization: `Bearer ${env.ZERNIO_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const postRecords = Object.entries(response.data.postIds || {}).map(([platform, externalPostId]) => ({
        shareId,
        platform: platform.toUpperCase(),
        externalPostId,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      }));

      const updated = await prisma.socialShare.update({
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

      emitToUser(userId, 'social:posted', { shareId, platforms: share.platforms });
      return updated;
    } catch (error) {
      await prisma.socialShare.update({
        where: { id: shareId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  async listPosts(userId: string, query: PaginationQuery) {
    const { skip, take, page, limit } = parsePagination(query);

    const [items, total] = await Promise.all([
      prisma.socialShare.findMany({
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
      prisma.socialShare.count({ where: { userId } }),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  }

  async cancelPost(id: string, userId: string): Promise<void> {
    const share = await prisma.socialShare.findFirst({ where: { id, userId, status: 'SCHEDULED' } });
    if (!share) throw Object.assign(new Error('Scheduled post not found'), { statusCode: 404 });

    await prisma.socialShare.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async getPostAnalytics(postId: string, userId: string) {
    const share = await prisma.socialShare.findFirst({
      where: { id: postId, userId },
      include: { analytics: true, posts: true },
    });

    if (!share) throw Object.assign(new Error('Post not found'), { statusCode: 404 });

    if (share.status === 'PUBLISHED' && env.ZERNIO_API_KEY) {
      try {
        const response = await axios.get<{ analytics: Record<string, unknown> }>(
          `${env.ZERNIO_API_URL}/analytics/${postId}`,
          { headers: { Authorization: `Bearer ${env.ZERNIO_API_KEY}` }, timeout: 10000 }
        );

        const analyticsData = response.data.analytics;
        if (analyticsData) {
          for (const [platform, stats] of Object.entries(analyticsData)) {
            const s = stats as Record<string, number>;
            await prisma.socialAnalytics.upsert({
              where: { id: `${share.id}_${platform}` },
              create: {
                id: `${share.id}_${platform}`,
                shareId: share.id,
                platform: platform.toUpperCase() as never,
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
      } catch (err) {
        logger.warn('Failed to fetch social analytics', { postId, err });
      }
    }

    return prisma.socialShare.findFirst({
      where: { id: postId, userId },
      include: { analytics: true, posts: true },
    });
  }
}

export const socialService = new SocialService();
