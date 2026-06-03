import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken, signAccessToken, signRefreshToken, setSessionCookie } from '@/lib/auth';
import { sendVerificationEmail, sendWelcomeEmail } from '@/lib/email';
import { ok, err, handleError } from '@/lib/api-helpers';
import { PLANS } from '@/lib/stripe';

const schema = z.object({
  name:     z.string().min(2).max(80),
  email:    z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain number'),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());

    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) return err('An account with that email already exists', 409);

    const passwordHash = await hashPassword(body.password);
    const plan = PLANS.FREE;

    const user = await prisma.user.create({
      data: {
        email:        body.email,
        name:         body.name,
        passwordHash,
        storageQuota: plan.storageQuota,
        planType:     'FREE',
        isEmailVerified: false,
      },
    });

    // Send verification email
    const verifyToken = generateToken();
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.emailVerification.create({
      data: { userId: user.id, token: verifyToken, expiresAt: verifyExpiry },
    });
    await sendVerificationEmail(user.email, verifyToken);
    await sendWelcomeEmail(user.email, user.name);

    // Issue tokens so the user is logged in immediately
    const accessToken  = await signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = await signRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId:    user.id,
        token:     refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await setSessionCookie(accessToken);

    return ok({
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id:              user.id,
        email:           user.email,
        name:            user.name,
        role:            user.role,
        planType:        user.planType,
        isEmailVerified: user.isEmailVerified,
      },
    }, undefined, 201);
  } catch (e) {
    return handleError(e);
  }
}
