import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { comparePassword, signAccessToken, signRefreshToken, setSessionCookie } from '@/lib/auth';
import { ok, err, handleError } from '@/lib/api-helpers';

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.passwordHash) return err('Invalid email or password', 401);
    if (!user.isActive) return err('Account is disabled. Contact support.', 403);

    const valid = await comparePassword(body.password, user.passwordHash);
    if (!valid) return err('Invalid email or password', 401);

    // TOTP stub — expand with otplib when 2FA is fully implemented
    if (user.isTwoFactorEnabled && !body.totpCode) {
      return ok({ requiresTwoFactor: true, userId: user.id });
    }

    const accessToken  = await signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = await signRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId:    user.id,
        token:     refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data:  { lastLoginAt: new Date() },
    });

    await setSessionCookie(accessToken);

    return ok({
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id:                user.id,
        email:             user.email,
        name:              user.name,
        avatar:            user.avatar,
        role:              user.role,
        planType:          user.planType,
        isEmailVerified:   user.isEmailVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
        storageUsed:       user.storageUsed.toString(),
        storageQuota:      user.storageQuota.toString(),
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
