import { Worker } from 'bullmq';
import { prisma } from '../../config/database';
import { createConnector, getConnectorInstance, setConnectorInstance } from '../../connectors/connector.registry';
import { credentialService } from '../../services/credential.service';
import { searchService } from '../../services/search.service';
import { emitToWorkspace } from '../../config/socket';
import { logger } from '../../utils/logger';
import type { ConnectorType } from '@hybridshare/shared/types/connector';

export const syncWorker = new Worker(
  'sync',
  async (job) => {
    const { connectorId } = job.data as { connectorId: string };

    const connector = await prisma.connector.findUnique({ where: { id: connectorId } });
    if (!connector || !connector.isEnabled) {
      logger.warn('Connector not found or disabled', { connectorId });
      return;
    }

    const syncLog = await prisma.connectorSyncLog.create({
      data: { connectorId, status: 'running' },
    });

    await prisma.connector.update({
      where: { id: connectorId },
      data: { status: 'SYNCING' },
    });

    let instance = getConnectorInstance(connectorId);

    if (!instance) {
      instance = createConnector(connector.type as ConnectorType);
      const credentials = await credentialService.retrieve(connectorId);
      await instance.connect(credentials);
      setConnectorInstance(connectorId, instance);
    }

    let assetsAdded = 0;
    let assetsUpdated = 0;
    let assetsDeleted = 0;

    try {
      const lastSync = connector.lastSyncAt ?? new Date(0);
      const changes = await instance.getChanges(lastSync);

      for (const change of changes) {
        if (change.changeType === 'deleted') {
          await prisma.uDCAsset.deleteMany({
            where: { connectorId, externalId: change.externalId },
          });
          assetsDeleted++;
        } else if (change.asset) {
          await prisma.uDCAsset.upsert({
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

          if (change.changeType === 'created') assetsAdded++;
          else assetsUpdated++;
        }
      }

      await prisma.$transaction([
        prisma.connectorSyncLog.update({
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
        prisma.connector.update({
          where: { id: connectorId },
          data: {
            status: 'CONNECTED',
            lastSyncAt: new Date(),
            errorMessage: null,
          },
        }),
      ]);

      if (connector.workspaceId) {
        emitToWorkspace(connector.workspaceId, 'connector:synced', {
          connectorId,
          assetsAdded,
          assetsUpdated,
        });
      }

      logger.info('Connector sync complete', { connectorId, assetsAdded, assetsUpdated, assetsDeleted });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';

      await prisma.$transaction([
        prisma.connectorSyncLog.update({
          where: { id: syncLog.id },
          data: { status: 'failed', completedAt: new Date(), errorMessage },
        }),
        prisma.connector.update({
          where: { id: connectorId },
          data: { status: 'ERROR', errorMessage },
        }),
      ]);

      if (connector.workspaceId) {
        emitToWorkspace(connector.workspaceId, 'connector:error', { connectorId, error: errorMessage });
      }

      throw err;
    }
  },
  {
    connection: { host: 'localhost', port: 6379 },
    concurrency: 3,
  }
);

syncWorker.on('failed', (job, err) => {
  logger.error('Sync job failed', { jobId: job?.id, error: err.message });
});
