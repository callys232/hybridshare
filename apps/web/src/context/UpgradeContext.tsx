'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { UpgradeModal } from '@/component/ui/UpgradeModal';
import type { FeatureKey } from '@/hooks/usePlan';
import type { PlanType } from '@hybridshare/shared/types/user';

interface UpgradeContextValue {
  /** Open the upgrade modal, optionally scoped to a specific feature or plan */
  openUpgrade: (opts?: { feature?: FeatureKey; plan?: PlanType }) => void;
  closeUpgrade: () => void;
}

const UpgradeContext = createContext<UpgradeContextValue>({
  openUpgrade: () => {},
  closeUpgrade: () => {},
});

export function UpgradeProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [feature, setFeature] = useState<FeatureKey | undefined>();
  const [plan, setPlan] = useState<PlanType | undefined>();

  const openUpgrade = useCallback((opts?: { feature?: FeatureKey; plan?: PlanType }) => {
    setFeature(opts?.feature);
    setPlan(opts?.plan);
    setOpen(true);
  }, []);

  const closeUpgrade = useCallback(() => {
    setOpen(false);
    setFeature(undefined);
    setPlan(undefined);
  }, []);

  return (
    <UpgradeContext.Provider value={{ openUpgrade, closeUpgrade }}>
      {children}
      <UpgradeModal
        open={open}
        onClose={closeUpgrade}
        feature={feature}
        suggestedPlan={plan}
      />
    </UpgradeContext.Provider>
  );
}

export function useUpgrade(): UpgradeContextValue {
  return useContext(UpgradeContext);
}
