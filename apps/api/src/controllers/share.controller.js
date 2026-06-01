"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shareController = exports.ShareController = void 0;
const share_service_1 = require("../services/share.service");
const paginate_1 = require("../utils/paginate");
const file_schema_1 = require("@hybridshare/shared/schemas/file.schema");
class ShareController {
    async create(req, res) {
        try {
            const input = file_schema_1.CreateShareLinkSchema.parse(req.body);
            const link = await share_service_1.shareService.createShareLink(req.user.id, input);
            res.status(201).json((0, paginate_1.apiResponse)(link));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 400).json((0, paginate_1.apiError)(error.message));
        }
    }
    async list(req, res) {
        try {
            const query = req.query;
            const result = await share_service_1.shareService.listShareLinks(req.user.id, {
                page: parseInt(query.page ?? '1'),
                limit: parseInt(query.limit ?? '20'),
            });
            res.status(200).json({ success: true, data: result.items, error: null, meta: result.meta });
        }
        catch (err) {
            res.status(500).json((0, paginate_1.apiError)(err.message));
        }
    }
    async resolve(req, res) {
        try {
            const link = await share_service_1.shareService.resolveShareLink(req.params.token);
            if (!link.hasPassword) {
                await share_service_1.shareService.recordView(req.params.token, req.ip, req.headers['user-agent'], req.headers.referer);
            }
            res.status(200).json((0, paginate_1.apiResponse)(link));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 404).json((0, paginate_1.apiError)(error.message));
        }
    }
    async listFiles(req, res) {
        try {
            const link = await share_service_1.shareService.resolveShareLink(req.params.token);
            res.status(200).json((0, paginate_1.apiResponse)({ files: link.file ? [link.file] : [], folder: link.folder }));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 404).json((0, paginate_1.apiError)(error.message));
        }
    }
    async verifyPassword(req, res) {
        try {
            const { password } = req.body;
            await share_service_1.shareService.verifySharePassword(req.params.token, password);
            await share_service_1.shareService.recordView(req.params.token, req.ip, req.headers['user-agent']);
            res.status(200).json((0, paginate_1.apiResponse)({ verified: true }));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 401).json((0, paginate_1.apiError)(error.message));
        }
    }
    async revoke(req, res) {
        try {
            await share_service_1.shareService.revokeShareLink(req.params.id, req.user.id);
            res.status(200).json((0, paginate_1.apiResponse)({ message: 'Share link revoked' }));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async getAnalytics(req, res) {
        try {
            const analytics = await share_service_1.shareService.getShareAnalytics(req.params.id, req.user.id);
            res.status(200).json((0, paginate_1.apiResponse)(analytics));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
}
exports.ShareController = ShareController;
exports.shareController = new ShareController();
//# sourceMappingURL=share.controller.js.map