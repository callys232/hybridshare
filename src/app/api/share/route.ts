import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, hashPassword } from '@/lib/auth';
import { ok, err, handleError } from '@/lib/api-helpers';

const schema = z.object({
  fileId:      z.string().optional(),
  workspaceId: z.string().optional(),
  permissions: z.array(z.enum(['VIEW', 'DOWNLOAD', 'COMMENT', 'EDIT'])).min(1),
  password:    z.string().min(4).optional(),
  expiresAt:   z.string().datetime().optional(),
  maxViews:    z.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);
    const body = schema.parse(await request.json());

    if (!body.fileId && !body.workspaceId) return err('Provide a fileId or workspaceId', 400);

    let passwordHash: string | null = null;
    if (body.password) passwordHash = await hashPassword(body.password);

    const link = await prisma.shareLink.create({
      data: {
        fileId:      body.fileId      ?? null,
        workspaceId: body.workspaceId ?? null,
        createdById: sub,
        permissions: body.permissions as never,
        passwordHash,
        expiresAt:   body.expiresAt ? new Date(body.expiresAt) : null,
        maxViews:    body.maxViews ?? null,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    return ok({ ...link, shareUrl: `${appUrl}/s/${link.token}` }, undefined, 201);
  } catch (e) {
    return handleError(e);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);
    const links = await prisma.shareLink.findMany({
      where: { createdById: sub, isActive: true },
      include: { file: { select: { id: true, name: true, extension: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return ok(links);
  } catch (e) {
    return handleError(e);
  }
}
