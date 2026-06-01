import Stripe from 'stripe';
import { prisma } from '../config/database';
import { enrollmentService } from './enrollment.service';
import { notificationService } from './notification.service';
import { emailService } from './email.service';
import { logger } from '../utils/logger';
import { env } from '../config/env';

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' }) : null;

export class PaymentService {
  // ─── Course Purchase ───────────────────────────────────────────────────────

  async createCheckoutSession(
    userId: string,
    courseId: string,
    couponCode?: string,
    successUrl?: string,
    cancelUrl?: string
  ) {
    if (!stripe) throw Object.assign(new Error('Payments not configured'), { statusCode: 503 });

    const [course, user] = await Promise.all([
      prisma.course.findUnique({ where: { id: courseId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } }),
    ]);

    if (!course) throw Object.assign(new Error('Course not found'), { statusCode: 404 });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    if (course.isFree || Number(course.price) === 0) {
      throw Object.assign(new Error('This course is free, use /enroll'), { statusCode: 400 });
    }

    // Check already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing && ['ACTIVE', 'COMPLETED'].includes(existing.status)) {
      throw Object.assign(new Error('Already enrolled in this course'), { statusCode: 409 });
    }

    let unitAmount = Math.round(Number(course.price) * 100);
    let discountAmount = 0;
    let coupon: Awaited<ReturnType<typeof prisma.coupon.findUnique>> | null = null;

    if (couponCode) {
      coupon = await this.validateCoupon(couponCode, courseId);
      if (coupon) {
        if (coupon.discountType === 'percentage') {
          discountAmount = Math.round(unitAmount * (Number(coupon.discountValue) / 100));
        } else {
          discountAmount = Math.round(Number(coupon.discountValue) * 100);
        }
        unitAmount = Math.max(0, unitAmount - discountAmount);
      }
    }

    // Apply course discount price if available
    if (course.discountPrice && Number(course.discountPrice) < Number(course.price)) {
      unitAmount = Math.round(Number(course.discountPrice) * 100);
    }

