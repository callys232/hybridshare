import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { ok, err, handleError } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: sub } });

    if (!user.stripeCustomerId) return err('No billing account found', 404);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const session = await stripe.billingPortal.sessions.create({
      customer:   user.stripeCustomerId,
      return_url: `${appUrl}/settings/billing`,
    });

    return ok({ url: session.url });
  } catch (e) {
    return handleError(e);
  }
}
