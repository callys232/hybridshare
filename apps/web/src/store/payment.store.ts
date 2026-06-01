import { create } from 'zustand';
import { api, type ApiResponse } from '@/lib/api';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    seats: number;
    storage: number;
    courses: number;
    aiCredits: number;
  };
  isPopular?: boolean;
}

interface Subscription {
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

interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'OPEN' | 'VOID';
  createdAt: string;
  pdfUrl: string | null;
  description: string;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface PaymentState {
  plans: Plan[];
  subscription: Subscription | null;
  invoices: Invoice[];
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  error: string | null;

  fetchPlans: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  fetchPaymentMethods: () => Promise<void>;
  createCheckoutSession: (planId: string, interval: 'monthly' | 'yearly') => Promise<{ url: string }>;
  createPortalSession: () => Promise<{ url: string }>;
  cancelSubscription: () => Promise<void>;
  resumeSubscription: () => Promise<void>;
  clearError: () => void;
}

const MOCK_PLANS: Plan[] = [
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

const MOCK_SUBSCRIPTION: Subscription = {
  id: 'sub-1',
  planId: 'plan-pro',
  planName: 'Pro',
  status: 'ACTIVE',
  currentPeriodStart: new Date(Date.now() - 15 * 86400000).toISOString(),
  currentPeriodEnd: new Date(Date.now() + 15 * 86400000).toISOString(),
  cancelAtPeriodEnd: false,
  seats: 5,
  storageBytes: 53687091200,
  amount: 49,
  currency: 'USD',
  interval: 'monthly',
};

const MOCK_INVOICES: Invoice[] = [
  { id: 'inv-1', number: 'INV-2024-001', amount: 49, currency: 'USD', status: 'PAID', createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), pdfUrl: '#', description: 'Pro Plan â€” May 2024' },
  { id: 'inv-2', number: 'INV-2024-002', amount: 49, currency: 'USD', status: 'PAID', createdAt: new Date(Date.now() - 60 * 86400000).toISOString(), pdfUrl: '#', description: 'Pro Plan â€” Apr 2024' },
  { id: 'inv-3', number: 'INV-2024-003', amount: 49, currency: 'USD', status: 'PAID', createdAt: new Date(Date.now() - 90 * 86400000).toISOString(), pdfUrl: '#', description: 'Pro Plan â€” Mar 2024' },
];

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm-1', brand: 'visa', last4: '4242', expMonth: 12, expYear: 2027, isDefault: true },
];

export const usePaymentStore = create<PaymentState>((set) => ({
  plans: [],
  subscription: null,
  invoices: [],
  paymentMethods: [],
  isLoading: false,
  error: null,

  fetchPlans: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<ApiResponse<Plan[]>>('/payments/plans');
      set({ plans: res.data.data!, isLoading: false });
    } catch {
      set({ plans: MOCK_PLANS, isLoading: false });
    }
  },

  fetchSubscription: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<ApiResponse<Subscription>>('/payments/subscription');
      set({ subscription: res.data.data!, isLoading: false });
    } catch {
      set({ subscription: MOCK_SUBSCRIPTION, isLoading: false });
    }
  },

  fetchInvoices: async () => {
    try {
      const res = await api.get<ApiResponse<Invoice[]>>('/payments/invoices');
      set({ invoices: res.data.data! });
    } catch {
      set({ invoices: MOCK_INVOICES });
    }
  },

  fetchPaymentMethods: async () => {
    try {
      const res = await api.get<ApiResponse<PaymentMethod[]>>('/payments/methods');
      set({ paymentMethods: res.data.data! });
    } catch {
      set({ paymentMethods: MOCK_PAYMENT_METHODS });
    }
  },

  createCheckoutSession: async (planId, interval) => {
    const res = await api.post<ApiResponse<{ url: string }>>('/payments/checkout', { planId, interval });
    return res.data.data!;
  },

  createPortalSession: async () => {
    const res = await api.post<ApiResponse<{ url: string }>>('/payments/portal');
    return res.data.data!;
  },

  cancelSubscription: async () => {
    await api.post('/payments/subscription/cancel');
    set((s) => ({
      subscription: s.subscription
        ? { ...s.subscription, cancelAtPeriodEnd: true }
        : null,
    }));
  },

  resumeSubscription: async () => {
    await api.post('/payments/subscription/resume');
    set((s) => ({
      subscription: s.subscription
        ? { ...s.subscription, cancelAtPeriodEnd: false }
        : null,
    }));
  },

  clearError: () => set({ error: null }),
}));
