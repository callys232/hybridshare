'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const PLANS = [
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
    features: ['Everything in Professional', 'SAML 2.0 / SSO', 'SCIM auto-provisioning', 'Custom domain + white-label', 'Dedicated infrastructure', 'Tailored SLA'],
    missing:  [],
    cloud:    { gb: 10240, price: 50 },
  },
] as const;

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-4 h-4 text-brand-gray dark:text-zinc-600 flex-shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  );
}

export function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [showCloudDetails, setShowCloudDetails] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
            <button type="button" onClick={() => setBilling('monthly')}
              className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150',
                billing === 'monthly' ? 'bg-white shadow text-brand-black' : 'text-brand-gray-dark hover:text-brand-black')}>
              Monthly
            </button>
            <button type="button" onClick={() => setBilling('yearly')}
              className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-2',
                billing === 'yearly' ? 'bg-white shadow text-brand-black' : 'text-brand-gray-dark hover:text-brand-black')}>
              Yearly
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">Save 30%</span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {PLANS.map((plan) => {
            const price = billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            return (
              <div key={plan.type}
                className={cn(
                  'relative flex flex-col rounded-2xl border p-5 transition-all duration-200 hover:shadow-lg',
                  plan.highlight
                    ? 'border-brand-red ring-1 ring-brand-red/20 shadow-md scale-[1.02] bg-white'
                    : plan.enterprise
                      ? 'border-zinc-800 bg-zinc-900 text-white'
                      : 'border-brand-gray bg-white'
                )}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-red text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    Most popular
                  </div>
                )}
                <p className={cn('text-xs font-bold uppercase tracking-widest mb-1', plan.enterprise ? 'text-zinc-400' : 'text-brand-gray-dark')}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1 mb-1">
                  {price === null ? (
                    <span className={cn('text-3xl font-black', plan.enterprise ? 'text-white' : 'text-brand-black')}>Custom</span>
                  ) : price === 0 ? (
                    <span className={cn('text-3xl font-black', plan.enterprise ? 'text-white' : 'text-brand-black')}>Free</span>
                  ) : (
                    <>
                      <span className={cn('text-3xl font-black', plan.enterprise ? 'text-white' : 'text-brand-black')}>${price}</span>
                      <span className={cn('text-xs', plan.enterprise ? 'text-zinc-400' : 'text-brand-gray-dark')}>/mo</span>
                    </>
                  )}
                </div>
                <p className={cn('text-xs mb-4 leading-relaxed', plan.enterprise ? 'text-zinc-400' : 'text-brand-gray-dark')}>
                  {plan.tagline}
                </p>
                <div className={cn('text-xs space-y-1 mb-4 py-3 border-t border-b flex-1', plan.enterprise ? 'border-zinc-700' : 'border-brand-gray')}>
                  <div className="flex justify-between">
                    <span className={plan.enterprise ? 'text-zinc-400' : 'text-brand-gray-dark'}>Storage</span>
                    <span className={cn('font-semibold', plan.enterprise ? 'text-white' : 'text-brand-black')}>{plan.storage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={plan.enterprise ? 'text-zinc-400' : 'text-brand-gray-dark'}>Members</span>
                    <span className={cn('font-semibold', plan.enterprise ? 'text-white' : 'text-brand-black')}>{plan.members}</span>
                  </div>
                </div>
                <ul className="space-y-1.5 mb-5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className={cn('flex items-start gap-2 text-xs', plan.enterprise ? 'text-zinc-300' : 'text-brand-black')}>
                      <CheckIcon />{f}
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-brand-gray-dark">
                      <XIcon />{f}
                    </li>
                  ))}
                </ul>

                {/* Cloud add-on badge */}
                <div className={cn(
                  'flex items-center gap-1.5 text-[11px] font-medium rounded-lg px-2.5 py-1.5 mb-3',
                  plan.enterprise ? 'bg-zinc-800 text-zinc-300' : 'bg-blue-50 text-blue-700'
                )}>
                  <CloudIcon />
                  +${plan.cloud.price}/mo → {plan.cloud.gb >= 1024 ? `${plan.cloud.gb / 1024} TB` : `${plan.cloud.gb} GB`} cloud
                </div>

                <Link href={plan.ctaHref}
                  className={cn(
                    'w-full text-center py-2.5 rounded-xl text-sm font-bold transition-all duration-150 active:scale-[0.98]',
                    plan.highlight
                      ? 'bg-brand-red text-white hover:bg-red-700'
                      : plan.enterprise
                        ? 'bg-white text-zinc-900 hover:bg-zinc-100'
                        : 'bg-brand-black text-white hover:opacity-80'
                  )}>
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Cloud Storage Add-on callout */}
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-brand-black">Cloud Storage Add-on — available on every plan</p>
              <p className="text-sm text-brand-gray-dark mt-0.5">
                Add redundant, geo-distributed cloud storage (S3 / Cloudflare R2) to any tier.
                Files sync automatically between local and cloud with CDN delivery.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCloudDetails((v) => !v)}
              className="text-sm font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap underline underline-offset-2"
            >
              {showCloudDetails ? 'Hide details' : 'See add-on pricing'}
            </button>
          </div>

          {showCloudDetails && (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
              {PLANS.map((plan) => (
                <div key={plan.type} className="bg-white rounded-xl border border-blue-100 p-4 text-center">
                  <p className="text-xs font-bold text-brand-gray-dark uppercase tracking-widest mb-1">{plan.name}</p>
                  <p className="text-2xl font-black text-brand-black">${plan.cloud.price}<span className="text-xs font-normal text-brand-gray-dark">/mo</span></p>
                  <p className="text-xs text-blue-700 font-semibold mt-1">
                    {plan.cloud.gb >= 1024 ? `${plan.cloud.gb / 1024} TB` : `${plan.cloud.gb} GB`}
                  </p>
                  <ul className="mt-3 space-y-1 text-left">
                    {['S3 / R2 storage', 'CDN delivery', 'Auto-sync'].map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-[11px] text-brand-gray-dark">
                        <svg className="w-3 h-3 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                    {plan.type === 'ENTERPRISE' && (
                      <li className="flex items-center gap-1.5 text-[11px] text-brand-gray-dark">
                        <svg className="w-3 h-3 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        Cross-region backup
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-sm text-brand-gray-dark">
          All paid plans include a <span className="font-semibold text-brand-black">14-day free trial</span> — no credit card required to start.{' '}
          <Link href="/privacy" className="text-brand-red hover:underline">Privacy policy</Link>
        </p>
      </div>
    </section>
  );
}
