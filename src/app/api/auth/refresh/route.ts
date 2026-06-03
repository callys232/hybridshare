import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, signAccessToken, signRefreshToken, setSessionCookie } from '@/lib/auth';
import { ok, err, handleError } from '@/lib/api-helpers';

const schema = z.object({ refreshToken: z.string() });

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = schema.parse(await request.json());

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      return err('Invalid or expired refresh token', 401);
    }

    await verifyToken(refreshToken);

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || !user.isActive) return err('User not found or disabled', 401);

    // Rotate tokens
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { isRevoked: true } });

    const newAccessToken  = await signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const newRefreshToken = await signRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId:    user.id,
        token:     newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await setSessionCookie(newAccessToken);

    return ok({ accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn: 900 });
  } catch (e) {
    return handleError(e);
  }
}
