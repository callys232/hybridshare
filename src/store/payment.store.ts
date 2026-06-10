import { create } from 'zustand';
import { api, type ApiResponse } from '@/lib/api';
import {
  isMockMode,
  MOCK_PLANS, MOCK_SUBSCRIPTION, MOCK_INVOICES, MOCK_PAYMENT_METHODS,
} from '@/mocks';
import type { MockPlan, MockSubscription, MockInvoice, MockPaymentMethod } from '@/mocks';

type Plan          = MockPlan;
type Subscription  = MockSubscription;
type Invoice       = MockInvoice;
type PaymentMethod = MockPaymentMethod;

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

export const usePaymentStore = create<PaymentState>((set, get) => ({
  plans: [],
  subscription: null,
  invoices: [],
  paymentMethods: [],
  isLoading: false,
  error: null,

  fetchPlans: async () => {
    set({ isLoading: true });
    if (isMockMode()) {
      set({ plans: MOCK_PLANS, isLoading: false });
      return;
    }
    try {
      const res = await api.get<ApiResponse<Plan[]>>('/payments/plans');
      set({ plans: res.data.data!, isLoading: false });
    } catch {
      set({ plans: MOCK_PLANS, isLoading: false });
    }
  },

  fetchSubscription: async () => {
    set({ isLoading: true });
    if (isMockMode()) {
      set({ subscription: MOCK_SUBSCRIPTION, isLoading: false });
      return;
    }
    try {
      const res = await api.get<ApiResponse<Subscription>>('/payments/subscription');
      set({ subscription: res.data.data!, isLoading: false });
    } catch {
      set({ subscription: MOCK_SUBSCRIPTION, isLoading: false });
    }
  },

  fetchInvoices: async () => {
    if (isMockMode()) {
      set({ invoices: MOCK_INVOICES });
      return;
    }
    try {
      const res = await api.get<ApiResponse<Invoice[]>>('/payments/invoices');
      set({ invoices: res.data.data! });
    } catch {
      set({ invoices: MOCK_INVOICES });
    }
  },

  fetchPaymentMethods: async () => {
    if (isMockMode()) {
      set({ paymentMethods: MOCK_PAYMENT_METHODS });
      return;
    }
    try {
      const res = await api.get<ApiResponse<PaymentMethod[]>>('/payments/methods');
      set({ paymentMethods: res.data.data! });
    } catch {
      set({ paymentMethods: MOCK_PAYMENT_METHODS });
    }
  },

  createCheckoutSession: async (planId, interval) => {
    if (isMockMode()) return { url: '#' };
    const res = await api.post<ApiResponse<{ url: string }>>('/payments/checkout', { planId, interval });
    return res.data.data!;
  },

  createPortalSession: async () => {
    if (isMockMode()) return { url: '#' };
    const res = await api.post<ApiResponse<{ url: string }>>('/payments/portal');
    return res.data.data!;
  },

  cancelSubscription: async () => {
    if (isMockMode()) {
      set((s) => ({ subscription: s.subscription ? { ...s.subscription, cancelAtPeriodEnd: true } : null }));
      return;
    }
    await api.post('/payments/subscription/cancel');
    set((s) => ({ subscription: s.subscription ? { ...s.subscription, cancelAtPeriodEnd: true } : null }));
  },

  resumeSubscription: async () => {
    if (isMockMode()) {
      set((s) => ({ subscription: s.subscription ? { ...s.subscription, cancelAtPeriodEnd: false } : null }));
      return;
    }
    await api.post('/payments/subscription/resume');
    set((s) => ({ subscription: s.subscription ? { ...s.subscription, cancelAtPeriodEnd: false } : null }));
  },

  clearError: () => set({ error: null }),
}));
