import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ok, handleError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);

    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          { ownerId: sub },
          { members: { some: { userId: sub } } },
        ],
      },
      include: {
        _count: { select: { members: true, files: true } },
        members: { where: { userId: sub }, select: { role: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const result = workspaces.map((w) => ({
      ...w,
      storageQuota: w.storageQuota.toString(),
      storageUsed:  w.storageUsed.toString(),
      memberCount:  w._count.members,
      fileCount:    w._count.files,
      myRole:       w.members[0]?.role ?? 'OWNER',
    }));

    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}

const schema = z.object({
  name:        z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type:        z.enum(['PERSONAL', 'TEAM', 'PROJECT', 'DEPARTMENT']).default('TEAM'),
  color:       z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  isPublic:    z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);
    const data = schema.parse(await request.json());

    const workspace = await prisma.workspace.create({
      data: {
        ...data,
        ownerId: sub,
        members: { create: { userId: sub, role: 'OWNER' } },
      },
    });

    return ok({
      ...workspace,
      storageQuota: workspace.storageQuota.toString(),
      storageUsed:  workspace.storageUsed.toString(),
    }, undefined, 201);
  } catch (e) {
    return handleError(e);
  }
}
