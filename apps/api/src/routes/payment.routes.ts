import { Router } from 'express';
import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { paymentService } from '../services/payment.service';
import type { Request, Response, NextFunction } from 'express';

export const paymentRouter = Router();
const ok = (res: Response, data: unknown, code = 200) => res.status(code).json({ success: true, data, error: null });
const uid = (req: Request) => (req as Request & { user: { sub: string } }).user.sub;

// Stripe webhook — raw body required
paymentRouter.post('/webhook/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res, next) => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      await paymentService.handleStripeWebhook(req.body, sig);
      res.json({ received: true });
    } catch (e) { next(e); }
  }
);

// Public
paymentRouter.get('/plans', async (_req, res, next) => {
  try { ok(res, await paymentService.getPlans()); } catch (e) { next(e); }
});

paymentRouter.post('/coupon/validate', async (req, res, next) => {
  try {
    const coupon = await paymentService.validateCoupon(req.body.code, req.body.courseId);
    ok(res, { valid: true, coupon: { id: coupon.id, discountType: coupon.discountType, discountValue: coupon.discountValue } });
  } catch (e) { next(e); }
});

// Auth required
paymentRouter.use(authenticate);

paymentRouter.post('/checkout', async (req, res, next) => {
  try {
    const { courseId, couponCode, successUrl, cancelUrl } = req.body;
    ok(res, await paymentService.createCheckoutSession(uid(req), courseId, couponCode, successUrl, cancelUrl));
  } catch (e) { next(e); }
});

paymentRouter.post('/subscribe', async (req, res, next) => {
  try {
    const { planId, billingCycle } = req.body;
    ok(res, await paymentService.createSubscription(uid(req), planId, billingCycle));
  } catch (e) { next(e); }
});

paymentRouter.post('/subscription/cancel', async (req, res, next) => {
  try { ok(res, await paymentService.cancelSubscription(uid(req))); } catch (e) { next(e); }
});

paymentRouter.get('/invoices', async (req, res, next) => {
  try {
    const { prisma } = await import('../config/database');
    ok(res, await prisma.invoice.findMany({ where: { userId: uid(req) }, orderBy: { createdAt: 'desc' } }));
  } catch (e) { next(e); }
});

paymentRouter.get('/history', async (req, res, next) => {
  try {
    const { prisma } = await import('../config/database');
    ok(res, await prisma.payment.findMany({
      where: { userId: uid(req) },
      orderBy: { createdAt: 'desc' },
      include: { enrollment: { include: { course: { select: { id: true, title: true, thumbnailUrl: true } } } } },
    }));
  } catch (e) { next(e); }
});

paymentRouter.get('/subscription', async (req, res, next) => {
  try {
    const { prisma } = await import('../config/database');
    ok(res, await prisma.subscription.findFirst({
      where: { userId: uid(req) },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    }));
  } catch (e) { next(e); }
});

paymentRouter.get('/analytics/revenue', async (req, res, next) => {
  try {
    const { from, to } = req.query as { from?: string; to?: string };
    ok(res, await paymentService.getRevenueAnalytics(
      from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to ? new Date(to) : new Date()
    ));
  } catch (e) { next(e); }
});
