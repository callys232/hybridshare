"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookWorker = void 0;
exports.dispatchWebhookEvent = dispatchWebhookEvent;
/**
 * webhook.worker.ts
 * Delivers outbound webhooks to customer-configured endpoints.
 * Implements retry with exponential backoff, HMAC signing, and delivery logging.
 */
const bullmq_1 = require("bullmq");
const logger_1 = require("../../utils/logger");
const database_1 = require("../../config/database");
const crypto_1 = __importDefault(require("crypto"));
const prisma = (0, database_1.getPrisma)();
exports.webhookWorker = new bullmq_1.Worker('webhook', async (job) => {
    const { webhookId, eventType, payload } = job.data;
    const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook || !webhook.isActive) {
        logger_1.logger.info('Webhook skipped (inactive)', { webhookId });
        return;
    }
    const body = JSON.stringify({
        id: crypto_1.default.randomUUID(),
        type: eventType,
        created: Math.floor(Date.now() / 1000),
        data: payload,
    });
    const signature = `sha256=${crypto_1.default.createHmac('sha256', webhook.secret).update(body).digest('hex')}`;
    const startTime = Date.now();
    try {
        const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-HybridShare-Signature': signature,
                'X-HybridShare-Event': eventType,
                'X-HybridShare-Delivery': job.id ?? crypto_1.default.randomUUID(),
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
                logger_1.logger.warn('Webhook disabled after repeated failures', { webhookId, url: webhook.url });
            }
            throw new Error(`Webhook returned ${response.status}`);
        }
        // Success — reset failure count
        await prisma.webhook.update({
            where: { id: webhookId },
            data: { failureCount: 0, lastTriggeredAt: new Date() },
        });
        logger_1.logger.info('Webhook delivered', { webhookId, eventType, status: response.status, durationMs });
    }
    catch (err) {
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
            }).catch(() => { });
        }
        throw err; // BullMQ will retry
    }
}, {
    connection: { host: 'localhost', port: 6379 },
    concurrency: 10,
});
/**
 * Dispatch a webhook event to all matching org webhooks.
 */
async function dispatchWebhookEvent(organizationId, eventType, payload) {
    const webhooks = await prisma.webhook.findMany({
        where: {
            organizationId,
            isActive: true,
            events: { has: eventType },
        },
    });
    const { getWebhookQueue, scheduleJob } = await Promise.resolve().then(() => __importStar(require('../queue')));
    const queue = getWebhookQueue();
    for (const webhook of webhooks) {
        await scheduleJob(queue, 'deliver', { webhookId: webhook.id, eventType, payload });
    }
}
exports.webhookWorker.on('failed', (job, err) => {
    logger_1.logger.error('Webhook delivery failed', { jobId: job?.id, err: err.message });
});
//# sourceMappingURL=webhook.worker.js.map