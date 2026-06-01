'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { usePlan, type FeatureKey, PLAN_LABELS } from '@/hooks/usePlan';

// Lazy import to avoid circular deps — UpgradeContext imports UpgradeModal which imports usePlan
function useUpgradeModal() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useUpgrade } = require('@/context/UpgradeContext') as { useUpgrade: () => { openUpgrade: (opts?: { feature?: FeatureKey }) => void } };
    return useUpgrade();
  } catch {
    return { openUpgrade: () => {} };
  }
}

// ── Inline lock icon ──────────────────────────────────────────────────────────
function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

// ── Upgrade inline banner ─────────────────────────────────────────────────────
interface UpgradeBannerProps {
  feature: FeatureKey;
  compact?: boolean;
  className?: string;
}

export function UpgradeBanner({ feature, compact = false, className }: UpgradeBannerProps) {
  const { minPlanForFeature } = usePlan();
  const { openUpgrade } = useUpgradeModal();
  const min = minPlanForFeature(feature);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => openUpgrade({ feature })}
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-semibold text-brand-red',
          'hover:underline transition-colors duration-150',
          className
        )}
      >
        <LockIcon className="w-3 h-3" />
        Upgrade to {PLAN_LABELS[min]}
      </button>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl',
      'bg-gradient-to-r from-brand-red/5 to-brand-red/10',
      'border border-brand-red/20',
      className
    )}>
      <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center flex-shrink-0">
        <LockIcon className="w-4 h-4 text-brand-red" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-black dark:text-white">
          {PLAN_LABELS[min]} plan required
        </p>
        <p className="text-xs text-brand-gray-dark">
          Upgrade your plan to unlock this feature.
        </p>
      </div>
      <button
        type="button"
        onClick={() => openUpgrade({ feature })}
        className="flex-shrink-0 text-xs font-bold text-white bg-brand-red hover:bg-red-700 active:scale-95 px-3 py-1.5 rounded-lg transition-all duration-150"
      >
        Upgrade
      </button>
    </div>
  );
}

// ── PlanGate wrapper ──────────────────────────────────────────────────────────
interface PlanGateProps {
  feature: FeatureKey;
  /** Replace children with a lock overlay instead of a banner */
  mode?: 'banner' | 'overlay' | 'hidden';
  /** Custom fallback instead of the default upgrade UI */
  fallback?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function PlanGate({ feature, mode = 'banner', fallback, className, children }: PlanGateProps) {
  const { canUse } = usePlan();

  if (canUse(feature)) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  if (mode === 'hidden') return null;

  if (mode === 'overlay') {
    return (
      <div className={cn('relative', className)}>
        <div className="pointer-events-none select-none opacity-40 blur-[1px]">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-dark-bg/60 backdrop-blur-[2px] rounded-inherit">
          <UpgradeBanner feature={feature} />
        </div>
      </div>
    );
  }

  // Default: banner
  return <UpgradeBanner feature={feature} className={className} />;
}

// ── Locked action button wrapper ──────────────────────────────────────────────
interface LockedButtonProps {
  feature: FeatureKey;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function LockedButton({ feature, onClick, className, children }: LockedButtonProps) {
  const { canUse, minPlanForFeature } = usePlan();
  const { openUpgrade } = useUpgradeModal();
  const [pulse, setPulse] = useState(false);

  const handleClick = () => {
    if (!canUse(feature)) {
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
      openUpgrade({ feature });
      return;
    }
    onClick?.();
  };

  const locked = !canUse(feature);

  return (
    <div className="relative inline-flex" title={locked ? `Requires ${PLAN_LABELS[minPlanForFeature(feature)]} plan` : undefined}>
      <div
        onClick={handleClick}
        className={cn(
          'cursor-pointer',
          locked && 'opacity-60 pointer-events-auto',
          pulse && 'animate-pulse',
          className
        )}
      >
        {children}
      </div>
      {locked && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-red rounded-full flex items-center justify-center shadow-sm">
          <LockIcon className="w-2.5 h-2.5 text-white" />
        </span>
      )}
    </div>
  );
}
