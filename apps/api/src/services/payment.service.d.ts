export declare class PaymentService {
    createCheckoutSession(userId: string, courseId: string, couponCode?: string, successUrl?: string, cancelUrl?: string): Promise<{
        sessionId: any;
        url: any;
        amount: number;
        currency: any;
        discountAmount: number;
    }>;
    handleStripeWebhook(rawBody: Buffer, signature: string): Promise<void>;
    private handleCheckoutCompleted;
    private handleInvoicePaid;
    private handleInvoiceFailed;
    private handleSubscriptionUpdated;
    private handleSubscriptionCancelled;
    createSubscription(userId: string, planId: string, billingCycle: 'monthly' | 'yearly'): Promise<any>;
    cancelSubscription(userId: string): Promise<any>;
    getPlans(): Promise<any>;
    validateCoupon(code: string, courseId?: string): Promise<any>;
    getRevenueAnalytics(from: Date, to: Date): Promise<{
        totalRevenue: number;
        transactions: any;
        avgOrderValue: number;
        refundRate: number;
    }>;
    private getOrCreateStripeCoupon;
}
export declare const paymentService: PaymentService;
//# sourceMappingURL=payment.service.d.ts.map