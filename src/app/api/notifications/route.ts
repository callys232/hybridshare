import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ok, noContent, handleError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unread') === 'true';

    const notifications = await prisma.notification.findMany({
      where: { userId: sub, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return ok(notifications);
  } catch (e) {
    return handleError(e);
  }
}

// PATCH — mark all as read
export async function PATCH(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);
    await prisma.notification.updateMany({ where: { userId: sub, isRead: false }, data: { isRead: true } });
    return noContent();
  } catch (e) {
    return handleError(e);
  }
}
