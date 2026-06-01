import { Queue } from 'bullmq';
export declare function getSyncQueue(): Queue;
export declare function getEmailQueue(): Queue;
export declare function getSocialQueue(): Queue;
export declare function getReportQueue(): Queue;
export declare function getFileProcessorQueue(): Queue;
export declare function getNotificationQueue(): Queue;
export declare function getCertificateQueue(): Queue;
export declare function getAIQueue(): Queue;
export declare function getWebhookQueue(): Queue;
export declare function initializeQueues(): Promise<void>;
export declare function scheduleJob(queue: Queue, jobName: string, data: Record<string, unknown>, options?: {
    delay?: number;
    repeat?: {
        cron: string;
    };
}): Promise<void>;
//# sourceMappingURL=queue.d.ts.map