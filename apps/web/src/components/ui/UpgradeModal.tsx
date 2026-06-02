'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { usePlan, PLAN_LABELS, PLAN_PRICES, type FeatureKey } from '@/hooks/usePlan';
import type { PlanType } from '@hybridshare/shared/types/user';

const PLAN_HIGHLIGHTS: Record<PlanType, string[]> = {
  FREE:         ['View shared files', 'Read-only workspace access', 'Basic notifications'],
  STARTER:      ['Upload & manage files', 'Create workspaces', 'Share links', 'Cloud connectors', '50 GB storage'],
  PROFESSIONAL: ['Everything in Starter', 'Password-protected links', 'Audit logs & reports', 'REST API access', '500 GB storage'],
  ENTERPRISE:   ['Everything in Professional', 'SAML / SSO', 'SCIM provisioning', 'Custom domain', 'Unlimited storage'],
};

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function LockShieldIcon() {
  return (
    <svg className="w-8 h-8 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  /** If provided, shows which feature triggered the modal */
  feature?: FeatureKey;
  /** Override the suggested upgrade plan (defaults to next tier) */
  suggestedPlan?: PlanType;
}

export function UpgradeModal({ open, onClose, feature, suggestedPlan }: UpgradeModalProps) {
  const router = useRouter();
  const { planType, minPlanForFeature } = usePlan();
  const backdropRef = useRef<HTMLDivElement>(null);

  // Determine which plan to highlight
  const targetPlan: PlanType = suggestedPlan ?? (feature ? minPlanForFeature(feature) : 'STARTER');

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const goUpgrade = () => {
    onClose();
    router.push(targetPlan === 'ENTERPRISE'
      ? '/settings/billing?contact=enterprise'
      : `/upgrade?highlight=${targetPlan}`);
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150" />

      {/* Panel */}
      <div className="relative bg-white dark:bg-dark-surface-1 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-200">

        {/* Header band */}
        <div className="relative bg-gradient-to-br from-brand-black to-zinc-800 px-6 py-6 text-white overflow-hidden">
          {/* Decorative rings */}
          <svg className="absolute -right-8 -top-8 w-32 h-32 opacity-10" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="1" />
            <circle cx="50" cy="50" r="28" stroke="white" strokeWidth="1" />
            <circle cx="50" cy="50" r="16" stroke="white" strokeWidth="1" />
          </svg>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-red/20 border border-brand-red/30 flex items-center justify-center">
              <LockShieldIcon />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50">
                {PLAN_LABELS[planType]} plan
              </p>
              <h2 className="text-lg font-black">Upgrade to unlock this</h2>
            </div>
          </div>

          {feature && (
            <p className="text-xs text-white/60 mt-1">
              This feature requires the{' '}
              <strong className="text-white">{PLAN_LABELS[targetPlan]}</strong> plan or higher.
            </p>
          )}
        </div>

        {/* Plan options */}
        <div className="p-5 space-y-3">
          {(['STARTER', 'PROFESSIONAL', 'ENTERPRISE'] as PlanType[]).map((plan) => {
            const isTarget = plan === targetPlan;
            const isCurrent = plan === planType;
            const price = PLAN_PRICES[plan].yearly;

            return (
              <div
                key={plan}
                className={cn(
                  'rounded-xl border p-4 transition-all duration-150',
                  isTarget
                    ? 'border-brand-red bg-brand-red/5 ring-1 ring-brand-red/20'
                    : 'border-brand-gray dark:border-dark-border'
                )}
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-brand-black dark:text-white">{PLAN_LABELS[plan]}</p>
                      {isTarget && (
                        <span className="text-[10px] font-bold bg-brand-red text-white px-1.5 py-0.5 rounded-full">Recommended</span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-bold bg-brand-gray text-brand-gray-dark px-1.5 py-0.5 rounded-full">Current</span>
                      )}
                    </div>
                    <p className="text-xs text-brand-gray-dark mt-0.5">
                      {plan === 'ENTERPRISE' ? 'Custom pricing' : `$${price}/mo · billed yearly`}
                    </p>
                  </div>
                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={goUpgrade}
                      className={cn(
                        'text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-95 flex-shrink-0',
                        isTarget
                          ? 'bg-brand-red text-white hover:bg-red-700'
                          : 'bg-brand-black dark:bg-white text-white dark:text-brand-black hover:opacity-80'
                      )}
                    >
                      {plan === 'ENTERPRISE' ? 'Contact sales' : 'Select'}
                    </button>
                  )}
                </div>

                <ul className="space-y-1">
                  {PLAN_HIGHLIGHTS[plan].slice(0, 4).map((item) => (
                    <li key={item} className="flex items-center gap-1.5 text-xs text-brand-gray-dark dark:text-zinc-400">
                      <CheckIcon />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-brand-gray-dark hover:text-brand-black dark:hover:text-white font-medium transition-colors duration-150"
          >
            Maybe later
          </button>
          <button
            type="button"
            onClick={() => { onClose(); router.push('/upgrade'); }}
            className="text-xs font-bold text-brand-red hover:underline transition-colors duration-150 flex items-center gap-1"
          >
            View full comparison
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
