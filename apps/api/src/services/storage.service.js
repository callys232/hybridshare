"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageService = exports.StorageService = void 0;
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const minio_1 = require("../config/minio");
const crypto_1 = require("../utils/crypto");
const logger_1 = require("../utils/logger");
class StorageService {
    async uploadFile(buffer, originalName, mimeType, userId, metadata = {}) {
        const sanitizedName = this.sanitizeFileName(originalName);
        const storagePath = (0, minio_1.buildObjectPath)(userId, sanitizedName);
        const checksum = (0, crypto_1.computeChecksum)(buffer);
        await (0, minio_1.uploadBuffer)(storagePath, buffer, mimeType, {
            'x-uploaded-by': userId,
            'x-original-name': encodeURIComponent(originalName),
            'x-checksum': checksum,
            ...metadata,
        });
        let thumbnailPath = null;
        if (this.isImage(mimeType)) {
            thumbnailPath = await this.generateThumbnail(buffer, storagePath, userId);
        }
        return { storagePath, thumbnailPath, size: buffer.length, checksum, mimeType };
    }
    async uploadVersion(buffer, originalName, mimeType, fileId, userId, version) {
        const sanitizedName = this.sanitizeFileName(originalName);
        const storagePath = `versions/${fileId}/v${version}_${sanitizedName}`;
        const checksum = (0, crypto_1.computeChecksum)(buffer);
        await (0, minio_1.uploadBuffer)(storagePath, buffer, mimeType, {
            'x-file-id': fileId,
            'x-version': String(version),
            'x-uploaded-by': userId,
        });
        return { storagePath, thumbnailPath: null, size: buffer.length, checksum, mimeType };
    }
    async deleteFile(storagePath, thumbnailPath) {
        await (0, minio_1.deleteObject)(storagePath).catch((err) => logger_1.logger.warn('Failed to delete storage object', { storagePath, err }));
        if (thumbnailPath) {
            await (0, minio_1.deleteObject)(thumbnailPath).catch((err) => logger_1.logger.warn('Failed to delete thumbnail', { thumbnailPath, err }));
        }
    }
    async getDownloadUrl(storagePath, expirySeconds = 3600) {
        return (0, minio_1.generatePresignedUrl)(storagePath, expirySeconds);
    }
    async getPreviewUrl(storagePath) {
        return (0, minio_1.generatePresignedUrl)(storagePath, 300);
    }
    async generateThumbnail(buffer, originalPath, userId) {
        try {
            const thumbBuffer = await (0, sharp_1.default)(buffer)
                .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toBuffer();
            const thumbPath = `thumbnails/${userId}/${Date.now()}_thumb.jpg`;
            await (0, minio_1.uploadBuffer)(thumbPath, thumbBuffer, 'image/jpeg');
            return thumbPath;
        }
        catch (err) {
            logger_1.logger.warn('Thumbnail generation failed', { err });
            return null;
        }
    }
    async uploadAvatar(buffer, userId) {
        const resized = await (0, sharp_1.default)(buffer)
            .resize(200, 200, { fit: 'cover' })
            .jpeg({ quality: 90 })
            .toBuffer();
        const avatarPath = `avatars/${userId}/avatar.jpg`;
        await (0, minio_1.uploadBuffer)(avatarPath, resized, 'image/jpeg');
        return (0, minio_1.generatePresignedUrl)(avatarPath, 86400 * 365);
    }
    isImage(mimeType) {
        return mimeType.startsWith('image/') && !mimeType.includes('svg');
    }
    sanitizeFileName(name) {
        return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 200);
    }
    getFileExtension(name) {
        return path_1.default.extname(name).toLowerCase().slice(1);
    }
}
exports.StorageService = StorageService;
exports.storageService = new StorageService();
//# sourceMappingURL=storage.service.js.map