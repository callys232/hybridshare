"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionService = exports.VersionService = void 0;
const database_1 = require("../config/database");
const storage_service_1 = require("./storage.service");
const logger_1 = require("../utils/logger");
class VersionService {
    async listVersions(fileId) {
        return database_1.prisma.fileVersion.findMany({
            where: { fileId },
            orderBy: { version: 'desc' },
        });
    }
    async uploadVersion(fileId, buffer, originalName, mimeType, userId, comment) {
        const file = await database_1.prisma.file.findUnique({ where: { id: fileId } });
        if (!file)
            throw Object.assign(new Error('File not found'), { statusCode: 404 });
        const nextVersion = file.versionCount + 1;
        const uploadResult = await storage_service_1.storageService.uploadVersion(buffer, originalName, mimeType, fileId, userId, nextVersion);
        const [version] = await database_1.prisma.$transaction([
            database_1.prisma.fileVersion.create({
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
            database_1.prisma.file.update({
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
            await database_1.prisma.workspace.update({
                where: { id: file.workspaceId },
                data: { storageUsed: { increment: BigInt(sizeDiff) } },
            });
        }
        return version;
    }
    async restoreVersion(fileId, versionId, userId) {
        const version = await database_1.prisma.fileVersion.findFirst({
            where: { id: versionId, fileId },
        });
        if (!version)
            throw Object.assign(new Error('Version not found'), { statusCode: 404 });
        const file = await database_1.prisma.file.findUnique({ where: { id: fileId } });
        if (!file)
            throw Object.assign(new Error('File not found'), { statusCode: 404 });
        const currentVersion = await database_1.prisma.fileVersion.create({
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
        const updated = await database_1.prisma.file.update({
            where: { id: fileId },
            data: {
                storagePath: version.storagePath,
                size: version.size,
                checksum: version.checksum,
                versionCount: file.versionCount + 1,
                currentVersionId: version.id,
            },
        });
        logger_1.logger.info('File version restored', { fileId, versionId, userId });
        return updated;
    }
}
exports.VersionService = VersionService;
exports.versionService = new VersionService();
//# sourceMappingURL=version.service.js.map