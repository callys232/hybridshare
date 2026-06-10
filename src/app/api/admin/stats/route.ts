import { NextRequest } from 'next/server';
import { ok } from '@/lib/api-helpers';
import { MOCK_ADMIN_STATS } from '@/mocks';

export async function GET(_request: NextRequest) {
  return ok(MOCK_ADMIN_STATS);
}
