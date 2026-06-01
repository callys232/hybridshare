'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePlan, PLAN_LABELS, PLAN_PRICES } from '@/hooks/usePlan';
import type { PlanType } from '@hybridshare/shared/types/user';

// ── Animated SVG background ───────────────────────────────────────────────────
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g1" cx="20%" cy="20%" r="50%">
            <stop offset="0%" stopColor="#c12129" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#c12129" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="g2" cx="80%" cy="70%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g1)" />
        <rect width="100%" height="100%" fill="url(#g2)" />

        {/* Floating circles */}
        <circle cx="10%" cy="15%" r="180" fill="none" stroke="#c12129" strokeWidth="0.5" strokeOpacity="0.08">
          <animateTransform attributeName="transform" type="translate" values="0,0;20,30;0,0" dur="18s" repeatCount="indefinite" />
        </circle>
        <circle cx="88%" cy="80%" r="220" fill="none" stroke="#3b82f6" strokeWidth="0.5" strokeOpacity="0.07">
          <animateTransform attributeName="transform" type="translate" values="0,0;-25,-20;0,0" dur="22s" repeatCount="indefinite" />
        </circle>
        <circle cx="55%" cy="5%" r="100" fill="none" stroke="#8b5cf6" strokeWidth="0.4" strokeOpacity="0.06">
          <animateTransform attributeName="transform" type="translate" values="0,0;15,-10;0,0" dur="14s" repeatCount="indefinite" />
        </circle>

        {/* Grid dots */}
        {Array.from({ length: 12 }, (_, col) =>
          Array.from({ length: 8 }, (_, row) => (
            <circle
              key={`${col}-${row}`}
              cx={`${(col + 0.5) * (100 / 12)}%`}
              cy={`${(row + 0.5) * (100 / 8)}%`}
              r="1.2"
              fill="#111"
              fillOpacity="0.04"
            />
          ))
        )}

        {/* Moving line */}
        <line x1="0" y1="40%" x2="100%" y2="60%" stroke="#c12129" strokeWidth="0.5" strokeOpacity="0.05" strokeDasharray="6 12">
          <animateTransform attributeName="transform" type="translate" values="0,0;0,40;0,0" dur="25s" repeatCount="indefinite" />
        </line>
        <line x1="0" y1="70%" x2="100%" y2="30%" stroke="#3b82f6" strokeWidth="0.5" strokeOpacity="0.04" strokeDasharray="4 16">
          <animateTransform attributeName="transform" type="translate" values="0,0;0,-30;0,0" dur="20s" repeatCount="indefinite" />
        </line>

        {/* Rotating polygon */}
        <polygon points="85%,10 calc(85% + 40),50 85%,90 calc(85% - 40),50"
          fill="none" stroke="#10b981" strokeWidth="0.6" strokeOpacity="0.07"
          transform="translate(0,0)">
          <animateTransform attributeName="transform" type="rotate" values="0 85% 50;360 85% 50" dur="40s" repeatCount="indefinite" />
        </polygon>
      </svg>
    </div>
  );
}

