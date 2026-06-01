import path from 'path';
import sharp from 'sharp';
import { uploadBuffer, deleteObject, generatePresignedUrl, buildObjectPath } from '../config/minio';
import { computeChecksum } from '../utils/crypto';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export interface UploadResult {
  storagePath: string;
  thumbnailPath: string | null;
  size: number;
  checksum: string;
  mimeType: string;
}

export class StorageService {
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    userId: string,
    metadata: Record<string, string> = {}
  ): Promise<UploadResult> {
    const sanitizedName = this.sanitizeFileName(originalName);
    const storagePath = buildObjectPath(userId, sanitizedName);
    const checksum = computeChecksum(buffer);

    await uploadBuffer(storagePath, buffer, mimeType, {
      'x-uploaded-by': userId,
      'x-original-name': encodeURIComponent(originalName),
      'x-checksum': checksum,
      ...metadata,
    });

    let thumbnailPath: string | null = null;
    if (this.isImage(mimeType)) {
      thumbnailPath = await this.generateThumbnail(buffer, storagePath, userId);
    }

    return { storagePath, thumbnailPath, size: buffer.length, checksum, mimeType };
  }

  async uploadVersion(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    fileId: string,
    userId: string,
    version: number
  ): Promise<UploadResult> {
    const sanitizedName = this.sanitizeFileName(originalName);
    const storagePath = `versions/${fileId}/v${version}_${sanitizedName}`;
    const checksum = computeChecksum(buffer);

    await uploadBuffer(storagePath, buffer, mimeType, {
      'x-file-id': fileId,
      'x-version': String(version),
      'x-uploaded-by': userId,
    });

    return { storagePath, thumbnailPath: null, size: buffer.length, checksum, mimeType };
  }

  async deleteFile(storagePath: string, thumbnailPath?: string | null): Promise<void> {
    await deleteObject(storagePath).catch((err) =>
      logger.warn('Failed to delete storage object', { storagePath, err })
    );

    if (thumbnailPath) {
      await deleteObject(thumbnailPath).catch((err) =>
        logger.warn('Failed to delete thumbnail', { thumbnailPath, err })
      );
    }
  }

  async getDownloadUrl(storagePath: string, expirySeconds = 3600): Promise<string> {
    return generatePresignedUrl(storagePath, expirySeconds);
  }

  async getPreviewUrl(storagePath: string): Promise<string> {
    return generatePresignedUrl(storagePath, 300);
  }

  private async generateThumbnail(
    buffer: Buffer,
    originalPath: string,
    userId: string
  ): Promise<string | null> {
    try {
      const thumbBuffer = await sharp(buffer)
        .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbPath = `thumbnails/${userId}/${Date.now()}_thumb.jpg`;
      await uploadBuffer(thumbPath, thumbBuffer, 'image/jpeg');
      return thumbPath;
    } catch (err) {
      logger.warn('Thumbnail generation failed', { err });
      return null;
    }
  }

  async uploadAvatar(buffer: Buffer, userId: string): Promise<string> {
    const resized = await sharp(buffer)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 90 })
      .toBuffer();

    const avatarPath = `avatars/${userId}/avatar.jpg`;
    await uploadBuffer(avatarPath, resized, 'image/jpeg');
    return generatePresignedUrl(avatarPath, 86400 * 365);
  }

  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/') && !mimeType.includes('svg');
  }

  sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 200);
  }

  getFileExtension(name: string): string {
    return path.extname(name).toLowerCase().slice(1);
  }
}

export const storageService = new StorageService();
