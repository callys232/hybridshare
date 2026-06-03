import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ok, err, handleError } from '@/lib/api-helpers';

const schema = z.object({ token: z.string().min(1) });

export async function POST(request: NextRequest) {
  try {
    const { token } = schema.parse(await request.json());

    const verification = await prisma.emailVerification.findUnique({ where: { token } });
    if (!verification || verification.expiresAt < new Date()) {
      return err('Verification link is invalid or has expired', 400);
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: verification.userId }, data: { isEmailVerified: true } }),
      prisma.emailVerification.delete({ where: { id: verification.id } }),
    ]);

    return ok({ message: 'Email verified successfully.' });
  } catch (e) {
    return handleError(e);
  }
}
