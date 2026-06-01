import { prisma } from '../config/database';
import { storageService } from './storage.service';
import { searchService } from './search.service';
import { notificationService } from './notification.service';
import { emitToWorkspace } from '../config/socket';
import { logger } from '../utils/logger';
import { buildMeta, parsePagination } from '../utils/paginate';
import type { UpdateFileInput, BulkOperationInput } from '@hybridshare/shared/schemas/file.schema';
import type { PaginationQuery } from '../utils/paginate';

export class FileService {
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    userId: string,
    options: { workspaceId?: string; folderId?: string; description?: string; tags?: string[] } = {}
  ) {
    const uploadResult = await storageService.uploadFile(buffer, originalName, mimeType, userId);
    const extension = storageService.getFileExtension(originalName);

    const file = await prisma.file.create({
      data: {
        name: originalName,
        originalName,
        mimeType,
        size: BigInt(uploadResult.size),
        extension,
        storagePath: uploadResult.storagePath,
        thumbnailPath: uploadResult.thumbnailPath,
        checksum: uploadResult.checksum,
        workspaceId: options.workspaceId || null,
        folderId: options.folderId || null,
        uploadedById: userId,
        description: options.description || null,
      },
      include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
    });

    if (options.workspaceId) {
      await prisma.workspace.update({
        where: { id: options.workspaceId },
        data: { storageUsed: { increment: BigInt(uploadResult.size) } },
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { storageUsed: { increment: BigInt(uploadResult.size) } },
    });

    await searchService.indexFile(file);

    if (options.workspaceId) {
      emitToWorkspace(options.workspaceId, 'file:uploaded', {
        fileId: file.id,
        name: file.name,
        uploadedBy: file.uploadedBy,
        workspaceId: options.workspaceId,
      });
    }

    return file;
  }

  async getFile(fileId: string, userId: string) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, status: { not: 'INFECTED' } },
      include: {
        uploadedBy: { select: { id: true, name: true, avatar: true } },
        folder: { select: { id: true, name: true, path: true } },
        tags: true,
        versions: { orderBy: { version: 'desc' }, take: 1 },
      },
    });

    if (!file) throw Object.assign(new Error('File not found'), { statusCode: 404 });
    return file;
  }

  async getDownloadUrl(fileId: string, userId: string): Promise<string> {
    const file = await this.getFile(fileId, userId);
    return storageService.getDownloadUrl(file.storagePath);
  }

  async getPreviewUrl(fileId: string, userId: string): Promise<{ url: string; mimeType: string }> {
    const file = await this.getFile(fileId, userId);
    const url = await storageService.getPreviewUrl(file.storagePath);
    return { url, mimeType: file.mimeType };
  }

  async updateFile(fileId: string, userId: string, input: UpdateFileInput) {
    const file = await this.getFile(fileId, userId);

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: {
        name: input.name ?? file.name,
        description: input.description ?? file.description,
        folderId: input.folderId !== undefined ? input.folderId : file.folderId,
        ...(input.tags
          ? {
              tags: {
                set: [],
                connectOrCreate: input.tags.map((tag) => ({
                  where: { name_workspaceId: { name: tag, workspaceId: file.workspaceId } },
                  create: { name: tag, workspaceId: file.workspaceId },
                })),
              },
            }
          : {}),
      },
      include: { tags: true },
    });

    await searchService.updateFile(updated);

    if (file.workspaceId) {
      emitToWorkspace(file.workspaceId, 'file:updated', { fileId, name: updated.name });
    }

    return updated;
  }

  async softDeleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.getFile(fileId, userId);

    await prisma.file.update({
      where: { id: fileId },
      data: { status: 'DELETED', deletedAt: new Date() },
    });

    if (file.workspaceId) {
      emitToWorkspace(file.workspaceId, 'file:deleted', { fileId });
    }
  }

  async restoreFile(fileId: string, userId: string) {
    const file = await prisma.file.findFirst({ where: { id: fileId, status: 'DELETED' } });
    if (!file) throw Object.assign(new Error('File not found in recycle bin'), { statusCode: 404 });

    return prisma.file.update({
      where: { id: fileId },
      data: { status: 'ACTIVE', deletedAt: null },
    });
  }

  async permanentDeleteFile(fileId: string, userId: string): Promise<void> {
    const file = await prisma.file.findFirst({ where: { id: fileId } });
    if (!file) throw Object.assign(new Error('File not found'), { statusCode: 404 });

    await storageService.deleteFile(file.storagePath, file.thumbnailPath);

    const versions = await prisma.fileVersion.findMany({ where: { fileId } });
    for (const v of versions) {
      await storageService.deleteFile(v.storagePath).catch(() => {});
    }

    await prisma.file.delete({ where: { id: fileId } });

    if (file.workspaceId) {
      await prisma.workspace.update({
        where: { id: file.workspaceId },
        data: { storageUsed: { decrement: file.size } },
      });
    }

    await prisma.user.update({
      where: { id: file.uploadedById },
      data: { storageUsed: { decrement: file.size } },
    });

    await searchService.removeFile(fileId);
  }

  async listFiles(
    userId: string,
    query: PaginationQuery & {
      workspaceId?: string;
      folderId?: string;
      mimeType?: string;
      search?: string;
      starred?: boolean;
      deleted?: boolean;
    }
  ) {
    const { skip, take, page, limit } = parsePagination(query);

    const where = {
      ...(query.deleted ? { status: 'DELETED' as const } : { status: 'ACTIVE' as const }),
      ...(query.workspaceId ? { workspaceId: query.workspaceId } : {}),
      ...(query.folderId !== undefined ? { folderId: query.folderId } : {}),
      ...(query.mimeType ? { mimeType: { contains: query.mimeType } } : {}),
      ...(query.starred ? { isStarred: true } : {}),
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.file.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: { select: { id: true, name: true, avatar: true } },
          tags: true,
        },
      }),
      prisma.file.count({ where }),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  }

  async toggleStar(fileId: string, userId: string) {
    const file = await this.getFile(fileId, userId);
    return prisma.file.update({
      where: { id: fileId },
      data: { isStarred: !file.isStarred },
    });
  }

  async bulkOperation(userId: string, input: BulkOperationInput): Promise<{ processed: number }> {
    let processed = 0;

    for (const fileId of input.fileIds) {
      try {
        switch (input.operation) {
          case 'delete':
            await this.softDeleteFile(fileId, userId);
            break;
          case 'move':
            if (input.targetFolderId !== undefined) {
              await prisma.file.update({
                where: { id: fileId },
                data: { folderId: input.targetFolderId },
              });
            }
            break;
          case 'copy':
            await this.copyFile(fileId, userId, input.targetFolderId);
            break;
          case 'star':
            await prisma.file.update({ where: { id: fileId }, data: { isStarred: true } });
            break;
          case 'tag':
            if (input.tagIds?.length) {
              await prisma.file.update({
                where: { id: fileId },
                data: { tags: { connect: input.tagIds.map((id) => ({ id })) } },
              });
            }
            break;
        }
        processed++;
      } catch (err) {
        logger.warn('Bulk operation failed for file', { fileId, operation: input.operation, err });
      }
    }

    return { processed };
  }

  private async copyFile(fileId: string, userId: string, targetFolderId?: string | null) {
    const original = await this.getFile(fileId, userId);

    return prisma.file.create({
      data: {
        name: `Copy of ${original.name}`,
        originalName: original.originalName,
        mimeType: original.mimeType,
        size: original.size,
        extension: original.extension,
        storagePath: original.storagePath,
        thumbnailPath: original.thumbnailPath,
        checksum: original.checksum,
        workspaceId: original.workspaceId,
        folderId: targetFolderId ?? original.folderId,
        uploadedById: userId,
        description: original.description,
      },
    });
  }

  async getRecycleBin(userId: string, query: PaginationQuery) {
    const { skip, take, page, limit } = parsePagination(query);

    const [items, total] = await Promise.all([
      prisma.file.findMany({
        where: { uploadedById: userId, status: 'DELETED' },
        skip,
        take,
        orderBy: { deletedAt: 'desc' },
        include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
      }),
      prisma.file.count({ where: { uploadedById: userId, status: 'DELETED' } }),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  }
}

export const fileService = new FileService();
