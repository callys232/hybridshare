"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = exports.PaymentService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const database_1 = require("../config/database");
const enrollment_service_1 = require("./enrollment.service");
const notification_service_1 = require("./notification.service");
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
const stripe = env_1.env.STRIPE_SECRET_KEY ? new stripe_1.default(env_1.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' }) : null;
class PaymentService {
    // ─── Course Purchase ───────────────────────────────────────────────────────
    async createCheckoutSession(userId, courseId, couponCode, successUrl, cancelUrl) {
        if (!stripe)
            throw Object.assign(new Error('Payments not configured'), { statusCode: 503 });
        const [course, user] = await Promise.all([
            database_1.prisma.course.findUnique({ where: { id: courseId } }),
            database_1.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } }),
        ]);
        if (!course)
            throw Object.assign(new Error('Course not found'), { statusCode: 404 });
        if (!user)
            throw Object.assign(new Error('User not found'), { statusCode: 404 });
        if (course.isFree || Number(course.price) === 0) {
            throw Object.assign(new Error('This course is free, use /enroll'), { statusCode: 400 });
        }
        // Check already enrolled
        const existing = await database_1.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        if (existing && ['ACTIVE', 'COMPLETED'].includes(existing.status)) {
            throw Object.assign(new Error('Already enrolled in this course'), { statusCode: 409 });
        }
        let unitAmount = Math.round(Number(course.price) * 100);
        let discountAmount = 0;
        let coupon = null;
        if (couponCode) {
            coupon = await this.validateCoupon(couponCode, courseId);
            if (coupon) {
                if (coupon.discountType === 'percentage') {
                    discountAmount = Math.round(unitAmount * (Number(coupon.discountValue) / 100));
                }
                else {
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
        let stripeCustomerId;
        const subRecord = await database_1.prisma.subscription.findFirst({ where: { userId }, select: { stripeCustomerId: true } });
        if (subRecord?.stripeCustomerId) {
            stripeCustomerId = subRecord.stripeCustomerId;
        }
        else {
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
            success_url: successUrl ?? `${env_1.env.APP_URL}/courses/${course.slug}/learn?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl ?? `${env_1.env.APP_URL}/courses/${course.slug}`,
            metadata: { courseId, userId, couponId: coupon?.id ?? '' },
            payment_intent_data: { metadata: { courseId, userId } },
            discounts: coupon ? [{ coupon: await this.getOrCreateStripeCoupon(coupon) }] : [],
        });
        logger_1.logger.info('Checkout session created', { userId, courseId, sessionId: session.id });
        return {
            sessionId: session.id,
            url: session.url,
            amount: unitAmount / 100,
            currency: course.currency,
            discountAmount: discountAmount / 100,
        };
    }
    async handleStripeWebhook(rawBody, signature) {
        if (!stripe || !env_1.env.STRIPE_WEBHOOK_SECRET) {
            throw Object.assign(new Error('Stripe not configured'), { statusCode: 503 });
        }
        let event;
        try {
            event = stripe.webhooks.constructEvent(rawBody, signature, env_1.env.STRIPE_WEBHOOK_SECRET);
        }
        catch (err) {
            throw Object.assign(new Error(`Webhook signature invalid: ${err.message}`), { statusCode: 400 });
        }
        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutCompleted(event.data.object);
                break;
            case 'invoice.paid':
                await this.handleInvoicePaid(event.data.object);
                break;
            case 'invoice.payment_failed':
                await this.handleInvoiceFailed(event.data.object);
                break;
            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdated(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await this.handleSubscriptionCancelled(event.data.object);
                break;
            default:
                logger_1.logger.debug('Unhandled Stripe event', { type: event.type });
        }
    }
    async handleCheckoutCompleted(session) {
        const { courseId, userId, couponId } = session.metadata ?? {};
        if (!courseId || !userId)
            return;
        const payment = await database_1.prisma.payment.create({
            data: {
                userId,
                amount: (session.amount_total ?? 0) / 100,
                currency: session.currency ?? 'usd',
                status: 'COMPLETED',
                method: 'stripe',
                stripePaymentIntentId: session.payment_intent,
                couponId: couponId || undefined,
                discountAmount: (session.total_details?.amount_discount ?? 0) / 100,
                metadata: { sessionId: session.id },
            },
        });
        await enrollment_service_1.enrollmentService.enrollAfterPayment(userId, courseId, payment.id);
        // Update coupon redemption count
        if (couponId) {
            await database_1.prisma.coupon.update({ where: { id: couponId }, data: { redemptionCount: { increment: 1 } } });
            await database_1.prisma.couponRedemption.create({ data: { couponId, userId } });
        }
        logger_1.logger.info('Course purchase completed', { userId, courseId, paymentId: payment.id });
    }
    async handleInvoicePaid(invoice) {
        if (!invoice.subscription)
            return;
        const sub = await database_1.prisma.subscription.findFirst({ where: { stripeSubId: invoice.subscription } });
        if (sub) {
            await database_1.prisma.subscription.update({ where: { id: sub.id }, data: { status: 'ACTIVE' } });
            await database_1.prisma.invoice.create({
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
    async handleInvoiceFailed(invoice) {
        if (!invoice.subscription)
            return;
        const sub = await database_1.prisma.subscription.findFirst({ where: { stripeSubId: invoice.subscription } });
        if (sub) {
            await database_1.prisma.subscription.update({ where: { id: sub.id }, data: { status: 'PAST_DUE' } });
            if (sub.userId) {
                await notification_service_1.notificationService.create(sub.userId, {
                    type: 'payment_failed',
                    title: 'Payment Failed',
                    message: 'Your subscription payment failed. Please update your payment method.',
                    resourceType: 'subscription',
                    resourceId: sub.id,
                });
            }
        }
    }
    async handleSubscriptionUpdated(subscription) {
        const sub = await database_1.prisma.subscription.findFirst({ where: { stripeSubId: subscription.id } });
        if (!sub)
            return;
        await database_1.prisma.subscription.update({
            where: { id: sub.id },
            data: {
                status: subscription.status.toUpperCase(),
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
        });
    }
    async handleSubscriptionCancelled(subscription) {
        const sub = await database_1.prisma.subscription.findFirst({ where: { stripeSubId: subscription.id } });
        if (!sub)
            return;
        await database_1.prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'CANCELLED', cancelledAt: new Date() },
        });
    }
    // ─── Subscription Plans ───────────────────────────────────────────────────
    async createSubscription(userId, planId, billingCycle) {
        if (!stripe)
            throw Object.assign(new Error('Payments not configured'), { statusCode: 503 });
        const plan = await database_1.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan)
            throw Object.assign(new Error('Plan not found'), { statusCode: 404 });
        const user = await database_1.prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
        if (!user)
            throw Object.assign(new Error('User not found'), { statusCode: 404 });
        const priceId = billingCycle === 'yearly' ? plan.stripePriceYearlyId : plan.stripePriceMonthlyId;
        if (!priceId)
            throw Object.assign(new Error('Plan pricing not configured'), { statusCode: 503 });
        const customer = await stripe.customers.create({ email: user.email, name: user.name });
        const sub = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            trial_period_days: 14,
            metadata: { userId, planId },
        });
        return database_1.prisma.subscription.create({
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
    async cancelSubscription(userId) {
        if (!stripe)
            throw Object.assign(new Error('Payments not configured'), { statusCode: 503 });
        const sub = await database_1.prisma.subscription.findFirst({
            where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
        });
        if (!sub?.stripeSubId)
            throw Object.assign(new Error('No active subscription'), { statusCode: 404 });
        await stripe.subscriptions.update(sub.stripeSubId, { cancel_at_period_end: true });
        return database_1.prisma.subscription.update({
            where: { id: sub.id },
            data: { cancelAtPeriodEnd: true },
        });
    }
    async getPlans() {
        return database_1.prisma.plan.findMany({ where: { isActive: true }, orderBy: { monthlyPrice: 'asc' } });
    }
    // ─── Coupons ──────────────────────────────────────────────────────────────
    async validateCoupon(code, courseId) {
        const coupon = await database_1.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
        if (!coupon || !coupon.isActive)
            throw Object.assign(new Error('Invalid coupon'), { statusCode: 400 });
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
    async getRevenueAnalytics(from, to) {
        const [totalRevenue, txCount, avgOrder, topCourses, refunds] = await Promise.all([
            database_1.prisma.payment.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: from, lte: to } }, _sum: { amount: true } }),
            database_1.prisma.payment.count({ where: { status: 'COMPLETED', createdAt: { gte: from, lte: to } } }),
            database_1.prisma.payment.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: from, lte: to } }, _avg: { amount: true } }),
            database_1.prisma.payment.groupBy({
                by: ['enrollmentId'],
                where: { status: 'COMPLETED', createdAt: { gte: from, lte: to } },
                _sum: { amount: true },
                _count: true,
                orderBy: { _sum: { amount: 'desc' } },
                take: 5,
            }),
            database_1.prisma.payment.count({ where: { status: 'REFUNDED', createdAt: { gte: from, lte: to } } }),
        ]);
        return {
            totalRevenue: Number(totalRevenue._sum.amount ?? 0),
            transactions: txCount,
            avgOrderValue: Number(avgOrder._avg.amount ?? 0),
            refundRate: txCount > 0 ? Math.round((refunds / txCount) * 100) : 0,
        };
    }
    async getOrCreateStripeCoupon(coupon) {
        if (!stripe)
            throw new Error('Stripe not configured');
        const stripeCoupon = await stripe.coupons.create({
            id: `hs_${coupon.id}`,
            ...(coupon.discountType === 'percentage'
                ? { percent_off: Number(coupon.discountValue) }
                : { amount_off: Math.round(Number(coupon.discountValue) * 100), currency: 'usd' }),
            duration: 'once',
        }).catch(async () => stripe.coupons.retrieve(`hs_${coupon.id}`));
        return stripeCoupon.id;
    }
}
exports.PaymentService = PaymentService;
exports.paymentService = new PaymentService();
//# sourceMappingURL=payment.service.js.map