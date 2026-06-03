import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';
import { ok, handleError } from '@/lib/api-helpers';

const schema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  try {
    const { email } = schema.parse(await request.json());

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = generateToken();
      await prisma.passwordReset.create({
        data: {
          userId:    user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });
      await sendPasswordResetEmail(email, token);
    }

    return ok({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (e) {
    return handleError(e);
  }
}
