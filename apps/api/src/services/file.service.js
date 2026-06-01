"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileService = exports.FileService = void 0;
const database_1 = require("../config/database");
const storage_service_1 = require("./storage.service");
const search_service_1 = require("./search.service");
const socket_1 = require("../config/socket");
const logger_1 = require("../utils/logger");
const paginate_1 = require("../utils/paginate");
class FileService {
    async uploadFile(buffer, originalName, mimeType, userId, options = {}) {
        const uploadResult = await storage_service_1.storageService.uploadFile(buffer, originalName, mimeType, userId);
        const extension = storage_service_1.storageService.getFileExtension(originalName);
        const file = await database_1.prisma.file.create({
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
            await database_1.prisma.workspace.update({
                where: { id: options.workspaceId },
                data: { storageUsed: { increment: BigInt(uploadResult.size) } },
            });
        }
        await database_1.prisma.user.update({
            where: { id: userId },
            data: { storageUsed: { increment: BigInt(uploadResult.size) } },
        });
        await search_service_1.searchService.indexFile(file);
        if (options.workspaceId) {
            (0, socket_1.emitToWorkspace)(options.workspaceId, 'file:uploaded', {
                fileId: file.id,
                name: file.name,
                uploadedBy: file.uploadedBy,
                workspaceId: options.workspaceId,
            });
        }
        return file;
    }
    async getFile(fileId, userId) {
        const file = await database_1.prisma.file.findFirst({
            where: { id: fileId, status: { not: 'INFECTED' } },
            include: {
                uploadedBy: { select: { id: true, name: true, avatar: true } },
                folder: { select: { id: true, name: true, path: true } },
                tags: true,
                versions: { orderBy: { version: 'desc' }, take: 1 },
            },
        });
        if (!file)
            throw Object.assign(new Error('File not found'), { statusCode: 404 });
        return file;
    }
    async getDownloadUrl(fileId, userId) {
        const file = await this.getFile(fileId, userId);
        return storage_service_1.storageService.getDownloadUrl(file.storagePath);
    }
    async getPreviewUrl(fileId, userId) {
        const file = await this.getFile(fileId, userId);
        const url = await storage_service_1.storageService.getPreviewUrl(file.storagePath);
        return { url, mimeType: file.mimeType };
    }
    async updateFile(fileId, userId, input) {
        const file = await this.getFile(fileId, userId);
        const updated = await database_1.prisma.file.update({
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
        await search_service_1.searchService.updateFile(updated);
        if (file.workspaceId) {
            (0, socket_1.emitToWorkspace)(file.workspaceId, 'file:updated', { fileId, name: updated.name });
        }
        return updated;
    }
    async softDeleteFile(fileId, userId) {
        const file = await this.getFile(fileId, userId);
        await database_1.prisma.file.update({
            where: { id: fileId },
            data: { status: 'DELETED', deletedAt: new Date() },
        });
        if (file.workspaceId) {
            (0, socket_1.emitToWorkspace)(file.workspaceId, 'file:deleted', { fileId });
        }
    }
    async restoreFile(fileId, userId) {
        const file = await database_1.prisma.file.findFirst({ where: { id: fileId, status: 'DELETED' } });
        if (!file)
            throw Object.assign(new Error('File not found in recycle bin'), { statusCode: 404 });
        return database_1.prisma.file.update({
            where: { id: fileId },
            data: { status: 'ACTIVE', deletedAt: null },
        });
    }
    async permanentDeleteFile(fileId, userId) {
        const file = await database_1.prisma.file.findFirst({ where: { id: fileId } });
        if (!file)
            throw Object.assign(new Error('File not found'), { statusCode: 404 });
        await storage_service_1.storageService.deleteFile(file.storagePath, file.thumbnailPath);
        const versions = await database_1.prisma.fileVersion.findMany({ where: { fileId } });
        for (const v of versions) {
            await storage_service_1.storageService.deleteFile(v.storagePath).catch(() => { });
        }
        await database_1.prisma.file.delete({ where: { id: fileId } });
        if (file.workspaceId) {
            await database_1.prisma.workspace.update({
                where: { id: file.workspaceId },
                data: { storageUsed: { decrement: file.size } },
            });
        }
        await database_1.prisma.user.update({
            where: { id: file.uploadedById },
            data: { storageUsed: { decrement: file.size } },
        });
        await search_service_1.searchService.removeFile(fileId);
    }
    async listFiles(userId, query) {
        const { skip, take, page, limit } = (0, paginate_1.parsePagination)(query);
        const where = {
            ...(query.deleted ? { status: 'DELETED' } : { status: 'ACTIVE' }),
            ...(query.workspaceId ? { workspaceId: query.workspaceId } : {}),
            ...(query.folderId !== undefined ? { folderId: query.folderId } : {}),
            ...(query.mimeType ? { mimeType: { contains: query.mimeType } } : {}),
            ...(query.starred ? { isStarred: true } : {}),
            ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
        };
        const [items, total] = await Promise.all([
            database_1.prisma.file.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    uploadedBy: { select: { id: true, name: true, avatar: true } },
                    tags: true,
                },
            }),
            database_1.prisma.file.count({ where }),
        ]);
        return { items, meta: (0, paginate_1.buildMeta)(total, page, limit) };
    }
    async toggleStar(fileId, userId) {
        const file = await this.getFile(fileId, userId);
        return database_1.prisma.file.update({
            where: { id: fileId },
            data: { isStarred: !file.isStarred },
        });
    }
    async bulkOperation(userId, input) {
        let processed = 0;
        for (const fileId of input.fileIds) {
            try {
                switch (input.operation) {
                    case 'delete':
                        await this.softDeleteFile(fileId, userId);
                        break;
                    case 'move':
                        if (input.targetFolderId !== undefined) {
                            await database_1.prisma.file.update({
                                where: { id: fileId },
                                data: { folderId: input.targetFolderId },
                            });
                        }
                        break;
                    case 'copy':
                        await this.copyFile(fileId, userId, input.targetFolderId);
                        break;
                    case 'star':
                        await database_1.prisma.file.update({ where: { id: fileId }, data: { isStarred: true } });
                        break;
                    case 'tag':
                        if (input.tagIds?.length) {
                            await database_1.prisma.file.update({
                                where: { id: fileId },
                                data: { tags: { connect: input.tagIds.map((id) => ({ id })) } },
                            });
                        }
                        break;
                }
                processed++;
            }
            catch (err) {
                logger_1.logger.warn('Bulk operation failed for file', { fileId, operation: input.operation, err });
            }
        }
        return { processed };
    }
    async copyFile(fileId, userId, targetFolderId) {
        const original = await this.getFile(fileId, userId);
        return database_1.prisma.file.create({
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
    async getRecycleBin(userId, query) {
        const { skip, take, page, limit } = (0, paginate_1.parsePagination)(query);
        const [items, total] = await Promise.all([
            database_1.prisma.file.findMany({
                where: { uploadedById: userId, status: 'DELETED' },
                skip,
                take,
                orderBy: { deletedAt: 'desc' },
                include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
            }),
            database_1.prisma.file.count({ where: { uploadedById: userId, status: 'DELETED' } }),
        ]);
        return { items, meta: (0, paginate_1.buildMeta)(total, page, limit) };
    }
}
exports.FileService = FileService;
exports.fileService = new FileService();
//# sourceMappingURL=file.service.js.map