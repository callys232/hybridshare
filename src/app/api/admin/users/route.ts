import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { paginate, handleError, parsePagination } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const { page, limit, skip } = parsePagination(url);
    const search = url.searchParams.get('q') ?? '';

    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }
      : {};

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, name: true, role: true, planType: true,
          isActive: true, isEmailVerified: true, storageUsed: true,
          storageQuota: true, createdAt: true, lastLoginAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return paginate(
      users.map((u) => ({ ...u, storageUsed: u.storageUsed.toString(), storageQuota: u.storageQuota.toString() })),
      total, page, limit
    );
  } catch (e) {
    return handleError(e);
  }
}
