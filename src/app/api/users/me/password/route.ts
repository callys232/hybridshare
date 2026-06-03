import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, comparePassword, hashPassword } from '@/lib/auth';
import { ok, err, handleError } from '@/lib/api-helpers';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number'),
});

export async function PUT(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);
    const { currentPassword, newPassword } = schema.parse(await request.json());

    const user = await prisma.user.findUniqueOrThrow({ where: { id: sub }, select: { passwordHash: true } });
    if (!user.passwordHash) return err('Account uses social login — cannot set password', 400);

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) return err('Current password is incorrect', 400);

    const hash = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({ where: { id: sub }, data: { passwordHash: hash } }),
      prisma.refreshToken.updateMany({ where: { userId: sub }, data: { isRevoked: true } }),
    ]);

    return ok({ message: 'Password changed. Please log in again.' });
  } catch (e) {
    return handleError(e);
  }
}
