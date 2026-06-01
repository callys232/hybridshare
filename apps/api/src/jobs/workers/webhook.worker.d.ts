/**
 * webhook.worker.ts
 * Delivers outbound webhooks to customer-configured endpoints.
 * Implements retry with exponential backoff, HMAC signing, and delivery logging.
 */
import { Worker } from 'bullmq';
interface WebhookJobData {
    webhookId: string;
    eventType: string;
    payload: Record<string, unknown>;
    attempt?: number;
}
export declare const webhookWorker: Worker<WebhookJobData, any, string>;
/**
 * Dispatch a webhook event to all matching org webhooks.
 */
export declare function dispatchWebhookEvent(organizationId: string, eventType: string, payload: Record<string, unknown>): Promise<void>;
export {};
//# sourceMappingURL=webhook.worker.d.ts.map