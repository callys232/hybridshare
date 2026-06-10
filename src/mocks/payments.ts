export interface MockPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: { seats: number; storage: number; courses: number; aiCredits: number };
  isPopular?: boolean;
}

export interface MockSubscription {
  id: string;
  planId: string;
  planName: string;
  status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIALING';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  seats: number;
  storageBytes: number;
  amount: number;
  currency: string;
  interval: 'monthly' | 'yearly';
}

export interface MockInvoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'OPEN' | 'VOID';
  createdAt: string;
  pdfUrl: string | null;
  description: string;
}

export interface MockPaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export const MOCK_PLANS: MockPlan[] = [
  {
    id: 'plan-starter',
    name: 'Starter',
    price: 0,
    currency: 'USD',
    interval: 'monthly',
    features: ['Up to 3 courses', '5 GB storage', 'Basic analytics', 'Community forum', 'Email support'],
    limits: { seats: 1, storage: 5368709120, courses: 3, aiCredits: 10 },
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    price: 49,
    currency: 'USD',
    interval: 'monthly',
    features: ['Unlimited courses', '50 GB storage', 'Advanced analytics', 'AI content tools', 'Live sessions', 'Priority support', 'Custom certificates', 'SCORM support'],
    limits: { seats: 5, storage: 53687091200, courses: -1, aiCredits: 100 },
    isPopular: true,
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise',
    price: 199,
    currency: 'USD',
    interval: 'monthly',
    features: ['Everything in Pro', 'Unlimited seats', '500 GB storage', 'SSO (SAML/OIDC)', 'White-labeling', 'API access', 'SLA guarantee', 'Dedicated CSM', 'Custom integrations'],
    limits: { seats: -1, storage: 536870912000, courses: -1, aiCredits: 1000 },
  },
];

export const MOCK_SUBSCRIPTION: MockSubscription = {
  id: 'sub-1',
  planId: 'plan-enterprise',
  planName: 'Enterprise',
  status: 'ACTIVE',
  currentPeriodStart: new Date(Date.now() - 15 * 86400000).toISOString(),
  currentPeriodEnd: new Date(Date.now() + 15 * 86400000).toISOString(),
  cancelAtPeriodEnd: false,
  seats: -1,
  storageBytes: 536870912000,
  amount: 199,
  currency: 'USD',
  interval: 'monthly',
};

export const MOCK_INVOICES: MockInvoice[] = [
  { id: 'inv-1', number: 'INV-2026-003', amount: 199, currency: 'USD', status: 'PAID', createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),  pdfUrl: '#', description: 'Enterprise Plan - May 2026' },
  { id: 'inv-2', number: 'INV-2026-002', amount: 199, currency: 'USD', status: 'PAID', createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),  pdfUrl: '#', description: 'Enterprise Plan - Apr 2026' },
  { id: 'inv-3', number: 'INV-2026-001', amount: 199, currency: 'USD', status: 'PAID', createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),  pdfUrl: '#', description: 'Enterprise Plan - Mar 2026' },
];

export const MOCK_PAYMENT_METHODS: MockPaymentMethod[] = [
  { id: 'pm-1', brand: 'visa', last4: '4242', expMonth: 12, expYear: 2027, isDefault: true },
];
