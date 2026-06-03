import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getDownloadUrl } from '@/lib/storage';
import { ok, err, handleError } from '@/lib/api-helpers';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const { sub } = await requireAuth(request);
    const { id } = await ctx.params;

    const file = await prisma.file.findFirst({
      where: { id, uploadedById: sub, status: 'ACTIVE' },
    });
    if (!file) return err('File not found', 404);

    const expiresIn = 3600;
    const url = await getDownloadUrl(file.storagePath, file.storageProvider, expiresIn);

    // If the URL is local (/api/uploads/…), redirect directly; otherwise return the presigned URL
    if (url.startsWith('/')) {
      return NextResponse.redirect(new URL(url, request.url));
    }

    return ok({ url, expiresIn, fileName: file.name, mimeType: file.mimeType });
  } catch (e) {
    return handleError(e);
  }
}
