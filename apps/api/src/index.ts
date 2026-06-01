import { createServer } from 'http';
import { app } from './app';
import { connectDatabase } from './config/database';
import { getRedis } from './config/redis';
import { initializeMinio } from './config/minio';
import { initializeMeilisearch } from './config/meilisearch';
import { initializeSocket } from './config/socket';
import { initializeQueues } from './jobs/queue';
import { env } from './config/env';
import { logger } from './utils/logger';

const httpServer = createServer(app);

async function bootstrap(): Promise<void> {
  logger.info('Starting HybridShare API server...');

  await connectDatabase();

  getRedis();

  await initializeMinio().catch((err) => {
    logger.warn('MinIO initialization failed — continuing without storage', { err });
  });

  await initializeMeilisearch().catch((err) => {
    logger.warn('Meilisearch initialization failed — search may be unavailable', { err });
  });

  initializeSocket(httpServer);

  await initializeQueues().catch((err) => {
    logger.warn('Queue initialization failed', { err });
  });

  httpServer.listen(env.PORT, () => {
    logger.info(`HybridShare API running on port ${env.PORT}`, {
      env: env.NODE_ENV,
      port: env.PORT,
      appUrl: env.APP_URL,
    });
  });
}

async function shutdown(): Promise<void> {
  logger.info('Shutting down gracefully...');

  httpServer.close(async () => {
    const { disconnectDatabase } = await import('./config/database');
    await disconnectDatabase();
    logger.info('Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

bootstrap().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});
