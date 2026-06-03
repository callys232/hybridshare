import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { clearSessionCookie } from '@/lib/auth';
import { ok, handleError } from '@/lib/api-helpers';

const schema = z.object({ refreshToken: z.string().optional() });

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());

    if (body.refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: body.refreshToken },
        data:  { isRevoked: true },
      }).catch(() => {});
    }

    await clearSessionCookie();
    return ok({ message: 'Logged out successfully' });
  } catch (e) {
    return handleError(e);
  }
}
