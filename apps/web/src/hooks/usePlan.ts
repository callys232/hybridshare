import { useAuthStore } from '@/store/auth.store';
import type { PlanType } from '@hybridshare/shared/types/user';

// ── Feature → minimum plan required ──────────────────────────────────────────

export const PLAN_FEATURES = {
  // File actions
  upload_file:          ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
  create_folder:        ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
  delete_file:          ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
  restore_file:         ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
  move_copy_file:       ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
  bulk_operations:      ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
  // Sharing
  share_internal:       ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
  share_external_link:  ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
  password_protected_share: ['PROFESSIONAL', 'ENTERPRISE'],
  // Workspaces
  create_workspace:     ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
  invite_members:       ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
  manage_permissions:   ['PROFESSIONAL', 'ENTERPRISE'],
  // Connectors
  connect_cloud:        ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
  connect_database:     ['PROFESSIONAL', 'ENTERPRISE'],
  // Analytics & reporting
  view_analytics:       ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
  export_reports:       ['PROFESSIONAL', 'ENTERPRISE'],
  audit_logs:           ['PROFESSIONAL', 'ENTERPRISE'],
  // Advanced
  api_access:           ['PROFESSIONAL', 'ENTERPRISE'],
  custom_domain:        ['ENTERPRISE'],
  sso_saml:             ['ENTERPRISE'],
  white_label:          ['ENTERPRISE'],
} as const;

export type FeatureKey = keyof typeof PLAN_FEATURES;

const PLAN_ORDER: PlanType[] = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];

export const PLAN_LABELS: Record<PlanType, string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
};

export const PLAN_PRICES: Record<PlanType, { monthly: number; yearly: number }> = {
  FREE:         { monthly: 0,   yearly: 0 },
  STARTER:      { monthly: 29,  yearly: 19 },
  PROFESSIONAL: { monthly: 79,  yearly: 59 },
  ENTERPRISE:   { monthly: 299, yearly: 229 },
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePlan() {
  const { user } = useAuthStore();

  const role = user?.role ?? 'GUEST';
  const planType: PlanType = user?.planType ?? 'FREE';
  const subscriptionStatus = user?.subscriptionStatus ?? null;

  // Admins bypass all plan checks
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

  // Managers also get full access
  const isManager = role === 'MANAGER';

  // Paid = admin, manager, OR has active/trialing non-free plan
  // If the API hasn't returned planType yet (undefined), treat any logged-in
  // MEMBER as STARTER so they can work during development / before full schema migration.
  const effectivePlan: PlanType = user?.planType ??
    (role === 'MEMBER' || role === 'MANAGER' ? 'STARTER' : 'FREE');

  const isPaid = isAdmin || isManager || (
    effectivePlan !== 'FREE' &&
    (subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'TRIALING' || subscriptionStatus === null)
  );

  const planIndex = PLAN_ORDER.indexOf(effectivePlan);

  const meetsMinPlan = (min: PlanType): boolean => {
    if (isAdmin || isManager) return true;
    return PLAN_ORDER.indexOf(effectivePlan) >= PLAN_ORDER.indexOf(min);
  };

  const canUse = (feature: FeatureKey): boolean => {
    if (isAdmin || isManager) return true;
    const allowed = PLAN_FEATURES[feature] as readonly string[];
    return allowed.includes(effectivePlan) && isPaid;
  };

  const minPlanForFeature = (feature: FeatureKey): PlanType => {
    const allowed = PLAN_FEATURES[feature] as readonly string[];
    return (PLAN_ORDER.find((p) => allowed.includes(p)) ?? 'STARTER') as PlanType;
  };

  return {
    planType: effectivePlan,
    planLabel: PLAN_LABELS[effectivePlan],
    planIndex,
    subscriptionStatus,
    isAdmin,
    isManager,
    isPaid,
    isViewer: !isPaid && !isAdmin && !isManager,
    isFree: effectivePlan === 'FREE',
    isStarter: effectivePlan === 'STARTER',
    isProfessional: planType === 'PROFESSIONAL',
    isEnterprise: planType === 'ENTERPRISE',
    canUse,
    meetsMinPlan,
    minPlanForFeature,
  };
}
