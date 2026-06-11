import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { ok, err, noContent, handleError } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  role:     z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER', 'GUEST']).optional(),
  planType: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin(request);
    const { id } = await ctx.params;
    const data = updateSchema.parse(await request.json());

    const user = await prisma.user.update({ where: { id }, data });
    return ok({ id: user.id, email: user.email, role: user.role, planType: user.planType, isActive: user.isActive });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await ctx.params;
    if (id === admin.sub) return err('Cannot delete your own account', 400);
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return noContent();
  } catch (e) {
    return handleError(e);
  }
}
