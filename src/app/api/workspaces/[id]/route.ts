import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ok, err, noContent, handleError } from '@/lib/api-helpers';

type Ctx = { params: Promise<{ id: string }> };

async function ownerOrAdmin(workspaceId: string, userId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  return member?.role === 'OWNER' || member?.role === 'ADMIN';
}

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const { sub } = await requireAuth(request);
    const { id } = await ctx.params;

    const workspace = await prisma.workspace.findFirst({
      where: { id, members: { some: { userId: sub } } },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
        _count:  { select: { files: true } },
      },
    });
    if (!workspace) return err('Workspace not found', 404);

    return ok({
      ...workspace,
      storageQuota: workspace.storageQuota.toString(),
      storageUsed:  workspace.storageUsed.toString(),
      fileCount:    workspace._count.files,
    });
  } catch (e) {
    return handleError(e);
  }
}

const updateSchema = z.object({
  name:        z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  color:       z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isPublic:    z.boolean().optional(),
});

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    const { sub } = await requireAuth(request);
    const { id } = await ctx.params;

    if (!(await ownerOrAdmin(id, sub))) return err('Insufficient permissions', 403);

    const data = updateSchema.parse(await request.json());
    const workspace = await prisma.workspace.update({ where: { id }, data });

    return ok({
      ...workspace,
      storageQuota: workspace.storageQuota.toString(),
      storageUsed:  workspace.storageUsed.toString(),
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    const { sub } = await requireAuth(request);
    const { id } = await ctx.params;

    const workspace = await prisma.workspace.findFirst({ where: { id, ownerId: sub } });
    if (!workspace) return err('Workspace not found or you are not the owner', 403);

    await prisma.workspace.delete({ where: { id } });
    return noContent();
  } catch (e) {
    return handleError(e);
  }
}
