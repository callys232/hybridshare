import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/auth';
import { getDownloadUrl } from '@/lib/storage';
import { ok, err, handleError } from '@/lib/api-helpers';

type Ctx = { params: Promise<{ token: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const { token } = await ctx.params;
    const url = new URL(request.url);
    const password = url.searchParams.get('password');

    const link = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        file: {
          select: {
            id: true, name: true, mimeType: true, size: true, extension: true,
            storagePath: true, storageProvider: true, cloudUrl: true,
          },
        },
      },
    });

    if (!link || !link.isActive) return err('Share link not found or inactive', 404);
    if (link.expiresAt && link.expiresAt < new Date()) return err('Share link has expired', 410);
    if (link.maxViews && link.viewCount >= link.maxViews) return err('Share link view limit reached', 410);

    if (link.passwordHash) {
      if (!password) return err('This link is password protected', 401);
      const valid = await comparePassword(password, link.passwordHash);
      if (!valid) return err('Incorrect password', 401);
    }

    // Record view
    await prisma.$transaction([
      prisma.shareLinkView.create({
        data: {
          shareLinkId: link.id,
          ipAddress:   request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip'),
          userAgent:   request.headers.get('user-agent'),
          referrer:    request.headers.get('referer'),
        },
      }),
      prisma.shareLink.update({ where: { id: link.id }, data: { viewCount: { increment: 1 } } }),
    ]);

    let downloadUrl: string | null = null;
    if (link.file && link.permissions.includes('DOWNLOAD' as never)) {
      downloadUrl = await getDownloadUrl(link.file.storagePath, link.file.storageProvider);
    }

    return ok({
      link: { ...link, passwordHash: undefined },
      downloadUrl,
      file: link.file ? { ...link.file, size: link.file.size.toString() } : null,
    });
  } catch (e) {
    return handleError(e);
  }
}
