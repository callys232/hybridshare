import { prisma } from '../config/database';

export class AnalyticsService {
  async getStorageBreakdown(workspaceId?: string) {
    if (workspaceId) {
      const [workspace, userBreakdown] = await Promise.all([
        prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { storageUsed: true, storageQuota: true },
        }),
        prisma.file.groupBy({
          by: ['uploadedById'],
          where: { workspaceId, status: 'ACTIVE' },
          _sum: { size: true },
          _count: { _all: true },
        }),
      ]);

      const userIds = userBreakdown.map((u) => u.uploadedById);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, avatar: true },
      });

      return {
        total: Number(workspace?.storageUsed ?? 0),
        quota: Number(workspace?.storageQuota ?? 0),
        byUser: userBreakdown.map((u) => ({
          ...u,
          user: users.find((usr) => usr.id === u.uploadedById),
          size: Number(u._sum.size ?? 0),
          count: u._count._all,
        })),
      };
    }

    const [totalStorage, byWorkspace, byMimeType] = await Promise.all([
      prisma.user.aggregate({ _sum: { storageUsed: true } }),
      prisma.workspace.findMany({
        select: { id: true, name: true, storageUsed: true, storageQuota: true },
        orderBy: { storageUsed: 'desc' },
        take: 20,
      }),
      prisma.file.groupBy({
        by: ['mimeType'],
        where: { status: 'ACTIVE' },
        _sum: { size: true },
        _count: { _all: true },
        orderBy: { _sum: { size: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total: Number(totalStorage._sum.storageUsed ?? 0),
      byWorkspace: byWorkspace.map((w) => ({
        ...w,
        storageUsed: Number(w.storageUsed),
        storageQuota: Number(w.storageQuota),
      })),
      byMimeType: byMimeType.map((m) => ({
        mimeType: m.mimeType,
        size: Number(m._sum.size ?? 0),
        count: m._count._all,
      })),
    };
  }

  async getActivityTimeline(
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    workspaceId?: string,
    days = 30
  ) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const files = await prisma.file.findMany({
      where: {
        createdAt: { gte: startDate },
        status: 'ACTIVE',
        ...(workspaceId ? { workspaceId } : {}),
      },
      select: { createdAt: true, size: true },
    });

    const grouped: Record<string, { uploads: number; bytes: number }> = {};

    files.forEach((f) => {
      let key: string;
      const d = f.createdAt;

      if (period === 'daily') {
        key = d.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) grouped[key] = { uploads: 0, bytes: 0 };
      grouped[key].uploads++;
      grouped[key].bytes += Number(f.size);
    });

    return Object.entries(grouped)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getTopFiles(workspaceId?: string, limit = 10) {
    return prisma.file.findMany({
      where: {
        status: 'ACTIVE',
        ...(workspaceId ? { workspaceId } : {}),
      },
      select: {
        id: true,
        name: true,
        mimeType: true,
        size: true,
        createdAt: true,
        uploadedBy: { select: { id: true, name: true, avatar: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  async getUserActivity(limit = 20) {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        lastLoginAt: true,
        storageUsed: true,
        _count: { select: { uploadedFiles: true, comments: true } },
      },
      orderBy: { lastLoginAt: 'desc' },
      take: limit,
    });

    return users.map((u) => ({
      ...u,
      storageUsed: Number(u.storageUsed),
    }));
  }

  async getSocialPerformance(userId: string) {
    const shares = await prisma.socialShare.findMany({
      where: { userId, status: 'PUBLISHED' },
      include: { analytics: true, posts: true },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });

    const totals = shares.reduce(
      (acc, share) => {
        share.analytics.forEach((a) => {
          acc.impressions += a.impressions;
          acc.clicks += a.clicks;
          acc.likes += a.likes;
          acc.shares += a.shares;
        });
        return acc;
      },
      { impressions: 0, clicks: 0, likes: 0, shares: 0 }
    );

    return { shares, totals };
  }

  async getSystemStats() {
    const [userCount, fileCount, workspaceCount, storageTotal] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.file.count({ where: { status: 'ACTIVE' } }),
      prisma.workspace.count(),
      prisma.user.aggregate({ _sum: { storageUsed: true } }),
    ]);

    return {
      users: userCount,
      files: fileCount,
      workspaces: workspaceCount,
      storageUsed: Number(storageTotal._sum.storageUsed ?? 0),
    };
  }
}

export const analyticsService = new AnalyticsService();
