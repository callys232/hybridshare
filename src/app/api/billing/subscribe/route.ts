import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { stripe, getOrCreateStripeCustomer, stripePriceForPlan } from '@/lib/stripe';
import { ok, err, handleError } from '@/lib/api-helpers';

const schema = z.object({
  planType:   z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  interval:   z.enum(['monthly', 'yearly']).default('monthly'),
  successUrl: z.string().url().optional(),
  cancelUrl:  z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);
    const body = schema.parse(await request.json());

    const user = await prisma.user.findUniqueOrThrow({ where: { id: sub } });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const customerId = await getOrCreateStripeCustomer(sub, user.email, user.name, user.stripeCustomerId);

    if (!user.stripeCustomerId) {
      await prisma.user.update({ where: { id: sub }, data: { stripeCustomerId: customerId } });
    }

    const priceId = stripePriceForPlan(body.planType, body.interval);
    if (!priceId) return err('Price not configured. Contact support.', 500);

    const session = await stripe.checkout.sessions.create({
      customer:   customerId,
      mode:       'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: body.successUrl ?? `${appUrl}/settings/billing?success=1`,
      cancel_url:  body.cancelUrl  ?? `${appUrl}/settings/billing?cancelled=1`,
      metadata: { userId: sub, planType: body.planType },
      subscription_data: { trial_period_days: 14, metadata: { userId: sub, planType: body.planType } },
    });

    return ok({ url: session.url, sessionId: session.id });
  } catch (e) {
    return handleError(e);
  }
}
