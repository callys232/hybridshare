"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRouter = void 0;
const express_1 = require("express");
const express_2 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const payment_service_1 = require("../services/payment.service");
exports.paymentRouter = (0, express_1.Router)();
const ok = (res, data, code = 200) => res.status(code).json({ success: true, data, error: null });
const uid = (req) => req.user.sub;
// Stripe webhook — raw body required
exports.paymentRouter.post('/webhook/stripe', express_2.default.raw({ type: 'application/json' }), async (req, res, next) => {
    try {
        const sig = req.headers['stripe-signature'];
        await payment_service_1.paymentService.handleStripeWebhook(req.body, sig);
        res.json({ received: true });
    }
    catch (e) {
        next(e);
    }
});
// Public
exports.paymentRouter.get('/plans', async (_req, res, next) => {
    try {
        ok(res, await payment_service_1.paymentService.getPlans());
    }
    catch (e) {
        next(e);
    }
});
exports.paymentRouter.post('/coupon/validate', async (req, res, next) => {
    try {
        const coupon = await payment_service_1.paymentService.validateCoupon(req.body.code, req.body.courseId);
        ok(res, { valid: true, coupon: { id: coupon.id, discountType: coupon.discountType, discountValue: coupon.discountValue } });
    }
    catch (e) {
        next(e);
    }
});
// Auth required
exports.paymentRouter.use(auth_middleware_1.authenticate);
exports.paymentRouter.post('/checkout', async (req, res, next) => {
    try {
        const { courseId, couponCode, successUrl, cancelUrl } = req.body;
        ok(res, await payment_service_1.paymentService.createCheckoutSession(uid(req), courseId, couponCode, successUrl, cancelUrl));
    }
    catch (e) {
        next(e);
    }
});
exports.paymentRouter.post('/subscribe', async (req, res, next) => {
    try {
        const { planId, billingCycle } = req.body;
        ok(res, await payment_service_1.paymentService.createSubscription(uid(req), planId, billingCycle));
    }
    catch (e) {
        next(e);
    }
});
exports.paymentRouter.post('/subscription/cancel', async (req, res, next) => {
    try {
        ok(res, await payment_service_1.paymentService.cancelSubscription(uid(req)));
    }
    catch (e) {
        next(e);
    }
});
exports.paymentRouter.get('/invoices', async (req, res, next) => {
    try {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        ok(res, await prisma.invoice.findMany({ where: { userId: uid(req) }, orderBy: { createdAt: 'desc' } }));
    }
    catch (e) {
        next(e);
    }
});
exports.paymentRouter.get('/history', async (req, res, next) => {
    try {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        ok(res, await prisma.payment.findMany({
            where: { userId: uid(req) },
            orderBy: { createdAt: 'desc' },
            include: { enrollment: { include: { course: { select: { id: true, title: true, thumbnailUrl: true } } } } },
        }));
    }
    catch (e) {
        next(e);
    }
});
exports.paymentRouter.get('/subscription', async (req, res, next) => {
    try {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        ok(res, await prisma.subscription.findFirst({
            where: { userId: uid(req) },
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
        }));
    }
    catch (e) {
        next(e);
    }
});
exports.paymentRouter.get('/analytics/revenue', async (req, res, next) => {
    try {
        const { from, to } = req.query;
        ok(res, await payment_service_1.paymentService.getRevenueAnalytics(from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to ? new Date(to) : new Date()));
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=payment.routes.js.map