"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadVersionSchema = exports.VerifySharePasswordSchema = exports.CreateShareLinkSchema = exports.BulkOperationSchema = exports.UpdateFileSchema = exports.MoveFolderSchema = exports.RenameFolderSchema = exports.CreateFolderSchema = void 0;
const zod_1 = require("zod");
exports.CreateFolderSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    parentId: zod_1.z.string().uuid().nullable().optional(),
    workspaceId: zod_1.z.string().uuid().nullable().optional(),
});
exports.RenameFolderSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
});
exports.MoveFolderSchema = zod_1.z.object({
    parentId: zod_1.z.string().uuid().nullable(),
});
exports.UpdateFileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255).optional(),
    description: zod_1.z.string().max(1000).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    folderId: zod_1.z.string().uuid().nullable().optional(),
});
exports.BulkOperationSchema = zod_1.z.object({
    fileIds: zod_1.z.array(zod_1.z.string().uuid()).min(1),
    operation: zod_1.z.enum(['move', 'copy', 'delete', 'tag', 'star']),
    targetFolderId: zod_1.z.string().uuid().nullable().optional(),
    tagIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
});
exports.CreateShareLinkSchema = zod_1.z.object({
    fileId: zod_1.z.string().uuid().nullable().optional(),
    folderId: zod_1.z.string().uuid().nullable().optional(),
    workspaceId: zod_1.z.string().uuid().nullable().optional(),
    permissions: zod_1.z.array(zod_1.z.enum(['VIEW', 'DOWNLOAD', 'COMMENT', 'EDIT'])).default(['VIEW', 'DOWNLOAD']),
    password: zod_1.z.string().min(4).max(100).optional(),
    expiresAt: zod_1.z.string().datetime().nullable().optional(),
    maxViews: zod_1.z.number().int().positive().nullable().optional(),
});
exports.VerifySharePasswordSchema = zod_1.z.object({
    password: zod_1.z.string().min(1),
});
exports.UploadVersionSchema = zod_1.z.object({
    comment: zod_1.z.string().max(500).optional(),
});
//# sourceMappingURL=file.schema.js.map