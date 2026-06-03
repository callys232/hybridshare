/**
 * Stripe integration — uses Stripe REST API directly via fetch.
 * Zero dependencies. Works without the `stripe` npm package.
 */

export type PlanType = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY ?? '';

async function stripePost(path: string, body: Record<string, unknown>): Promise<unknown> {
  const encoded = Object.entries(flattenForStripe(body))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_KEY}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: encoded,
  });
  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Stripe error ${res.status}`);
  }
  return res.json();
}

function flattenForStripe(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v !== null && v !== undefined && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(result, flattenForStripe(v as Record<string, unknown>, key));
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => { result[`${key}[${i}]`] = String(item); });
    } else if (v !== null && v !== undefined) {
      result[key] = String(v);
    }
  }
  return result;
}

// ─── Plan + Cloud add-on config ───────────────────────────────────────────────

export interface PlanConfig {
  type:         PlanType;
  name:         string;
  storageQuota: bigint;
  maxMembers:   number;
  prices:       { monthly: string; yearly: string } | null;
}

export const PLANS: Record<PlanType, PlanConfig> = {
  FREE:         { type: 'FREE',         name: 'Free',         storageQuota: BigInt(5   * 1024 ** 3), maxMembers: 1,  prices: null },
  STARTER:      { type: 'STARTER',      name: 'Starter',      storageQuota: BigInt(50  * 1024 ** 3), maxMembers: 5,  prices: { monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '', yearly: process.env.STRIPE_PRICE_STARTER_YEARLY ?? '' } },
  PROFESSIONAL: { type: 'PROFESSIONAL', name: 'Professional', storageQuota: BigInt(500 * 1024 ** 3), maxMembers: 20, prices: { monthly: process.env.STRIPE_PRICE_PRO_MONTHLY     ?? '', yearly: process.env.STRIPE_PRICE_PRO_YEARLY     ?? '' } },
  ENTERPRISE:   { type: 'ENTERPRISE',   name: 'Enterprise',   storageQuota: BigInt(5   * 1024 ** 4), maxMembers: -1, prices: { monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? '', yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY ?? '' } },
};

export interface CloudAddonConfig {
  priceId:      string;
  storageQuota: bigint;
  label:        string;
  monthlyPrice: number;
}

export const CLOUD_ADDONS: Record<PlanType, CloudAddonConfig> = {
  FREE:         { priceId: process.env.STRIPE_PRICE_CLOUD_FREE        ?? '', storageQuota: BigInt(50   * 1024 ** 3), label: '50 GB Cloud',  monthlyPrice: 5  },
  STARTER:      { priceId: process.env.STRIPE_PRICE_CLOUD_STARTER     ?? '', storageQuota: BigInt(500  * 1024 ** 3), label: '500 GB Cloud', monthlyPrice: 10 },
  PROFESSIONAL: { priceId: process.env.STRIPE_PRICE_CLOUD_PRO         ?? '', storageQuota: BigInt(2    * 1024 ** 4), label: '2 TB Cloud',   monthlyPrice: 25 },
  ENTERPRISE:   { priceId: process.env.STRIPE_PRICE_CLOUD_ENTERPRISE  ?? '', storageQuota: BigInt(10   * 1024 ** 4), label: '10 TB Cloud',  monthlyPrice: 50 },
};

// ─── Stripe helpers ───────────────────────────────────────────────────────────

export interface StripeCheckoutSession { id: string; url: string | null }
export interface StripeBillingPortal   { url: string }
export interface StripeCustomer        { id: string }
export interface StripeSub             { id: string; status: string; cancel_at_period_end: boolean; metadata?: Record<string, string> }

// Minimal stripe-like client built on fetch
export const stripe = {
  customers: {
    create: (data: { email: string; name: string; metadata: Record<string, string> }) =>
      stripePost('customers', data) as Promise<StripeCustomer>,
  },
  checkout: {
    sessions: {
      create: (data: Record<string, unknown>) =>
        stripePost('checkout/sessions', data) as Promise<StripeCheckoutSession>,
    },
  },
  billingPortal: {
    sessions: {
      create: (data: { customer: string; return_url: string }) =>
        stripePost('billing_portal/sessions', data) as Promise<StripeBillingPortal>,
    },
  },
  subscriptions: {
    cancel: (id: string) =>
      stripePost(`subscriptions/${id}/cancel`, {}) as Promise<StripeSub>,
    update: (id: string, data: Record<string, unknown>) =>
      stripePost(`subscriptions/${id}`, data) as Promise<StripeSub>,
  },
  webhooks: {
    constructEvent(body: string, sig: string, secret: string) {
      // Minimal Stripe webhook verification using Node.js crypto
      const { createHmac } = require('crypto') as typeof import('crypto');
      const parts     = sig.split(',').reduce<Record<string, string>>((acc, p) => { const [k, v] = p.split('='); acc[k] = v; return acc; }, {});
      const timestamp = parts['t'];
      const v1        = parts['v1'];
      const expected  = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
      if (expected !== v1) throw new Error('Invalid Stripe signature');
      return JSON.parse(body) as { type: string; data: { object: unknown } };
    },
  },
};

export function stripePriceForPlan(planType: PlanType, interval: 'monthly' | 'yearly'): string {
  const plan = PLANS[planType];
  if (!plan.prices) throw new Error(`Plan ${planType} has no Stripe price`);
  return plan.prices[interval];
}

export async function getOrCreateStripeCustomer(
  userId: string, email: string, name: string, existingId?: string | null
): Promise<string> {
  if (existingId) return existingId;
  const customer = await stripe.customers.create({ email, name, metadata: { userId } });
  return customer.id;
}
