import { Router } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';
import { credentialService } from '../services/credential.service';
import { createConnector, getConnectorInstance, setConnectorInstance } from '../connectors/connector.registry';
import { getSyncQueue } from '../jobs/queue';
import { apiResponse, apiError, parsePagination, buildMeta } from '../utils/paginate';
import type { AuthRequest } from '../middleware/auth.middleware';
import { BaseConnectorSchema } from '@hybridshare/shared/schemas/connector.schema';
import type { ConnectorType } from '@hybridshare/shared/types/connector';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { workspaceId } = req.query as { workspaceId?: string };
    const connectors = await prisma.connector.findMany({
      where: {
        createdById: req.user!.id,
        ...(workspaceId ? { workspaceId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { syncLogs: true } } },
    });
    res.status(200).json(apiResponse(connectors));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { credentials, ...rest } = req.body as Record<string, unknown>;
    const input = BaseConnectorSchema.parse(rest);

    const typeMap: Record<string, string> = {
      GOOGLE_DRIVE: 'CLOUD', DROPBOX: 'CLOUD', ONEDRIVE: 'CLOUD', BOX: 'CLOUD', S3: 'CLOUD', SFTP: 'CLOUD',
      POSTGRES: 'DATABASE', MYSQL: 'DATABASE', MONGODB: 'DATABASE', SQLITE: 'DATABASE', MSSQL: 'DATABASE', REDIS_DB: 'DATABASE',
      HUBSPOT: 'CRM', ZOHO: 'CRM', SALESFORCE: 'CRM', NOTION: 'CRM', AIRTABLE: 'CRM', GOOGLE_SHEETS: 'CRM',
      REST_API: 'CUSTOM', GRAPHQL: 'CUSTOM', WEBHOOK: 'CUSTOM', CSV: 'CUSTOM',
    };

    const connector = await prisma.connector.create({
      data: {
        ...input,
        category: typeMap[input.type] as never ?? 'CUSTOM',
        status: 'PENDING',
        createdById: req.user!.id,
      },
    });

    if (credentials && typeof credentials === 'object') {
      await credentialService.store(connector.id, credentials as Record<string, unknown>);
    }

    res.status(201).json(apiResponse(connector));
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    res.status(error.statusCode ?? 400).json(apiError(error.message));
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const connector = await prisma.connector.findFirst({
      where: { id: req.params.id, createdById: req.user!.id },
      include: { syncLogs: { orderBy: { startedAt: 'desc' }, take: 5 } },
    });
    if (!connector) {
      res.status(404).json(apiError('Connector not found'));
      return;
    }
    res.status(200).json(apiResponse(connector));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { credentials, ...rest } = req.body as Record<string, unknown>;
    const connector = await prisma.connector.update({
      where: { id: req.params.id },
      data: rest as never,
    });
    if (credentials && typeof credentials === 'object') {
      await credentialService.store(req.params.id, credentials as Record<string, unknown>);
    }
    res.status(200).json(apiResponse(connector));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await credentialService.delete(req.params.id).catch(() => {});
    await prisma.connector.deleteMany({ where: { id: req.params.id, createdById: req.user!.id } });
    res.status(200).json(apiResponse({ message: 'Connector removed' }));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.post('/:id/test', async (req: AuthRequest, res) => {
  try {
    const connector = await prisma.connector.findFirst({ where: { id: req.params.id } });
    if (!connector) {
      res.status(404).json(apiError('Connector not found'));
      return;
    }
    const instance = createConnector(connector.type as ConnectorType);
    const credentials = await credentialService.retrieve(req.params.id);
    await instance.connect(credentials);
    const health = await instance.testConnection();
    await instance.disconnect();

    await prisma.connector.update({
      where: { id: req.params.id },
      data: { status: health.healthy ? 'CONNECTED' : 'ERROR', errorMessage: health.healthy ? null : health.message },
    });

    res.status(200).json(apiResponse(health));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.post('/:id/sync', async (req: AuthRequest, res) => {
  try {
    const queue = getSyncQueue();
    await queue.add('sync', { connectorId: req.params.id }, { attempts: 3 });
    res.status(200).json(apiResponse({ message: 'Sync job queued' }));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.get('/:id/sync-log', async (req: AuthRequest, res) => {
  try {
    const { skip, take, page, limit } = parsePagination({ page: 1, limit: 20 });
    const [items, total] = await Promise.all([
      prisma.connectorSyncLog.findMany({
        where: { connectorId: req.params.id },
        skip,
        take,
        orderBy: { startedAt: 'desc' },
      }),
      prisma.connectorSyncLog.count({ where: { connectorId: req.params.id } }),
    ]);
    res.status(200).json({ success: true, data: items, error: null, meta: buildMeta(total, page, limit) });
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.post('/:id/credentials/rotate', async (req: AuthRequest, res) => {
  try {
    const { credentials } = req.body as { credentials: Record<string, unknown> };
    await credentialService.rotate(req.params.id, credentials);
    res.status(200).json(apiResponse({ message: 'Credentials rotated' }));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

export { router as connectorRouter };
