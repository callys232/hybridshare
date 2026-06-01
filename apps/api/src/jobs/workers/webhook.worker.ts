/**
 * webhook.worker.ts
 * Delivers outbound webhooks to customer-configured endpoints.
 * Implements retry with exponential backoff, HMAC signing, and delivery logging.
 */
import { Worker, Job } from 'bullmq';
import { logger } from '../../utils/logger';
import { getPrisma } from '../../config/database';
import crypto from 'crypto';

const prisma = getPrisma();

interface WebhookJobData {
  webhookId: string;
  eventType: string;
  payload: Record<string, unknown>;
  attempt?: number;
}

export const webhookWorker = new Worker<WebhookJobData>(
  'webhook',
  async (job: Job<WebhookJobData>) => {
    const { webhookId, eventType, payload } = job.data;

    const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook || !webhook.isActive) {
      logger.info('Webhook skipped (inactive)', { webhookId });
      return;
    }

    const body = JSON.stringify({
      id: crypto.randomUUID(),
      type: eventType,
      created: Math.floor(Date.now() / 1000),
      data: payload,
    });

    const signature = `sha256=${crypto.createHmac('sha256', webhook.secret).update(body).digest('hex')}`;
    const startTime = Date.now();

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-HybridShare-Signature': signature,
          'X-HybridShare-Event': eventType,
          'X-HybridShare-Delivery': job.id ?? crypto.randomUUID(),
          'User-Agent': 'HybridShare-Webhook/1.0',
        },
        body,
        signal: AbortSignal.timeout(30000),
      });

      const durationMs = Date.now() - startTime;

      // Log delivery
      await prisma.webhookDelivery.create({
        data: {
          webhookId,
          eventType,
          payload: body,
          statusCode: response.status,
          responseBody: await response.text().catch(() => ''),
          durationMs,
          success: response.ok,
          attemptNumber: job.attemptsMade + 1,
        },
      });

      if (!response.ok) {
        // Update failure count
        await prisma.webhook.update({
          where: { id: webhookId },
          data: {
            failureCount: { increment: 1 },
            lastTriggeredAt: new Date(),
          },
        });

        // Disable after 10 consecutive failures
        if (webhook.failureCount >= 9) {
          await prisma.webhook.update({ where: { id: webhookId }, data: { isActive: false } });
          logger.warn('Webhook disabled after repeated failures', { webhookId, url: webhook.url });
        }

        throw new Error(`Webhook returned ${response.status}`);
      }

      // Success — reset failure count
      await prisma.webhook.update({
        where: { id: webhookId },
        data: { failureCount: 0, lastTriggeredAt: new Date() },
      });

      logger.info('Webhook delivered', { webhookId, eventType, status: response.status, durationMs });
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      if (err instanceof Error && err.name !== 'Error') {
        // Network error
        await prisma.webhookDelivery.create({
          data: {
            webhookId, eventType, payload: body,
            statusCode: 0,
            responseBody: err.message,
            durationMs,
            success: false,
            attemptNumber: job.attemptsMade + 1,
          },
        }).catch(() => {});
      }
      throw err; // BullMQ will retry
    }
  },
  {
    connection: { host: 'localhost', port: 6379 },
    concurrency: 10,
  }
);

/**
 * Dispatch a webhook event to all matching org webhooks.
 */
export async function dispatchWebhookEvent(
  organizationId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const webhooks = await prisma.webhook.findMany({
    where: {
      organizationId,
      isActive: true,
      events: { has: eventType },
    },
  });

  const { getWebhookQueue, scheduleJob } = await import('../queue');
  const queue = getWebhookQueue();

  for (const webhook of webhooks) {
    await scheduleJob(queue, 'deliver', { webhookId: webhook.id, eventType, payload });
  }
}

webhookWorker.on('failed', (job, err) => {
  logger.error('Webhook delivery failed', { jobId: job?.id, err: err.message });
});
