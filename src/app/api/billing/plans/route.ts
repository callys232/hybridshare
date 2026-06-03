import { NextRequest } from 'next/server';
import { ok } from '@/lib/api-helpers';
import { PLANS, CLOUD_ADDONS } from '@/lib/stripe';

export async function GET(_request: NextRequest) {
  const plans = Object.values(PLANS).map((p) => ({
    ...p,
    storageQuota: p.storageQuota.toString(),
    cloudAddon: {
      ...CLOUD_ADDONS[p.type],
      storageQuota: CLOUD_ADDONS[p.type].storageQuota.toString(),
    },
  }));
  return ok(plans);
}
