import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { PLANS, CLOUD_ADDONS } from '@/lib/stripe';

type StripeEvent = { type: string; data: { object: Record<string, unknown> } };

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig  = request.headers.get('stripe-signature') ?? '';

  let event: StripeEvent;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? '');
  } catch {
    return new NextResponse('Webhook signature verification failed', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId    = session.metadata?.userId;
        const planType  = session.metadata?.planType as keyof typeof PLANS | undefined;
        const addonType = session.metadata?.addonType;
        const stripeSubId = session.subscription as string;

        if (!userId) break;

        if (addonType === 'CLOUD') {
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (!user) break;
          const config = CLOUD_ADDONS[user.planType];
          await prisma.cloudAddon.upsert({
            where:  { userId },
            update: { isEnabled: true, stripeSubId, storageQuota: config.storageQuota, status: 'ACTIVE' },
            create: {
              userId,
              isEnabled:    true,
              provider:     'S3',
              storageQuota: config.storageQuota,
              stripeSubId,
              status:       'ACTIVE',
            },
          });
          await prisma.notification.create({
            data: { userId, type: 'CLOUD_ENABLED', title: 'Cloud storage enabled', message: `Your ${config.label} add-on is now active.` },
          });
        } else if (planType) {
          const plan = PLANS[planType];
          const now  = new Date();
          const end  = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          await prisma.$transaction([
            prisma.user.update({ where: { id: userId }, data: { planType, storageQuota: plan.storageQuota } }),
            prisma.subscription.upsert({
              where:  { userId },
              update: { planType, status: 'TRIALING', stripeSubId, currentPeriodStart: now, currentPeriodEnd: end },
              create: { userId, planType, status: 'TRIALING', stripeSubId, currentPeriodStart: now, currentPeriodEnd: end },
            }),
          ]);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        const status = sub.status === 'active' ? 'ACTIVE'
          : sub.status === 'trialing'           ? 'TRIALING'
          : sub.status === 'past_due'           ? 'PAST_DUE'
          : sub.status === 'canceled'           ? 'CANCELLED'
          : 'ACTIVE';

        await prisma.subscription.updateMany({
          where: { stripeSubId: sub.id },
          data:  { status: status as never, cancelAtPeriodEnd: sub.cancel_at_period_end },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const addonRecord = await prisma.cloudAddon.findUnique({ where: { stripeSubId: sub.id } });

        if (addonRecord) {
          await prisma.cloudAddon.update({ where: { id: addonRecord.id }, data: { isEnabled: false, status: 'CANCELLED' } });
        } else {
          await prisma.subscription.updateMany({
            where: { stripeSubId: sub.id },
            data:  { status: 'CANCELLED' },
          });
          const userId = sub.metadata?.userId;
          if (userId) {
            await prisma.user.update({ where: { id: userId }, data: { planType: 'FREE', subscriptionStatus: 'CANCELLED' } });
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const userId = (invoice as { subscription_details?: { metadata?: { userId?: string } } })
          .subscription_details?.metadata?.userId;
        if (!userId) break;
        await prisma.invoice.create({
          data: {
            userId,
            amount:          invoice.amount_paid,
            currency:        invoice.currency,
            status:          'ACTIVE',
            stripeInvoiceId: invoice.id,
            pdfUrl:          invoice.invoice_pdf ?? null,
            paidAt:          new Date(),
          },
        });
        break;
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }
}
