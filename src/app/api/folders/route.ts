import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ok, handleError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);
    const url = new URL(request.url);
    const parentId    = url.searchParams.get('parentId')    ?? null;
    const workspaceId = url.searchParams.get('workspaceId') ?? null;

    const folders = await prisma.folder.findMany({
      where: { createdById: sub, isDeleted: false, parentId, ...(workspaceId ? { workspaceId } : {}) },
      include: { _count: { select: { files: true, children: true } } },
      orderBy: { name: 'asc' },
    });
    return ok(folders);
  } catch (e) {
    return handleError(e);
  }
}

const schema = z.object({
  name:        z.string().min(1).max(255),
  parentId:    z.string().nullable().optional(),
  workspaceId: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);
    const { name, parentId, workspaceId } = schema.parse(await request.json());

    let path = `/${name}`;
    if (parentId) {
      const parent = await prisma.folder.findFirst({ where: { id: parentId, createdById: sub } });
      if (parent) path = `${parent.path}/${name}`;
    }

    const folder = await prisma.folder.create({
      data: { name, parentId: parentId ?? null, workspaceId: workspaceId ?? null, createdById: sub, path },
    });
    return ok(folder, undefined, 201);
  } catch (e) {
    return handleError(e);
  }
}
