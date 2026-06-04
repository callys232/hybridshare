'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PricingCard } from './PricingCard';
import type { PlanDef } from './PricingCard';

// ─── Plan data ────────────────────────────────────────────────────────────────

const PLANS: PlanDef[] = [
  {
    type:         'FREE',
    name:         'Free',
    tagline:      'View and explore files shared with you.',
    monthlyPrice: 0,
    yearlyPrice:  0,
    storage:      '5 GB local',
    members:      '1 user',
    cta:          'Get started free',
    ctaHref:      '/register',
    highlight:    false,
    enterprise:   false,
    accentColor:  '#3B82F6',
    features: ['Browse files shared with you', 'Basic search', 'Email notifications'],
    missing:  ['Upload files', 'Create workspaces', 'Connectors', 'Share links'],
    cloud:    { gb: 50,    price: 5  },
  },
  {
    type:         'STARTER',
    name:         'Starter',
    tagline:      'Everything a growing team needs.',
    monthlyPrice: 29,
    yearlyPrice:  19,
    storage:      '50 GB local',
    members:      'Up to 5',
    cta:          'Start free trial',
    ctaHref:      '/register?plan=starter',
    highlight:    true,
    enterprise:   false,
    accentColor:  '#10B981',
    features: ['Upload & manage files', 'Create workspaces', 'Share links with analytics', 'Cloud connectors', 'Basic analytics dashboard'],
    missing:  ['Password-protected links', 'Database connectors', 'API access'],
    cloud:    { gb: 500,   price: 10 },
  },
  {
    type:         'PROFESSIONAL',
    name:         'Professional',
    tagline:      'Advanced controls for power teams.',
    monthlyPrice: 79,
    yearlyPrice:  59,
    storage:      '500 GB local',
    members:      'Up to 20',
    cta:          'Start free trial',
    ctaHref:      '/register?plan=professional',
    highlight:    false,
    enterprise:   false,
    accentColor:  '#8B5CF6',
    features: ['Everything in Starter', 'Password-protected share links', 'Database connectors', 'Full audit logs', 'REST API access', 'IP allowlisting'],
    missing:  ['Custom domain', 'SAML / SSO', 'SCIM provisioning'],
    cloud:    { gb: 2048,  price: 25 },
  },
  {
    type:         'ENTERPRISE',
    name:         'Enterprise',
    tagline:      'Unlimited scale, SSO & white-label.',
    monthlyPrice: null,
    yearlyPrice:  null,
    storage:      'Unlimited local',
    members:      'Unlimited',
    cta:          'Contact sales',
    ctaHref:      'mailto:sales@hybridshare.io',
    highlight:    false,
    enterprise:   true,
    accentColor:  '#EF4444',
    features: ['Everything in Professional', 'SAML 2.0 / SSO', 'SCIM auto-provisioning', 'Custom domain + white-label', 'Dedicated infrastructure', 'Tailored SLA'],
    missing:  [],
    cloud:    { gb: 10240, price: 50 },
  },
];

// ─── Vector background ────────────────────────────────────────────────────────

function VectorBackground() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 w-full h-full"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* Diagonal line pattern */}
        <pattern id="pricing-lines" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <line x1="0" y1="40" x2="40" y2="0" stroke="#e5e7eb" strokeWidth="0.8" />
        </pattern>
        {/* Subtle dot grid overlay */}
        <pattern id="pricing-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="0.8" fill="#d1d5db" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pricing-lines)" />
      <rect width="100%" height="100%" fill="url(#pricing-dots)" opacity="0.5" />
      {/* Accent gradient blobs */}
      <ellipse cx="15%" cy="20%" rx="300" ry="200" fill="#3B82F608" />
      <ellipse cx="85%" cy="80%" rx="280" ry="180" fill="#8B5CF608" />
    </svg>
  );
}

// ─── Cloud add-on details ─────────────────────────────────────────────────────

function CloudAddonRow({ plan }: { plan: PlanDef }) {
  // Set --accent as a CSS custom property so child text/stroke can reference it
  // without adding inline styles to every element.
  const css = { '--accent': plan.accentColor } as React.CSSProperties;
  return (
    <div
      className="bg-white rounded-xl border border-blue-100 p-4 text-center shadow-sm hover:shadow-md transition-shadow"
      style={css}
    >
      <p className="text-xs font-bold uppercase tracking-widest mb-1 [color:var(--accent)]">
        {plan.name}
      </p>
      <p className="text-2xl font-black text-brand-black">
        ${plan.cloud.price}<span className="text-xs font-normal text-brand-gray-dark">/mo</span>
      </p>
      <p className="text-xs font-semibold mt-1 [color:var(--accent)]">
        {plan.cloud.gb >= 1024 ? `${plan.cloud.gb / 1024} TB` : `${plan.cloud.gb} GB`}
      </p>
      <ul className="mt-3 space-y-1 text-left">
        {['S3 / R2 storage', 'CDN delivery', 'Auto-sync'].map((f) => (
          <li key={f} className="flex items-center gap-1.5 text-[11px] text-brand-gray-dark">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke={plan.accentColor} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
        {plan.type === 'ENTERPRISE' && (
          <li className="flex items-center gap-1.5 text-[11px] text-brand-gray-dark">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke={plan.accentColor} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            Cross-region backup
          </li>
        )}
      </ul>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [showCloud, setShowCloud] = useState(false);

  return (
    <section id="pricing" className="relative py-24 bg-white overflow-hidden">
      <VectorBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-brand-red uppercase tracking-widest">Pricing</span>
          <h2 className="text-3xl sm:text-4xl font-black text-brand-black mt-2 mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-brand-gray-dark text-lg max-w-xl mx-auto">
            Start free. Upgrade when you need to. Add cloud storage to any plan.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 mt-6 bg-brand-gray/40 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150',
                billing === 'monthly' ? 'bg-white shadow text-brand-black' : 'text-brand-gray-dark hover:text-brand-black')}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling('yearly')}
              className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-2',
                billing === 'yearly' ? 'bg-white shadow text-brand-black' : 'text-brand-gray-dark hover:text-brand-black')}
            >
              Yearly
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">Save 30%</span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {PLANS.map((plan) => (
            <PricingCard key={plan.type} plan={plan} billing={billing} />
          ))}
        </div>

        {/* Cloud add-on callout */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 p-6 mb-8 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-brand-black">Cloud Storage Add-on — available on every plan</p>
              <p className="text-sm text-brand-gray-dark mt-0.5">
                Add geo-distributed cloud storage (S3 / R2) to any tier. Files sync automatically with CDN delivery.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCloud((v) => !v)}
              className="text-sm font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap underline underline-offset-2"
            >
              {showCloud ? 'Hide pricing' : 'See add-on pricing'}
            </button>
          </div>

          {showCloud && (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PLANS.map((plan) => <CloudAddonRow key={plan.type} plan={plan} />)}
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-brand-gray-dark">
          All paid plans include a <span className="font-semibold text-brand-black">14-day free trial</span> — no credit card required.{' '}
          <Link href="/privacy" className="text-brand-red hover:underline">Privacy policy</Link>
        </p>
      </div>
    </section>
  );
}
