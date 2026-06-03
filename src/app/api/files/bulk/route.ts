import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { deleteFile } from '@/lib/storage';
import { ok, err, handleError } from '@/lib/api-helpers';

const schema = z.object({
  fileIds:        z.array(z.string()).min(1).max(100),
  operation:      z.enum(['delete', 'move', 'copy', 'star', 'unstar']),
  targetFolderId: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { sub } = await requireAuth(request);
    const { fileIds, operation, targetFolderId } = schema.parse(await request.json());

    // Verify ownership of all files
    const files = await prisma.file.findMany({
      where: { id: { in: fileIds }, uploadedById: sub, status: 'ACTIVE' },
    });
    if (files.length !== fileIds.length) return err('One or more files not found', 404);

    if (operation === 'delete') {
      const totalSize = files.reduce((sum, f) => sum + f.size, BigInt(0));
      await prisma.file.updateMany({
        where: { id: { in: fileIds } },
        data:  { status: 'DELETED', deletedAt: new Date() },
      });
      await prisma.user.update({ where: { id: sub }, data: { storageUsed: { decrement: totalSize } } });
      for (const f of files) deleteFile(f.storagePath, f.storageProvider).catch(() => {});
    }

    if (operation === 'move') {
      await prisma.file.updateMany({
        where: { id: { in: fileIds } },
        data:  { folderId: targetFolderId ?? null },
      });
    }

    if (operation === 'star') {
      await prisma.file.updateMany({ where: { id: { in: fileIds } }, data: { isStarred: true } });
    }

    if (operation === 'unstar') {
      await prisma.file.updateMany({ where: { id: { in: fileIds } }, data: { isStarred: false } });
    }

    return ok({ affected: fileIds.length, operation });
  } catch (e) {
    return handleError(e);
  }
}
