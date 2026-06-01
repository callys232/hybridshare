'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/component/ui/Spinner';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for exploring the platform',
    color: '#94a3b8',
    features: [
      '3 free courses',
      'Basic progress tracking',
      'Community forum access',
      '5GB storage',
      'Email support',
    ],
    limits: ['No certificates', 'No live sessions', 'No AI features'],
    current: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    period: 'month',
    description: 'For individual learners',
    color: '#60a5fa',
    features: [
      'Unlimited courses',
      'Full progress tracking',
      'Certificates of completion',
      '50GB storage',
      'Priority email support',
      'Quiz & assignment access',
      'Mobile app access',
    ],
    limits: ['No live sessions', 'Limited AI features'],
    current: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    period: 'month',
    description: 'For serious learners & instructors',
    color: '#c12129',
    badge: 'Most Popular',
    features: [
      'Everything in Starter',
      'Live session access',
      'AI learning assistant',
      'AI quiz generation',
      '200GB storage',
      'Course creation tools',
      'Advanced analytics',
      'Leaderboard ranking',
      'Phone & chat support',
    ],
    limits: [],
    current: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    period: 'month',
    description: 'For teams & organizations',
    color: '#1a1a1a',
    features: [
      'Everything in Professional',
      'Multi-tenant organization',
      'SSO (SAML/OIDC)',
      'White-labeling',
      'API access & webhooks',
      'Custom integrations',
      'SCORM/xAPI compliance',
      'Dedicated account manager',
      'SLA guarantee',
      'Unlimited storage',
    ],
    limits: [],
    current: false,
  },
];

