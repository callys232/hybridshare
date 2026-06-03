import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { ok, handleError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const [totalUsers, activeUsers, totalFiles, planCounts, cloudAddonCount] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.file.count({ where: { status: 'ACTIVE' } }),
      prisma.user.groupBy({ by: ['planType'], _count: { planType: true } }),
      prisma.cloudAddon.count({ where: { isEnabled: true } }),
    ]);

    const storageAgg = await prisma.user.aggregate({ _sum: { storageUsed: true } });

    const planDist: Record<string, number> = {};
    const counts = planCounts as unknown as { planType: string; _count: { planType: number } }[];
    for (const p of counts) {
      planDist[p.planType] = p._count.planType;
    }

    return ok({
      totalUsers,
      activeUsers,
      totalFiles,
      cloudAddonSubscribers: cloudAddonCount,
      totalStorageUsedBytes: storageAgg._sum?.storageUsed?.toString?.() ?? '0',
      planDistribution: planDist,
    });
  } catch (e) {
    return handleError(e);
  }
}
