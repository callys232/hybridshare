"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncWorker = void 0;
const bullmq_1 = require("bullmq");
const database_1 = require("../../config/database");
const connector_registry_1 = require("../../connectors/connector.registry");
const credential_service_1 = require("../../services/credential.service");
const socket_1 = require("../../config/socket");
const logger_1 = require("../../utils/logger");
exports.syncWorker = new bullmq_1.Worker('sync', async (job) => {
    const { connectorId } = job.data;
    const connector = await database_1.prisma.connector.findUnique({ where: { id: connectorId } });
    if (!connector || !connector.isEnabled) {
        logger_1.logger.warn('Connector not found or disabled', { connectorId });
        return;
    }
    const syncLog = await database_1.prisma.connectorSyncLog.create({
        data: { connectorId, status: 'running' },
    });
    await database_1.prisma.connector.update({
        where: { id: connectorId },
        data: { status: 'SYNCING' },
    });
    let instance = (0, connector_registry_1.getConnectorInstance)(connectorId);
    if (!instance) {
        instance = (0, connector_registry_1.createConnector)(connector.type);
        const credentials = await credential_service_1.credentialService.retrieve(connectorId);
        await instance.connect(credentials);
        (0, connector_registry_1.setConnectorInstance)(connectorId, instance);
    }
    let assetsAdded = 0;
    let assetsUpdated = 0;
    let assetsDeleted = 0;
    try {
        const lastSync = connector.lastSyncAt ?? new Date(0);
        const changes = await instance.getChanges(lastSync);
        for (const change of changes) {
            if (change.changeType === 'deleted') {
                await database_1.prisma.uDCAsset.deleteMany({
                    where: { connectorId, externalId: change.externalId },
                });
                assetsDeleted++;
            }
            else if (change.asset) {
                await database_1.prisma.uDCAsset.upsert({
                    where: { connectorId_externalId: { connectorId, externalId: change.externalId } },
                    create: {
                        connectorId,
                        externalId: change.externalId,
                        name: change.asset.name,
                        type: change.asset.type,
                        mimeType: change.asset.mimeType,
                        size: change.asset.size ? BigInt(change.asset.size) : null,
                        path: change.asset.path,
                        url: change.asset.url,
                        thumbnailUrl: change.asset.thumbnailUrl,
                        metadata: change.asset.metadata,
                        tags: change.asset.tags,
                        updatedAt: change.changedAt,
                    },
                    update: {
                        name: change.asset.name,
                        url: change.asset.url,
                        metadata: change.asset.metadata,
                        updatedAt: change.changedAt,
                    },
                });
                if (change.changeType === 'created')
                    assetsAdded++;
                else
                    assetsUpdated++;
            }
        }
        await database_1.prisma.$transaction([
            database_1.prisma.connectorSyncLog.update({
                where: { id: syncLog.id },
                data: {
                    status: 'success',
                    completedAt: new Date(),
                    assetsProcessed: changes.length,
                    assetsAdded,
                    assetsUpdated,
                    assetsDeleted,
                },
            }),
            database_1.prisma.connector.update({
                where: { id: connectorId },
                data: {
                    status: 'CONNECTED',
                    lastSyncAt: new Date(),
                    errorMessage: null,
                },
            }),
        ]);
        if (connector.workspaceId) {
            (0, socket_1.emitToWorkspace)(connector.workspaceId, 'connector:synced', {
                connectorId,
                assetsAdded,
                assetsUpdated,
            });
        }
        logger_1.logger.info('Connector sync complete', { connectorId, assetsAdded, assetsUpdated, assetsDeleted });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Sync failed';
        await database_1.prisma.$transaction([
            database_1.prisma.connectorSyncLog.update({
                where: { id: syncLog.id },
                data: { status: 'failed', completedAt: new Date(), errorMessage },
            }),
            database_1.prisma.connector.update({
                where: { id: connectorId },
                data: { status: 'ERROR', errorMessage },
            }),
        ]);
        if (connector.workspaceId) {
            (0, socket_1.emitToWorkspace)(connector.workspaceId, 'connector:error', { connectorId, error: errorMessage });
        }
        throw err;
    }
}, {
    connection: { host: 'localhost', port: 6379 },
    concurrency: 3,
});
exports.syncWorker.on('failed', (job, err) => {
    logger_1.logger.error('Sync job failed', { jobId: job?.id, error: err.message });
});
//# sourceMappingURL=sync.worker.js.map