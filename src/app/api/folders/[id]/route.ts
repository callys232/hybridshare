import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ok, err, noContent, handleError } from '@/lib/api-helpers';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    const { sub } = await requireAuth(request);
    const { id } = await ctx.params;
    const { name } = z.object({ name: z.string().min(1).max(255) }).parse(await request.json());

    const folder = await prisma.folder.findFirst({ where: { id, createdById: sub, isDeleted: false } });
    if (!folder) return err('Folder not found', 404);

    const updated = await prisma.folder.update({ where: { id }, data: { name } });
    return ok(updated);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    const { sub } = await requireAuth(request);
    const { id } = await ctx.params;

    const folder = await prisma.folder.findFirst({ where: { id, createdById: sub, isDeleted: false } });
    if (!folder) return err('Folder not found', 404);

    await prisma.folder.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
    return noContent();
  } catch (e) {
    return handleError(e);
  }
}
