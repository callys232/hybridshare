"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetRouter = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middleware/auth.middleware");
const credential_service_1 = require("../services/credential.service");
const storage_service_1 = require("../services/storage.service");
const connector_registry_1 = require("../connectors/connector.registry");
const paginate_1 = require("../utils/paginate");
const router = (0, express_1.Router)();
exports.assetRouter = router;
router.use(auth_middleware_1.authMiddleware);
router.get('/', async (req, res) => {
    try {
        const { connectorId, type, q } = req.query;
        const { skip, take, page, limit } = (0, paginate_1.parsePagination)({ page: 1, limit: 50 });
        const where = {
            ...(connectorId ? { connectorId } : {}),
            ...(type ? { type } : {}),
            ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
        };
        const [items, total] = await Promise.all([
            database_1.prisma.uDCAsset.findMany({ where, skip, take, orderBy: { updatedAt: 'desc' } }),
            database_1.prisma.uDCAsset.count({ where }),
        ]);
        res.status(200).json({ success: true, data: items, error: null, meta: (0, paginate_1.buildMeta)(total, page, limit) });
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.get('/:id', async (req, res) => {
    try {
        const asset = await database_1.prisma.uDCAsset.findUnique({ where: { id: req.params.id } });
        if (!asset) {
            res.status(404).json((0, paginate_1.apiError)('Asset not found'));
            return;
        }
        res.status(200).json((0, paginate_1.apiResponse)(asset));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.get('/:id/preview', async (req, res) => {
    try {
        const asset = await database_1.prisma.uDCAsset.findUnique({ where: { id: req.params.id } });
        if (!asset) {
            res.status(404).json((0, paginate_1.apiError)('Asset not found'));
            return;
        }
        if (asset.url) {
            res.status(200).json((0, paginate_1.apiResponse)({ url: asset.url }));
            return;
        }
        res.status(404).json((0, paginate_1.apiError)('No preview available'));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.get('/:id/download', async (req, res) => {
    try {
        const asset = await database_1.prisma.uDCAsset.findUnique({ where: { id: req.params.id } });
        if (!asset) {
            res.status(404).json((0, paginate_1.apiError)('Asset not found'));
            return;
        }
        const connector = await database_1.prisma.connector.findUnique({ where: { id: asset.connectorId } });
        if (!connector) {
            res.status(404).json((0, paginate_1.apiError)('Connector not found'));
            return;
        }
        const instance = (0, connector_registry_1.createConnector)(connector.type);
        const credentials = await credential_service_1.credentialService.retrieve(asset.connectorId);
        await instance.connect(credentials);
        const content = await instance.fetchContent(asset.externalId);
        await instance.disconnect();
        res.setHeader('Content-Disposition', `attachment; filename="${asset.name}"`);
        res.setHeader('Content-Type', asset.mimeType ?? 'application/octet-stream');
        res.send(content);
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.post('/:id/import', async (req, res) => {
    try {
        const asset = await database_1.prisma.uDCAsset.findUnique({ where: { id: req.params.id } });
        if (!asset) {
            res.status(404).json((0, paginate_1.apiError)('Asset not found'));
            return;
        }
        const connector = await database_1.prisma.connector.findUnique({ where: { id: asset.connectorId } });
        if (!connector) {
            res.status(404).json((0, paginate_1.apiError)('Connector not found'));
            return;
        }
        const instance = (0, connector_registry_1.createConnector)(connector.type);
        const credentials = await credential_service_1.credentialService.retrieve(asset.connectorId);
        await instance.connect(credentials);
        const content = await instance.fetchContent(asset.externalId);
        await instance.disconnect();
        const uploadResult = await storage_service_1.storageService.uploadFile(content, asset.name, asset.mimeType ?? 'application/octet-stream', req.user.id);
        const file = await database_1.prisma.file.create({
            data: {
                name: asset.name,
                originalName: asset.name,
                mimeType: asset.mimeType ?? 'application/octet-stream',
                size: BigInt(content.length),
                extension: storage_service_1.storageService.getFileExtension(asset.name),
                storagePath: uploadResult.storagePath,
                thumbnailPath: uploadResult.thumbnailPath,
                checksum: uploadResult.checksum,
                uploadedById: req.user.id,
                description: `Imported from connector: ${connector.name}`,
            },
        });
        await database_1.prisma.uDCAsset.update({
            where: { id: req.params.id },
            data: { isImported: true, importedFileId: file.id },
        });
        res.status(201).json((0, paginate_1.apiResponse)({ file, asset }));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.post('/:id/snapshot', async (req, res) => {
    try {
        const asset = await database_1.prisma.uDCAsset.findUnique({ where: { id: req.params.id } });
        if (!asset) {
            res.status(404).json((0, paginate_1.apiError)('Asset not found'));
            return;
        }
        await database_1.prisma.uDCAudit.create({
            data: {
                assetId: req.params.id,
                connectorId: asset.connectorId,
                action: 'snapshot',
                userId: req.user.id,
                metadata: { timestamp: new Date().toISOString() },
            },
        });
        res.status(200).json((0, paginate_1.apiResponse)({ message: 'Snapshot recorded' }));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.post('/:id/tag', async (req, res) => {
    try {
        const { tags } = req.body;
        const asset = await database_1.prisma.uDCAsset.update({
            where: { id: req.params.id },
            data: { tags },
        });
        res.status(200).json((0, paginate_1.apiResponse)(asset));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
//# sourceMappingURL=asset.routes.js.map