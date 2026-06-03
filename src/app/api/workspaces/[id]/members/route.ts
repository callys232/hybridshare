import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ok, err, noContent, handleError } from '@/lib/api-helpers';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const { sub } = await requireAuth(request);
    const { id } = await ctx.params;

    const isMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId: sub } },
    });
    if (!isMember) return err('Workspace not found', 404);

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: id },
      include: { user: { select: { id: true, name: true, email: true, avatar: true, role: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    return ok(members);
  } catch (e) {
    return handleError(e);
  }
}

const inviteSchema = z.object({
  email: z.string().email(),
  role:  z.enum(['ADMIN', 'EDITOR', 'VIEWER', 'COMMENTER']).default('VIEWER'),
});

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const { sub } = await requireAuth(request);
    const { id } = await ctx.params;

    const me = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId: sub } },
    });
    if (!me || (me.role !== 'OWNER' && me.role !== 'ADMIN')) return err('Insufficient permissions', 403);

    const { email, role } = inviteSchema.parse(await request.json());
    const target = await prisma.user.findUnique({ where: { email } });
    if (!target) return err('User not found', 404);

    const existing = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId: target.id } },
    });
    if (existing) return err('User is already a member', 409);

    const member = await prisma.workspaceMember.create({
      data: { workspaceId: id, userId: target.id, role, invitedById: sub },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });
    return ok(member, undefined, 201);
  } catch (e) {
    return handleError(e);
  }
}