    // Get or create Stripe customer
    let stripeCustomerId: string;
    const subRecord = await prisma.subscription.findFirst({ where: { userId }, select: { stripeCustomerId: true } });
    if (subRecord?.stripeCustomerId) {
      stripeCustomerId = subRecord.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({ email: user.email, name: user.name });
      stripeCustomerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: course.currency.toLowerCase(),
          unit_amount: unitAmount,
          product_data: {
            name: course.title,
            description: course.shortDescription ?? undefined,
            images: course.thumbnailUrl ? [course.thumbnailUrl] : [],
            metadata: { courseId },
          },
        },
      }],
      success_url: successUrl ?? `${env.APP_URL}/courses/${course.slug}/learn?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl ?? `${env.APP_URL}/courses/${course.slug}`,
      metadata: { courseId, userId, couponId: coupon?.id ?? '' },
      payment_intent_data: { metadata: { courseId, userId } },
      discounts: coupon ? [{ coupon: await this.getOrCreateStripeCoupon(coupon) }] : [],
    });

    logger.info('Checkout session created', { userId, courseId, sessionId: session.id });
    return {
      sessionId: session.id,
      url: session.url,
      amount: unitAmount / 100,
      currency: course.currency,
      discountAmount: discountAmount / 100,
    };
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
      throw Object.assign(new Error('Stripe not configured'), { statusCode: 503 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      throw Object.assign(new Error(`Webhook signature invalid: ${(err as Error).message}`), { statusCode: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;
      default:
        logger.debug('Unhandled Stripe event', { type: event.type });
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const { courseId, userId, couponId } = session.metadata ?? {};
    if (!courseId || !userId) return;

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: (session.amount_total ?? 0) / 100,
        currency: session.currency ?? 'usd',
        status: 'COMPLETED',
        method: 'stripe',
        stripePaymentIntentId: session.payment_intent as string,
        couponId: couponId || undefined,
        discountAmount: (session.total_details?.amount_discount ?? 0) / 100,
        metadata: { sessionId: session.id },
      },
    });

    await enrollmentService.enrollAfterPayment(userId, courseId, payment.id);

    // Update coupon redemption count
    if (couponId) {
      await prisma.coupon.update({ where: { id: couponId }, data: { redemptionCount: { increment: 1 } } });
      await prisma.couponRedemption.create({ data: { couponId, userId } });
    }

    logger.info('Course purchase completed', { userId, courseId, paymentId: payment.id });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    if (!invoice.subscription) return;
    const sub = await prisma.subscription.findFirst({ where: { stripeSubId: invoice.subscription as string } });
    if (sub) {
      await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'ACTIVE' } });
      await prisma.invoice.create({
        data: {
          subscriptionId: sub.id,
          userId: sub.userId ?? undefined,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          status: 'COMPLETED',
          stripeInvoiceId: invoice.id,
          pdfUrl: invoice.invoice_pdf ?? undefined,
          paidAt: new Date(),
        },
      });
    }
  }

  private async handleInvoiceFailed(invoice: Stripe.Invoice) {
    if (!invoice.subscription) return;
    const sub = await prisma.subscription.findFirst({ where: { stripeSubId: invoice.subscription as string } });
    if (sub) {
      await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'PAST_DUE' } });
      if (sub.userId) {
        await notificationService.create(sub.userId, {
          type: 'payment_failed',
          title: 'Payment Failed',
          message: 'Your subscription payment failed. Please update your payment method.',
          resourceType: 'subscription',
          resourceId: sub.id,
        });
      }
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const sub = await prisma.subscription.findFirst({ where: { stripeSubId: subscription.id } });
    if (!sub) return;
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: subscription.status.toUpperCase() as never,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }

  private async handleSubscriptionCancelled(subscription: Stripe.Subscription) {
    const sub = await prisma.subscription.findFirst({ where: { stripeSubId: subscription.id } });
    if (!sub) return;
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }

  // ─── Subscription Plans ───────────────────────────────────────────────────

  async createSubscription(userId: string, planId: string, billingCycle: 'monthly' | 'yearly') {
    if (!stripe) throw Object.assign(new Error('Payments not configured'), { statusCode: 503 });

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw Object.assign(new Error('Plan not found'), { statusCode: 404 });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    const priceId = billingCycle === 'yearly' ? plan.stripePriceYearlyId : plan.stripePriceMonthlyId;
    if (!priceId) throw Object.assign(new Error('Plan pricing not configured'), { statusCode: 503 });

    const customer = await stripe.customers.create({ email: user.email, name: user.name });
    const sub = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      trial_period_days: 14,
      metadata: { userId, planId },
    });

    return prisma.subscription.create({
      data: {
        userId,
        planId,
        status: 'TRIALING',
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : undefined,
        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : undefined,
        stripeSubId: sub.id,
        stripeCustomerId: customer.id,
      },
    });
  }

  async cancelSubscription(userId: string) {
    if (!stripe) throw Object.assign(new Error('Payments not configured'), { statusCode: 503 });
    const sub = await prisma.subscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
    });
    if (!sub?.stripeSubId) throw Object.assign(new Error('No active subscription'), { statusCode: 404 });
    await stripe.subscriptions.update(sub.stripeSubId, { cancel_at_period_end: true });
    return prisma.subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: true },
    });
  }

  async getPlans() {
    return prisma.plan.findMany({ where: { isActive: true }, orderBy: { monthlyPrice: 'asc' } });
  }

  // ─── Coupons ──────────────────────────────────────────────────────────────

  async validateCoupon(code: string, courseId?: string) {
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) throw Object.assign(new Error('Invalid coupon'), { statusCode: 400 });
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      throw Object.assign(new Error('Coupon expired'), { statusCode: 400 });
    }
    if (coupon.maxRedemptions && coupon.redemptionCount >= coupon.maxRedemptions) {
      throw Object.assign(new Error('Coupon fully redeemed'), { statusCode: 400 });
    }
    if (courseId && coupon.courseIds.length > 0 && !coupon.courseIds.includes(courseId)) {
      throw Object.assign(new Error('Coupon not valid for this course'), { statusCode: 400 });
    }
    return coupon;
  }

  async getRevenueAnalytics(from: Date, to: Date) {
    const [totalRevenue, txCount, avgOrder, topCourses, refunds] = await Promise.all([
      prisma.payment.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: from, lte: to } }, _sum: { amount: true } }),
      prisma.payment.count({ where: { status: 'COMPLETED', createdAt: { gte: from, lte: to } } }),
      prisma.payment.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: from, lte: to } }, _avg: { amount: true } }),
      prisma.payment.groupBy({
        by: ['enrollmentId'],
        where: { status: 'COMPLETED', createdAt: { gte: from, lte: to } },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
        take: 5,
      }),
      prisma.payment.count({ where: { status: 'REFUNDED', createdAt: { gte: from, lte: to } } }),
    ]);

    return {
      totalRevenue: Number(totalRevenue._sum.amount ?? 0),
      transactions: txCount,
      avgOrderValue: Number(avgOrder._avg.amount ?? 0),
      refundRate: txCount > 0 ? Math.round((refunds / txCount) * 100) : 0,
    };
  }

  private async getOrCreateStripeCoupon(coupon: { id: string; discountType: string; discountValue: unknown; code: string }) {
    if (!stripe) throw new Error('Stripe not configured');
    const stripeCoupon = await stripe.coupons.create({
      id: `hs_${coupon.id}`,
      ...(coupon.discountType === 'percentage'
        ? { percent_off: Number(coupon.discountValue) }
        : { amount_off: Math.round(Number(coupon.discountValue) * 100), currency: 'usd' }),
      duration: 'once',
    }).catch(async () => stripe!.coupons.retrieve(`hs_${coupon.id}`));
    return stripeCoupon.id;
  }
}

export const paymentService = new PaymentService();
