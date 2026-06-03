import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { uploadFile, resolveProvider } from '@/lib/storage';
import { ok, err, paginate, handleError, parsePagination } from '@/lib/api-helpers';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

function serializeFile(f: Record<string, unknown>) {
  return { ...f, size: f.size?.toString() };
}

// ─── GET /api/files ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);
    const url = new URL(request.url);
    const { page, limit, skip } = parsePagination(url);

    const search      = url.searchParams.get('q') ?? '';
    const folderId    = url.searchParams.get('folderId') ?? null;
    const workspaceId = url.searchParams.get('workspaceId') ?? null;
    const starred     = url.searchParams.get('starred') === 'true';
    const status      = 'ACTIVE' as const;

    const where = {
      uploadedById: sub,
      status,
      ...(folderId    ? { folderId }    : {}),
      ...(workspaceId ? { workspaceId } : {}),
      ...(starred     ? { isStarred: true } : {}),
      ...(search      ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const [files, total] = await prisma.$transaction([
      prisma.file.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true, name: true, originalName: true, mimeType: true, size: true,
          extension: true, storagePath: true, storageProvider: true, cloudUrl: true,
          thumbnailPath: true, status: true, isStarred: true, workspaceId: true,
          folderId: true, uploadedById: true, tags: true, description: true,
          versionCount: true, currentVersionId: true, createdAt: true, updatedAt: true,
          uploader: { select: { id: true, name: true, avatar: true } },
        },
      }),
      prisma.file.count({ where }),
    ]);

    return paginate(files.map((f) => serializeFile(f as unknown as Record<string, unknown>)), total, page, limit);
  } catch (e) {
    return handleError(e);
  }
}

// ─── POST /api/files (multipart upload) ──────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return err('No file provided', 400);
    if (file.size > MAX_FILE_SIZE) return err('File exceeds 500 MB limit', 413);

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: sub },
      select: { storageUsed: true, storageQuota: true, cloudAddon: true },
    });

    const remaining = user.storageQuota - user.storageUsed;
    if (BigInt(file.size) > remaining) return err('Storage quota exceeded', 413);

    const folderId    = formData.get('folderId')?.toString()    ?? null;
    const workspaceId = formData.get('workspaceId')?.toString() ?? null;
    const description = formData.get('description')?.toString() ?? null;
    const tags        = formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [];

    const buffer   = Buffer.from(await file.arrayBuffer());
    const checksum = createHash('sha256').update(buffer).digest('hex');
    const ext      = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
    const provider = resolveProvider(!!user.cloudAddon?.isEnabled);

    const { storagePath, storageProvider, cloudUrl } = await uploadFile(buffer, file.name, file.type, provider, sub);

    const record = await prisma.file.create({
      data: {
        name:            file.name,
        originalName:    file.name,
        mimeType:        file.type,
        size:            BigInt(file.size),
        extension:       ext,
        storagePath,
        storageProvider,
        cloudUrl,
        checksum,
        uploadedById:    sub,
        folderId,
        workspaceId,
        description,
        tags,
        versions: {
          create: {
            version:         1,
            storagePath,
            storageProvider,
            size:            BigInt(file.size),
            checksum,
            uploadedById:    sub,
          },
        },
      },
    });

    await prisma.user.update({
      where: { id: sub },
      data:  { storageUsed: { increment: BigInt(file.size) } },
    });

    return ok(serializeFile(record as unknown as Record<string, unknown>), undefined, 201);
  } catch (e) {
    return handleError(e);
  }
}
