import { Queue, Worker, QueueScheduler, QueueEvents } from 'bullmq';
import { getRedis } from '../config/redis';
import { logger } from '../utils/logger';

const CONNECTION_CONFIG = { connection: { host: 'localhost', port: 6379 } };

let syncQueue: Queue | null = null;
let emailQueue: Queue | null = null;
let socialQueue: Queue | null = null;
let reportQueue: Queue | null = null;
let fileProcessorQueue: Queue | null = null;
let notificationQueue: Queue | null = null;
let certificateQueue: Queue | null = null;
let aiQueue: Queue | null = null;
let webhookQueue: Queue | null = null;

export function getSyncQueue(): Queue {
  if (!syncQueue) syncQueue = new Queue('sync', CONNECTION_CONFIG);
  return syncQueue;
}

export function getEmailQueue(): Queue {
  if (!emailQueue) emailQueue = new Queue('email', CONNECTION_CONFIG);
  return emailQueue;
}

export function getSocialQueue(): Queue {
  if (!socialQueue) socialQueue = new Queue('social', CONNECTION_CONFIG);
  return socialQueue;
}

export function getReportQueue(): Queue {
  if (!reportQueue) reportQueue = new Queue('report', CONNECTION_CONFIG);
  return reportQueue;
}

export function getFileProcessorQueue(): Queue {
  if (!fileProcessorQueue) fileProcessorQueue = new Queue('file-processor', CONNECTION_CONFIG);
  return fileProcessorQueue;
}

export function getNotificationQueue(): Queue {
  if (!notificationQueue) notificationQueue = new Queue('notification', CONNECTION_CONFIG);
  return notificationQueue;
}

export function getCertificateQueue(): Queue {
  if (!certificateQueue) certificateQueue = new Queue('certificate', CONNECTION_CONFIG);
  return certificateQueue;
}

export function getAIQueue(): Queue {
  if (!aiQueue) aiQueue = new Queue('ai', CONNECTION_CONFIG);
  return aiQueue;
}

export function getWebhookQueue(): Queue {
  if (!webhookQueue) webhookQueue = new Queue('webhook', CONNECTION_CONFIG);
  return webhookQueue;
}

export async function initializeQueues(): Promise<void> {
  const queues = [
    getSyncQueue(),
    getEmailQueue(),
    getSocialQueue(),
    getReportQueue(),
    getFileProcessorQueue(),
    getNotificationQueue(),
    getCertificateQueue(),
    getAIQueue(),
    getWebhookQueue(),
  ];

  for (const queue of queues) {
    await queue.waitUntilReady().catch((err) => logger.warn(`Queue ${queue.name} not ready`, { err }));
    logger.info(`Queue initialized: ${queue.name}`);
  }

  await startWorkers();
}

async function startWorkers(): Promise<void> {
  const { syncWorker } = await import('./workers/sync.worker');
  const { emailWorker } = await import('./workers/email.worker');
  const { socialWorker } = await import('./workers/social.worker');
  const { reportWorker } = await import('./workers/report.worker');
  const { certificateWorker } = await import('./workers/certificate.worker');
  const { aiWorker } = await import('./workers/ai.worker');
  const { webhookWorker } = await import('./workers/webhook.worker');

  logger.info('BullMQ workers started', {
    workers: ['sync', 'email', 'social', 'report', 'certificate', 'ai', 'webhook'],
  });
}

export async function scheduleJob(
  queue: Queue,
  jobName: string,
  data: Record<string, unknown>,
  options: { delay?: number; repeat?: { cron: string } } = {}
): Promise<void> {
  await queue.add(jobName, data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
    ...options,
  });
}
