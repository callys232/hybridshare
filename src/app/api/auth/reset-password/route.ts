import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { ok, err, handleError } from '@/lib/api-helpers';

const schema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain number'),
});

export async function POST(request: NextRequest) {
  try {
    const { token, password } = schema.parse(await request.json());

    const reset = await prisma.passwordReset.findUnique({ where: { token } });
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      return err('Reset link is invalid or has expired', 400);
    }

    const hash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: hash } }),
      prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
      // Revoke all refresh tokens on password change
      prisma.refreshToken.updateMany({ where: { userId: reset.userId }, data: { isRevoked: true } }),
    ]);

    return ok({ message: 'Password reset successfully. You can now log in.' });
  } catch (e) {
    return handleError(e);
  }
}
