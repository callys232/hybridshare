import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { stripe, getOrCreateStripeCustomer, CLOUD_ADDONS } from '@/lib/stripe';
import { ok, err, noContent, handleError } from '@/lib/api-helpers';

// GET — current cloud add-on status
export async function GET(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);
    const addon = await prisma.cloudAddon.findUnique({ where: { userId: sub } });
    if (!addon) return ok({ enabled: false, addon: null });
    return ok({
      enabled: addon.isEnabled,
      addon: {
        ...addon,
        storageQuota: addon.storageQuota.toString(),
        storageUsed:  addon.storageUsed.toString(),
      },
    });
  } catch (e) {
    return handleError(e);
  }
}

const enableSchema = z.object({
  successUrl: z.string().url().optional(),
  cancelUrl:  z.string().url().optional(),
});

// POST — enable cloud add-on (creates Stripe checkout)
export async function POST(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);

    const existing = await prisma.cloudAddon.findUnique({ where: { userId: sub } });
    if (existing?.isEnabled) return err('Cloud add-on is already enabled', 409);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: sub } });
    const addonConfig = CLOUD_ADDONS[user.planType];
    if (!addonConfig.priceId) return err('Cloud add-on not configured. Contact support.', 500);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const body = enableSchema.parse(await request.json().catch(() => ({})));

    const customerId = await getOrCreateStripeCustomer(sub, user.email, user.name, user.stripeCustomerId);
    if (!user.stripeCustomerId) {
      await prisma.user.update({ where: { id: sub }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      customer:   customerId,
      mode:       'subscription',
      line_items: [{ price: addonConfig.priceId, quantity: 1 }],
      success_url: body.successUrl ?? `${appUrl}/settings/billing?cloud=enabled`,
      cancel_url:  body.cancelUrl  ?? `${appUrl}/settings/billing`,
      metadata: { userId: sub, addonType: 'CLOUD' },
    });

    return ok({ url: session.url, sessionId: session.id, addonConfig: {
      ...addonConfig,
      storageQuota: addonConfig.storageQuota.toString(),
    }});
  } catch (e) {
    return handleError(e);
  }
}

// DELETE — cancel cloud add-on
export async function DELETE(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);

    const addon = await prisma.cloudAddon.findUnique({ where: { userId: sub } });
    if (!addon || !addon.isEnabled) return err('Cloud add-on is not active', 404);

    if (addon.stripeSubId) {
      await stripe.subscriptions.cancel(addon.stripeSubId).catch(() => {});
    }

    await prisma.cloudAddon.update({
      where: { userId: sub },
      data:  { isEnabled: false, status: 'CANCELLED' },
    });

    return noContent();
  } catch (e) {
    return handleError(e);
  }
}