// ── Services showcase ─────────────────────────────────────────────────────────
const SERVICES = [
  {
    label: 'File Storage',
    description: 'Upload, organise and version-control every file with enterprise-grade reliability.',
    color: '#3b82f6',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    iconBg: 'bg-blue-500',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Workspaces',
    description: 'Team, project and department workspaces with fine-grained member permissions.',
    color: '#8b5cf6',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800',
    iconBg: 'bg-violet-500',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    label: 'Connectors',
    description: 'Sync data from Google Drive, OneDrive, Dropbox, databases and REST APIs.',
    color: '#10b981',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-500',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    label: 'Secure Sharing',
    description: 'Password-protected links, expiry dates, download limits and view analytics.',
    color: '#f59e0b',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-500',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
  },
  {
    label: 'Security & Compliance',
    description: 'Audit logs, 2FA, ACL, data classification and role-based access control.',
    color: '#ef4444',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    iconBg: 'bg-red-500',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    description: 'Storage usage, access reports, share analytics and activity dashboards.',
    color: '#6366f1',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    border: 'border-indigo-200 dark:border-indigo-800',
    iconBg: 'bg-indigo-500',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'API & Developer Tools',
    description: 'Full REST API, webhooks and SDKs to build on top of your file infrastructure.',
    color: '#14b8a6',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    border: 'border-teal-200 dark:border-teal-800',
    iconBg: 'bg-teal-500',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    label: 'Enterprise SSO',
    description: 'SAML 2.0, SCIM provisioning, custom domain and white-label branding.',
    color: '#111111',
    bg: 'bg-zinc-50 dark:bg-zinc-900',
    border: 'border-zinc-200 dark:border-zinc-700',
    iconBg: 'bg-zinc-900 dark:bg-white',
    icon: (
      <svg className="w-5 h-5 text-white dark:text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
] as const;

// ── Plan feature matrix ───────────────────────────────────────────────────────
const PLAN_FEATURES_MATRIX: Array<{ label: string; free: boolean; starter: boolean; pro: boolean; enterprise: boolean }> = [
  { label: 'Upload & manage files',   free: true,  starter: true,  pro: true,  enterprise: true },
  { label: 'Storage quota',           free: false, starter: true,  pro: true,  enterprise: true },
  { label: 'Workspaces',              free: false, starter: true,  pro: true,  enterprise: true },
  { label: 'Share links',             free: false, starter: true,  pro: true,  enterprise: true },
  { label: 'Cloud connectors',        free: false, starter: true,  pro: true,  enterprise: true },
  { label: 'Password-protected links',free: false, starter: false, pro: true,  enterprise: true },
  { label: 'Database connectors',     free: false, starter: false, pro: true,  enterprise: true },
  { label: 'Audit logs',              free: false, starter: false, pro: true,  enterprise: true },
  { label: 'Export reports',          free: false, starter: false, pro: true,  enterprise: true },
  { label: 'REST API access',         free: false, starter: false, pro: true,  enterprise: true },
  { label: 'Custom domain',           free: false, starter: false, pro: false, enterprise: true },
  { label: 'SAML / SSO',             free: false, starter: false, pro: false, enterprise: true },
  { label: 'SCIM provisioning',       free: false, starter: false, pro: false, enterprise: true },
  { label: 'White-label branding',    free: false, starter: false, pro: false, enterprise: true },
];

// ── Plan card ─────────────────────────────────────────────────────────────────
const PLAN_DETAILS: Record<PlanType, {
  description: string;
  storage: string;
  members: string;
  highlight?: string;
}> = {
  FREE:         { description: 'Read-only access. View and explore files shared with you.',          storage: 'View only',    members: '1 user' },
  STARTER:      { description: 'Everything a growing team needs to manage and share files.',          storage: '50 GB',        members: 'Up to 5',    highlight: 'Most popular' },
  PROFESSIONAL: { description: 'Advanced controls, API access and compliance tools for power users.', storage: '500 GB',       members: 'Up to 20' },
  ENTERPRISE:   { description: 'Unlimited scale, SSO, white-label and dedicated support.',            storage: 'Unlimited',    members: 'Unlimited',  highlight: 'Best value' },
};

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg className="w-4 h-4 text-brand-gray-dark flex-shrink-0 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UpgradePage() {
  const router = useRouter();
  const { planType, isPaid } = usePlan();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');

  const handleUpgrade = (plan: PlanType) => {
    if (plan === 'ENTERPRISE') {
      router.push('/settings/billing?contact=enterprise');
    } else {
      router.push(`/settings/billing?plan=${plan}&billing=${billing}`);
    }
  };

  return (
    <div className="relative min-h-full pb-20">
      <AnimatedBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-10">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-red uppercase tracking-widest mb-3 px-3 py-1 rounded-full bg-brand-red/10">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Unlock the full platform
          </span>
          <h1 className="text-4xl font-black text-brand-black dark:text-white tracking-tight mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-base text-brand-gray-dark max-w-xl mx-auto">
            Start free, upgrade when you need to. Every paid plan includes all core features — no surprise add-ons.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 mt-6 bg-brand-gray/40 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150',
                billing === 'monthly' ? 'bg-white dark:bg-dark-surface-2 shadow text-brand-black' : 'text-brand-gray-dark hover:text-brand-black'
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling('yearly')}
              className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-2',
                billing === 'yearly' ? 'bg-white dark:bg-dark-surface-2 shadow text-brand-black' : 'text-brand-gray-dark hover:text-brand-black'
              )}
            >
              Yearly
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">Save 30%</span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'] as PlanType[]).map((plan) => {
            const isCurrent = planType === plan;
            const price = billing === 'yearly' ? PLAN_PRICES[plan].yearly : PLAN_PRICES[plan].monthly;
            const detail = PLAN_DETAILS[plan];
            const isPopular = detail.highlight === 'Most popular';
            const isBest = detail.highlight === 'Best value';

            return (
              <div
                key={plan}
                className={cn(
                  'relative flex flex-col rounded-2xl border p-5 transition-all duration-200 hover:shadow-lg',
                  isPopular
                    ? 'border-brand-red bg-white dark:bg-dark-surface-1 shadow-md ring-1 ring-brand-red/20 scale-[1.02]'
                    : plan === 'ENTERPRISE'
                      ? 'border-zinc-800 bg-zinc-900 text-white'
                      : 'border-brand-gray bg-white dark:bg-dark-surface-1',
                  isCurrent && !isPopular && 'ring-2 ring-brand-black dark:ring-white/40'
                )}
              >
                {detail.highlight && (
                  <div className={cn(
                    'absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full',
                    isPopular ? 'bg-brand-red text-white' : 'bg-zinc-800 text-white'
                  )}>
                    {detail.highlight}
                  </div>
                )}

                <div className="mb-4">
                  <p className={cn('text-xs font-bold uppercase tracking-widest mb-1',
                    plan === 'ENTERPRISE' ? 'text-zinc-400' : 'text-brand-gray-dark')}>
                    {PLAN_LABELS[plan]}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className={cn('text-3xl font-black', plan === 'ENTERPRISE' ? 'text-white' : 'text-brand-black dark:text-white')}>
                      {plan === 'ENTERPRISE' ? 'Custom' : price === 0 ? 'Free' : `$${price}`}
                    </span>
                    {price > 0 && (plan as string) !== 'ENTERPRISE' && (
                      <span className={cn('text-xs', plan === 'ENTERPRISE' ? 'text-zinc-400' : 'text-brand-gray-dark')}>
                        /mo{billing === 'yearly' ? ', billed yearly' : ''}
                      </span>
                    )}
                  </div>
                  <p className={cn('text-xs mt-2 leading-relaxed', plan === 'ENTERPRISE' ? 'text-zinc-400' : 'text-brand-gray-dark')}>
                    {detail.description}
                  </p>
                </div>

                <div className={cn('text-xs space-y-1.5 mb-5 py-4 border-t border-b flex-1',
                  plan === 'ENTERPRISE' ? 'border-zinc-700' : 'border-brand-gray dark:border-dark-border')}>
                  <div className="flex justify-between">
                    <span className={plan === 'ENTERPRISE' ? 'text-zinc-400' : 'text-brand-gray-dark'}>Storage</span>
                    <span className={cn('font-semibold', plan === 'ENTERPRISE' ? 'text-white' : 'text-brand-black dark:text-white')}>{detail.storage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={plan === 'ENTERPRISE' ? 'text-zinc-400' : 'text-brand-gray-dark'}>Members</span>
                    <span className={cn('font-semibold', plan === 'ENTERPRISE' ? 'text-white' : 'text-brand-black dark:text-white')}>{detail.members}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => !isCurrent && handleUpgrade(plan)}
                  disabled={isCurrent}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-default',
                    isPopular
                      ? 'bg-brand-red text-white hover:bg-red-700'
                      : plan === 'ENTERPRISE'
                        ? 'bg-white text-zinc-900 hover:bg-zinc-100'
                        : isCurrent
                          ? 'bg-brand-gray/50 text-brand-gray-dark'
                          : 'bg-brand-black dark:bg-white text-white dark:text-brand-black hover:opacity-90'
                  )}
                >
                  {isCurrent ? 'Current plan' : plan === 'FREE' ? 'Downgrade' : plan === 'ENTERPRISE' ? 'Contact sales' : 'Upgrade now'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Service cards grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-brand-black dark:text-white text-center mb-2">Everything included</h2>
          <p className="text-sm text-brand-gray-dark text-center mb-8">Every paid plan gives you access to these powerful capabilities.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICES.map((svc) => (
              <div
                key={svc.label}
                className={cn(
                  'group relative rounded-2xl border p-5 transition-all duration-200',
                  'hover:shadow-md hover:-translate-y-0.5',
                  svc.bg, svc.border
                )}
              >
                {/* Animated corner accent */}
                <div
                  className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 transition-opacity duration-200 group-hover:opacity-20"
                  style={{ backgroundColor: svc.color }}
                />

                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3 shadow-sm', svc.iconBg)}>
                  {svc.icon}
                </div>
                <h3 className="text-sm font-bold text-brand-black dark:text-white mb-1">{svc.label}</h3>
                <p className="text-xs text-brand-gray-dark leading-relaxed">{svc.description}</p>

                {/* Hover shimmer line */}
                <div
                  className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full rounded-b-2xl transition-all duration-300"
                  style={{ backgroundColor: svc.color }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Feature matrix */}
        <div className="card overflow-hidden mb-16">
          <div className="px-5 py-4 border-b border-brand-gray dark:border-dark-border">
            <h2 className="text-base font-bold text-brand-black dark:text-white">Full feature comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-gray dark:border-dark-border">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray-dark w-1/2">Feature</th>
                  {(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'] as PlanType[]).map((p) => (
                    <th key={p} className="text-center px-3 py-3 text-xs font-bold text-brand-black dark:text-white">
                      {PLAN_LABELS[p]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLAN_FEATURES_MATRIX.map((row, i) => (
                  <tr key={row.label} className={cn('border-b border-brand-gray/50 dark:border-dark-border/50 last:border-0',
                    i % 2 === 0 ? 'bg-transparent' : 'bg-brand-gray/20 dark:bg-dark-surface-2/30')}>
                    <td className="px-5 py-2.5 text-xs text-brand-black dark:text-white">{row.label}</td>
                    <td className="text-center px-3 py-2.5">{row.free ? <CheckIcon /> : <XIcon />}</td>
                    <td className="text-center px-3 py-2.5">{row.starter ? <CheckIcon /> : <XIcon />}</td>
                    <td className="text-center px-3 py-2.5">{row.pro ? <CheckIcon /> : <XIcon />}</td>
                    <td className="text-center px-3 py-2.5">{row.enterprise ? <CheckIcon /> : <XIcon />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="relative overflow-hidden rounded-2xl bg-zinc-900 p-8 text-white text-center mb-8">
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            <svg className="absolute w-full h-full opacity-10" viewBox="0 0 400 200" fill="none">
              <circle cx="50" cy="100" r="80" stroke="white" strokeWidth="0.5" />
              <circle cx="350" cy="100" r="80" stroke="white" strokeWidth="0.5" />
              <circle cx="200" cy="200" r="120" stroke="white" strokeWidth="0.5" />
            </svg>
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3 px-3 py-1 rounded-full border border-zinc-700">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Enterprise
            </div>
            <h2 className="text-2xl font-black mb-2">Need unlimited scale?</h2>
            <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
              Custom storage, SSO, dedicated infrastructure and a tailored SLA. Let&apos;s build your plan together.
            </p>
            <button
              type="button"
              onClick={() => router.push('/settings/billing?contact=enterprise')}
              className="inline-flex items-center gap-2 bg-white text-zinc-900 font-bold px-6 py-3 rounded-xl hover:bg-zinc-100 active:scale-95 transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Talk to sales
            </button>
          </div>
        </div>

        {/* FAQ teaser */}
        <p className="text-center text-xs text-brand-gray-dark">
          Questions?{' '}
          <Link href="/settings/billing" className="text-brand-red font-semibold hover:underline">
            Manage your subscription
          </Link>{' '}
          or{' '}
          <a href="mailto:billing@hybridshare.io" className="text-brand-red font-semibold hover:underline">
            contact billing support
          </a>
        </p>
      </div>
    </div>
  );
}