function PlanCard({ plan, isAnnual, onSelect }: {
  plan: typeof PLANS[0];
  isAnnual: boolean;
  onSelect: (id: string) => void;
}) {
  const price = isAnnual ? Math.round(plan.price * 0.8) : plan.price;

  return (
    <div className={cn(
      'relative bg-white border-2 rounded-2xl p-6 flex flex-col transition-all duration-200 group',
      plan.current
        ? 'border-brand-red shadow-lg shadow-red-100'
        : 'border-brand-gray hover:border-brand-black hover:shadow-lg cursor-pointer'
    )}>
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-red text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm">
          {plan.badge}
        </div>
      )}
      {plan.current && (
        <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
          Current Plan
        </div>
      )}

      {/* Header */}
      <div className="mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black mb-3 transition-transform duration-150 group-hover:scale-110"
          style={{ backgroundColor: plan.color }}
        >
          {plan.name.charAt(0)}
        </div>
        <h3 className="text-lg font-black text-brand-black">{plan.name}</h3>
        <p className="text-xs text-brand-gray-dark mt-0.5">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="mb-5">
        {plan.price === 0 ? (
          <span className="text-3xl font-black text-brand-black">Free</span>
        ) : (
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-brand-black">${price}</span>
              <span className="text-sm text-brand-gray-dark">/{plan.period}</span>
            </div>
            {isAnnual && plan.price > 0 && (
              <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                Save ${(plan.price - price) * 12}/year
              </p>
            )}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="flex-1 space-y-2 mb-6">
        {plan.features.map((f) => (
          <div key={f} className="flex items-start gap-2">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs text-brand-black">{f}</span>
          </div>
        ))}
        {plan.limits.map((l) => (
          <div key={l} className="flex items-start gap-2 opacity-50">
            <svg className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-xs text-brand-gray-dark">{l}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={() => onSelect(plan.id)}
        disabled={plan.current}
        className={cn(
          'w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-150 active:scale-[0.98]',
          plan.current
            ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200 cursor-default'
            : plan.id === 'enterprise'
              ? 'bg-brand-black hover:bg-brand-red text-white hover:shadow-md'
              : 'border-2 hover:bg-brand-black hover:text-white hover:shadow-md',
          !plan.current && `border-current text-brand-black`
        )}
        style={!plan.current ? { borderColor: plan.color, color: plan.color } : undefined}
      >
        {plan.current ? 'âœ“ Current Plan' : plan.price === 0 ? 'Downgrade' : 'Upgrade'}
      </button>
    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: { id: string; date: string; amount: number; status: string; plan: string } }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-brand-white-soft transition-all duration-150 group border-b border-brand-gray last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-black">
          {invoice.plan} Plan â€” {new Date(invoice.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <p className="text-xs text-brand-gray-dark">Invoice #{invoice.id}</p>
      </div>
      <span className={cn(
        'text-[11px] font-bold px-2.5 py-1 rounded-full border',
        invoice.status === 'paid'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      )}>
        {invoice.status}
      </span>
      <span className="font-bold text-sm text-brand-black w-20 text-right">${invoice.amount}</span>
      <button
        type="button"
        className="icon-btn w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        title="Download invoice"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>
    </div>
  );
}

export default function BillingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeTab, setActiveTab] = useState<'plans' | 'invoices' | 'payment'>('plans');
  const [isLoading, setIsLoading] = useState(false);

  const invoices = [
    { id: 'INV-2026-001', date: '2026-05-01', amount: 79, status: 'paid', plan: 'Professional' },
    { id: 'INV-2026-002', date: '2026-04-01', amount: 79, status: 'paid', plan: 'Professional' },
    { id: 'INV-2026-003', date: '2026-03-01', amount: 79, status: 'paid', plan: 'Professional' },
    { id: 'INV-2026-004', date: '2026-02-01', amount: 79, status: 'paid', plan: 'Professional' },
    { id: 'INV-2025-005', date: '2026-01-01', amount: 79, status: 'paid', plan: 'Professional' },
  ];

  const handleSelectPlan = (planId: string) => {
    if (planId === 'enterprise') {
      window.open('mailto:sales@hybridshare.io?subject=Enterprise Plan Inquiry', '_blank');
      return;
    }
    // Would open Stripe checkout
    console.log('Select plan:', planId);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="page-title">Billing & Plans</h1>
        <p className="text-sm text-brand-gray-dark mt-1">Manage your subscription, payment methods, and invoices.</p>
      </div>

      {/* Current Plan Summary */}
      <div className="bg-gradient-to-br from-brand-black to-zinc-800 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-zinc-400 text-sm mb-1">Current Plan</p>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-black">Professional</h2>
              <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">Active</span>
            </div>
            <p className="text-zinc-300 text-sm">$79/month Â· Renews June 1, 2026</p>
          </div>
          <div className="text-right">
            <p className="text-zinc-400 text-xs mb-1">Next billing</p>
            <p className="text-xl font-black text-white">$79.00</p>
            <p className="text-xs text-zinc-400">Jun 1, 2026</p>
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-white/10 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-400">Storage used</span>
              <span className="text-white font-semibold">12.4 GB / 200 GB</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white/60 rounded-full" style={{ width: '6.2%' }} />
            </div>
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 transition-all duration-150 active:scale-[0.98]"
          >
            Cancel Plan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-brand-gray">
        {(['plans', 'invoices', 'payment'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-150 -mb-px capitalize',
              activeTab === tab
                ? 'border-brand-red text-brand-red'
                : 'border-transparent text-brand-gray-dark hover:text-brand-black hover:border-brand-gray'
            )}
          >
            {tab === 'payment' ? 'Payment Method' : tab}
          </button>
        ))}
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-6 animate-fade-in">
          {/* Annual toggle */}
          <div className="flex items-center gap-4">
            <span className={cn('text-sm font-semibold', !isAnnual ? 'text-brand-black' : 'text-brand-gray-dark')}>
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setIsAnnual((p) => !p)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-all duration-200',
                isAnnual ? 'bg-brand-red' : 'bg-brand-gray'
              )}
            >
              <div className={cn(
                'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                isAnnual ? 'translate-x-6' : 'translate-x-0.5'
              )} />
            </button>
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-semibold', isAnnual ? 'text-brand-black' : 'text-brand-gray-dark')}>
                Annual
              </span>
              <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} isAnnual={isAnnual} onSelect={handleSelectPlan} />
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-900">Need a custom plan?</p>
              <p className="text-xs text-amber-800 mt-0.5">
                For teams of 10+, custom integrations, or specific compliance requirements, our Enterprise plan can be tailored to your needs.{' '}
                <a href="mailto:sales@hybridshare.io" className="font-semibold underline hover:no-underline">Contact sales â†’</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="animate-fade-in">
          <div className="bg-white border border-brand-gray rounded-2xl overflow-hidden hover:border-brand-black transition-colors duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-gray">
              <h3 className="font-bold text-brand-black">Billing History</h3>
              <button type="button" className="btn-secondary text-xs flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export All
              </button>
            </div>
            {invoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} />
            ))}
          </div>
        </div>
      )}

      {/* Payment Method Tab */}
      {activeTab === 'payment' && (
        <div className="space-y-4 animate-fade-in">
          {/* Current card */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-700 rounded-2xl p-6 text-white max-w-sm shadow-xl">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs text-zinc-400">Card Number</p>
                <p className="text-sm font-mono tracking-widest mt-0.5">â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ 4242</p>
              </div>
              <div className="text-right">
                <svg className="w-10 h-6 opacity-70" viewBox="0 0 48 30" fill="none">
                  <circle cx="19" cy="15" r="12" fill="#EB001B" />
                  <circle cx="29" cy="15" r="12" fill="#F79E1B" />
                  <path d="M24 7.1c2.4 1.9 4 4.8 4 7.9s-1.6 6-4 7.9C21.6 21 20 18.1 20 15s1.6-6 4-7.9z" fill="#FF5F00" />
                </svg>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">Card Holder</p>
                <p className="text-sm font-semibold">Alex Carter</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-400 mb-0.5">Expires</p>
                <p className="text-sm font-semibold">12/27</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" className="btn-secondary text-sm flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Update Card
            </button>
            <button type="button" className="btn-secondary text-sm flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Payment Method
            </button>
          </div>

          <div className="bg-brand-white-soft border border-brand-gray rounded-xl p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-sm text-brand-black">
                Your payment info is secured by <strong>Stripe</strong>. We never store card details on our servers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
