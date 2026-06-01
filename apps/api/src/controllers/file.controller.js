"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileController = exports.FileController = void 0;
const file_service_1 = require("../services/file.service");
const version_service_1 = require("../services/version.service");
const paginate_1 = require("../utils/paginate");
const file_schema_1 = require("@hybridshare/shared/schemas/file.schema");
class FileController {
    async upload(req, res) {
        try {
            if (!req.file) {
                res.status(400).json((0, paginate_1.apiError)('No file provided'));
                return;
            }
            const { workspaceId, folderId, description, tags } = req.body;
            const file = await file_service_1.fileService.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, req.user.id, {
                workspaceId: workspaceId || undefined,
                folderId: folderId || undefined,
                description: description || undefined,
                tags: tags ? JSON.parse(tags) : undefined,
            });
            res.status(201).json((0, paginate_1.apiResponse)(file));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async getFile(req, res) {
        try {
            const file = await file_service_1.fileService.getFile(req.params.id, req.user.id);
            res.status(200).json((0, paginate_1.apiResponse)(file));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async download(req, res) {
        try {
            const url = await file_service_1.fileService.getDownloadUrl(req.params.id, req.user.id);
            res.status(200).json((0, paginate_1.apiResponse)({ url }));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async preview(req, res) {
        try {
            const result = await file_service_1.fileService.getPreviewUrl(req.params.id, req.user.id);
            res.status(200).json((0, paginate_1.apiResponse)(result));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async updateFile(req, res) {
        try {
            const input = file_schema_1.UpdateFileSchema.parse(req.body);
            const file = await file_service_1.fileService.updateFile(req.params.id, req.user.id, input);
            res.status(200).json((0, paginate_1.apiResponse)(file));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async deleteFile(req, res) {
        try {
            await file_service_1.fileService.softDeleteFile(req.params.id, req.user.id);
            res.status(200).json((0, paginate_1.apiResponse)({ message: 'File moved to recycle bin' }));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async restoreFile(req, res) {
        try {
            const file = await file_service_1.fileService.restoreFile(req.params.id, req.user.id);
            res.status(200).json((0, paginate_1.apiResponse)(file));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async permanentDelete(req, res) {
        try {
            await file_service_1.fileService.permanentDeleteFile(req.params.id, req.user.id);
            res.status(200).json((0, paginate_1.apiResponse)({ message: 'File permanently deleted' }));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async listFiles(req, res) {
        try {
            const query = req.query;
            const result = await file_service_1.fileService.listFiles(req.user.id, {
                page: parseInt(query.page ?? '1'),
                limit: parseInt(query.limit ?? '20'),
                workspaceId: query.workspaceId,
                folderId: query.folderId,
                mimeType: query.mimeType,
                search: query.search,
                starred: query.starred === 'true',
                deleted: query.deleted === 'true',
            });
            res.status(200).json({ success: true, data: result.items, error: null, meta: result.meta });
        }
        catch (err) {
            const error = err;
            res.status(500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async toggleStar(req, res) {
        try {
            const file = await file_service_1.fileService.toggleStar(req.params.id, req.user.id);
            res.status(200).json((0, paginate_1.apiResponse)(file));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async bulkOperation(req, res) {
        try {
            const input = file_schema_1.BulkOperationSchema.parse(req.body);
            const result = await file_service_1.fileService.bulkOperation(req.user.id, input);
            res.status(200).json((0, paginate_1.apiResponse)(result));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async recycleBin(req, res) {
        try {
            const query = req.query;
            const result = await file_service_1.fileService.getRecycleBin(req.user.id, {
                page: parseInt(query.page ?? '1'),
                limit: parseInt(query.limit ?? '20'),
            });
            res.status(200).json({ success: true, data: result.items, error: null, meta: result.meta });
        }
        catch (err) {
            const error = err;
            res.status(500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async listVersions(req, res) {
        try {
            const versions = await version_service_1.versionService.listVersions(req.params.id);
            res.status(200).json((0, paginate_1.apiResponse)(versions));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async uploadVersion(req, res) {
        try {
            if (!req.file) {
                res.status(400).json((0, paginate_1.apiError)('No file provided'));
                return;
            }
            const { comment } = req.body;
            const version = await version_service_1.versionService.uploadVersion(req.params.id, req.file.buffer, req.file.originalname, req.file.mimetype, req.user.id, comment);
            res.status(201).json((0, paginate_1.apiResponse)(version));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async restoreVersion(req, res) {
        try {
            const file = await version_service_1.versionService.restoreVersion(req.params.id, req.params.versionId, req.user.id);
            res.status(200).json((0, paginate_1.apiResponse)(file));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
}
exports.FileController = FileController;
exports.fileController = new FileController();
//# sourceMappingURL=file.controller.js.map