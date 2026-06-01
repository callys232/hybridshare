export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED' | 'PAUSED' | 'INCOMPLETE' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'DISPUTED' | 'CANCELLED';

export interface Subscription {
  id: string;
  userId?: string;
  organizationId?: string;
  planId: string;
  plan?: import('./organization').Plan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  stripeSubId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  subscriptionId?: string;
  userId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripeInvoiceId?: string;
  pdfUrl?: string;
  paidAt?: string;
  dueDate?: string;
  lineItems: InvoiceLineItem[];
  createdAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Payment {
  id: string;
  userId?: string;
  invoiceId?: string;
  enrollmentId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string;
  couponId?: string;
  discountAmount: number;
  metadata: Record<string, unknown>;
  refundedAt?: string;
  refundReason?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  currency: string;
  maxRedemptions?: number;
  redemptionCount: number;
  minPurchase?: number;
  expiresAt?: string;
  isActive: boolean;
  courseIds: string[];
  createdAt: string;
}

export interface CheckoutSession {
  courseId: string;
  couponCode?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  sessionId: string;
  url: string;
  amount: number;
  currency: string;
  discountAmount: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowth: number;
  totalTransactions: number;
  avgOrderValue: number;
  refundRate: number;
  topCourses: Array<{
    courseId: string;
    title: string;
    revenue: number;
    transactions: number;
  }>;
  revenueOverTime: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
  paymentMethodDistribution: Record<string, number>;
}

export interface PayoutInfo {
  instructorId: string;
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  lastPayoutAt?: string;
  payoutMethod?: {
    type: 'bank' | 'paypal' | 'stripe';
    last4?: string;
    email?: string;
  };
}
