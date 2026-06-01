"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectorRouter = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middleware/auth.middleware");
const credential_service_1 = require("../services/credential.service");
const connector_registry_1 = require("../connectors/connector.registry");
const queue_1 = require("../jobs/queue");
const paginate_1 = require("../utils/paginate");
const connector_schema_1 = require("@hybridshare/shared/schemas/connector.schema");
const router = (0, express_1.Router)();
exports.connectorRouter = router;
router.use(auth_middleware_1.authMiddleware);
router.get('/', async (req, res) => {
    try {
        const { workspaceId } = req.query;
        const connectors = await database_1.prisma.connector.findMany({
            where: {
                createdById: req.user.id,
                ...(workspaceId ? { workspaceId } : {}),
            },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { syncLogs: true } } },
        });
        res.status(200).json((0, paginate_1.apiResponse)(connectors));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.post('/', async (req, res) => {
    try {
        const { credentials, ...rest } = req.body;
        const input = connector_schema_1.BaseConnectorSchema.parse(rest);
        const typeMap = {
            GOOGLE_DRIVE: 'CLOUD', DROPBOX: 'CLOUD', ONEDRIVE: 'CLOUD', BOX: 'CLOUD', S3: 'CLOUD', SFTP: 'CLOUD',
            POSTGRES: 'DATABASE', MYSQL: 'DATABASE', MONGODB: 'DATABASE', SQLITE: 'DATABASE', MSSQL: 'DATABASE', REDIS_DB: 'DATABASE',
            HUBSPOT: 'CRM', ZOHO: 'CRM', SALESFORCE: 'CRM', NOTION: 'CRM', AIRTABLE: 'CRM', GOOGLE_SHEETS: 'CRM',
            REST_API: 'CUSTOM', GRAPHQL: 'CUSTOM', WEBHOOK: 'CUSTOM', CSV: 'CUSTOM',
        };
        const connector = await database_1.prisma.connector.create({
            data: {
                ...input,
                category: typeMap[input.type] ?? 'CUSTOM',
                status: 'PENDING',
                createdById: req.user.id,
            },
        });
        if (credentials && typeof credentials === 'object') {
            await credential_service_1.credentialService.store(connector.id, credentials);
        }
        res.status(201).json((0, paginate_1.apiResponse)(connector));
    }
    catch (err) {
        const error = err;
        res.status(error.statusCode ?? 400).json((0, paginate_1.apiError)(error.message));
    }
});
router.get('/:id', async (req, res) => {
    try {
        const connector = await database_1.prisma.connector.findFirst({
            where: { id: req.params.id, createdById: req.user.id },
            include: { syncLogs: { orderBy: { startedAt: 'desc' }, take: 5 } },
        });
        if (!connector) {
            res.status(404).json((0, paginate_1.apiError)('Connector not found'));
            return;
        }
        res.status(200).json((0, paginate_1.apiResponse)(connector));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { credentials, ...rest } = req.body;
        const connector = await database_1.prisma.connector.update({
            where: { id: req.params.id },
            data: rest,
        });
        if (credentials && typeof credentials === 'object') {
            await credential_service_1.credentialService.store(req.params.id, credentials);
        }
        res.status(200).json((0, paginate_1.apiResponse)(connector));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.delete('/:id', async (req, res) => {
    try {
        await credential_service_1.credentialService.delete(req.params.id).catch(() => { });
        await database_1.prisma.connector.deleteMany({ where: { id: req.params.id, createdById: req.user.id } });
        res.status(200).json((0, paginate_1.apiResponse)({ message: 'Connector removed' }));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.post('/:id/test', async (req, res) => {
    try {
        const connector = await database_1.prisma.connector.findFirst({ where: { id: req.params.id } });
        if (!connector) {
            res.status(404).json((0, paginate_1.apiError)('Connector not found'));
            return;
        }
        const instance = (0, connector_registry_1.createConnector)(connector.type);
        const credentials = await credential_service_1.credentialService.retrieve(req.params.id);
        await instance.connect(credentials);
        const health = await instance.testConnection();
        await instance.disconnect();
        await database_1.prisma.connector.update({
            where: { id: req.params.id },
            data: { status: health.healthy ? 'CONNECTED' : 'ERROR', errorMessage: health.healthy ? null : health.message },
        });
        res.status(200).json((0, paginate_1.apiResponse)(health));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.post('/:id/sync', async (req, res) => {
    try {
        const queue = (0, queue_1.getSyncQueue)();
        await queue.add('sync', { connectorId: req.params.id }, { attempts: 3 });
        res.status(200).json((0, paginate_1.apiResponse)({ message: 'Sync job queued' }));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.get('/:id/sync-log', async (req, res) => {
    try {
        const { skip, take, page, limit } = (0, paginate_1.parsePagination)({ page: 1, limit: 20 });
        const [items, total] = await Promise.all([
            database_1.prisma.connectorSyncLog.findMany({
                where: { connectorId: req.params.id },
                skip,
                take,
                orderBy: { startedAt: 'desc' },
            }),
            database_1.prisma.connectorSyncLog.count({ where: { connectorId: req.params.id } }),
        ]);
        res.status(200).json({ success: true, data: items, error: null, meta: (0, paginate_1.buildMeta)(total, page, limit) });
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.post('/:id/credentials/rotate', async (req, res) => {
    try {
        const { credentials } = req.body;
        await credential_service_1.credentialService.rotate(req.params.id, credentials);
        res.status(200).json((0, paginate_1.apiResponse)({ message: 'Credentials rotated' }));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
//# sourceMappingURL=connector.routes.js.map