import { prisma } from '../config/database';
import { storageService } from './storage.service';
import { logger } from '../utils/logger';

export class VersionService {
  async listVersions(fileId: string) {
    return prisma.fileVersion.findMany({
      where: { fileId },
      orderBy: { version: 'desc' },
    });
  }

  async uploadVersion(
    fileId: string,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    userId: string,
    comment?: string
  ) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw Object.assign(new Error('File not found'), { statusCode: 404 });

    const nextVersion = file.versionCount + 1;

    const uploadResult = await storageService.uploadVersion(
      buffer,
      originalName,
      mimeType,
      fileId,
      userId,
      nextVersion
    );

    const [version] = await prisma.$transaction([
      prisma.fileVersion.create({
        data: {
          fileId,
          version: nextVersion,
          storagePath: uploadResult.storagePath,
          size: BigInt(uploadResult.size),
          checksum: uploadResult.checksum,
          uploadedById: userId,
          comment: comment || null,
        },
      }),
      prisma.file.update({
        where: { id: fileId },
        data: {
          versionCount: nextVersion,
          size: BigInt(uploadResult.size),
          storagePath: uploadResult.storagePath,
          checksum: uploadResult.checksum,
          updatedAt: new Date(),
        },
      }),
    ]);

    const sizeDiff = Number(uploadResult.size) - Number(file.size);
    if (sizeDiff !== 0 && file.workspaceId) {
      await prisma.workspace.update({
        where: { id: file.workspaceId },
        data: { storageUsed: { increment: BigInt(sizeDiff) } },
      });
    }

    return version;
  }

  async restoreVersion(fileId: string, versionId: string, userId: string) {
    const version = await prisma.fileVersion.findFirst({
      where: { id: versionId, fileId },
    });

    if (!version) throw Object.assign(new Error('Version not found'), { statusCode: 404 });

    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw Object.assign(new Error('File not found'), { statusCode: 404 });

    const currentVersion = await prisma.fileVersion.create({
      data: {
        fileId,
        version: file.versionCount + 1,
        storagePath: file.storagePath,
        size: file.size,
        checksum: file.checksum,
        uploadedById: userId,
        comment: 'Auto-saved before version restore',
      },
    });

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: {
        storagePath: version.storagePath,
        size: version.size,
        checksum: version.checksum,
        versionCount: file.versionCount + 1,
        currentVersionId: version.id,
      },
    });

    logger.info('File version restored', { fileId, versionId, userId });
    return updated;
  }
}

export const versionService = new VersionService();
