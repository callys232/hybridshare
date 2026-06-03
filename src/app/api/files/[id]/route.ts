import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { deleteFile } from '@/lib/storage';
import { ok, err, noContent, handleError } from '@/lib/api-helpers';

type Ctx = { params: Promise<{ id: string }> };

function serializeFile(f: Record<string, unknown>) {
  return { ...f, size: f.size?.toString() };
}

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const { sub } = await requireAuth(request);
    const { id } = await ctx.params;

    const file = await prisma.file.findFirst({
      where: { id, uploadedById: sub, status: 'ACTIVE' },
      include: { uploader: { select: { id: true, name: true, avatar: true } } },
    });
    if (!file) return err('File not found', 404);

    return ok(serializeFile(file as unknown as Record<string, unknown>));
  } catch (e) {
    return handleError(e);
  }
}

const updateSchema = z.object({
  name:        z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  tags:        z.array(z.string()).optional(),
  isStarred:   z.boolean().optional(),
  folderId:    z.string().nullable().optional(),
  workspaceId: z.string().nullable().optional(),
});

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    const { sub } = await requireAuth(request);
    const { id } = await ctx.params;

    const file = await prisma.file.findFirst({ where: { id, uploadedById: sub, status: 'ACTIVE' } });
    if (!file) return err('File not found', 404);

    const data = updateSchema.parse(await request.json());
    const updated = await prisma.file.update({ where: { id }, data });

    return ok(serializeFile(updated as unknown as Record<string, unknown>));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    const { sub } = await requireAuth(request);
    const { id } = await ctx.params;

    const file = await prisma.file.findFirst({ where: { id, uploadedById: sub, status: 'ACTIVE' } });
    if (!file) return err('File not found', 404);

    await prisma.file.update({ where: { id }, data: { status: 'DELETED', deletedAt: new Date() } });
    await prisma.user.update({
      where: { id: sub },
      data:  { storageUsed: { decrement: file.size } },
    });

    // Best-effort physical delete
    deleteFile(file.storagePath, file.storageProvider).catch(() => {});

    return noContent();
  } catch (e) {
    return handleError(e);
  }
}

// PATCH /api/files/[id]/star — toggle starred
export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const { sub } = await requireAuth(request);
    const { id } = await ctx.params;

    const file = await prisma.file.findFirst({ where: { id, uploadedById: sub, status: 'ACTIVE' } });
    if (!file) return err('File not found', 404);

    const updated = await prisma.file.update({ where: { id }, data: { isStarred: !file.isStarred } });
    return ok({ isStarred: updated.isStarred });
  } catch (e) {
    return handleError(e);
  }
}
