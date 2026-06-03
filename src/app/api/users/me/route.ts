import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ok, handleError } from '@/lib/api-helpers';

function serialize(user: Record<string, unknown>) {
  return {
    ...user,
    storageUsed:  user.storageUsed  ? user.storageUsed.toString()  : '0',
    storageQuota: user.storageQuota ? user.storageQuota.toString() : '0',
  };
}

export async function GET(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: sub },
      select: {
        id: true, email: true, name: true, avatar: true, role: true,
        provider: true, isEmailVerified: true, isTwoFactorEnabled: true,
        isActive: true, lastLoginAt: true, storageUsed: true, storageQuota: true,
        bio: true, jobTitle: true, website: true, linkedinUrl: true, twitterHandle: true,
        timezone: true, language: true, planType: true, subscriptionStatus: true,
        xpPoints: true, streakDays: true, longestStreak: true,
        createdAt: true, updatedAt: true,
        cloudAddon: { select: { isEnabled: true, provider: true, storageQuota: true, storageUsed: true, status: true } },
      },
    });
    return ok(serialize(user as Record<string, unknown>));
  } catch (e) {
    return handleError(e);
  }
}

const updateSchema = z.object({
  name:         z.string().min(2).max(80).optional(),
  bio:          z.string().max(300).nullable().optional(),
  jobTitle:     z.string().max(100).nullable().optional(),
  website:      z.string().url().nullable().optional(),
  linkedinUrl:  z.string().url().nullable().optional(),
  twitterHandle:z.string().max(50).nullable().optional(),
  timezone:     z.string().max(50).optional(),
  language:     z.string().max(10).optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);
    const data = updateSchema.parse(await request.json());
    const user = await prisma.user.update({ where: { id: sub }, data });
    return ok(serialize(user as unknown as Record<string, unknown>));
  } catch (e) {
    return handleError(e);
  }
}
