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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSyncQueue = getSyncQueue;
exports.getEmailQueue = getEmailQueue;
exports.getSocialQueue = getSocialQueue;
exports.getReportQueue = getReportQueue;
exports.getFileProcessorQueue = getFileProcessorQueue;
exports.getNotificationQueue = getNotificationQueue;
exports.getCertificateQueue = getCertificateQueue;
exports.getAIQueue = getAIQueue;
exports.getWebhookQueue = getWebhookQueue;
exports.initializeQueues = initializeQueues;
exports.scheduleJob = scheduleJob;
const bullmq_1 = require("bullmq");
const logger_1 = require("../utils/logger");
const CONNECTION_CONFIG = { connection: { host: 'localhost', port: 6379 } };
let syncQueue = null;
let emailQueue = null;
let socialQueue = null;
let reportQueue = null;
let fileProcessorQueue = null;
let notificationQueue = null;
let certificateQueue = null;
let aiQueue = null;
let webhookQueue = null;
function getSyncQueue() {
    if (!syncQueue)
        syncQueue = new bullmq_1.Queue('sync', CONNECTION_CONFIG);
    return syncQueue;
}
function getEmailQueue() {
    if (!emailQueue)
        emailQueue = new bullmq_1.Queue('email', CONNECTION_CONFIG);
    return emailQueue;
}
function getSocialQueue() {
    if (!socialQueue)
        socialQueue = new bullmq_1.Queue('social', CONNECTION_CONFIG);
    return socialQueue;
}
function getReportQueue() {
    if (!reportQueue)
        reportQueue = new bullmq_1.Queue('report', CONNECTION_CONFIG);
    return reportQueue;
}
function getFileProcessorQueue() {
    if (!fileProcessorQueue)
        fileProcessorQueue = new bullmq_1.Queue('file-processor', CONNECTION_CONFIG);
    return fileProcessorQueue;
}
function getNotificationQueue() {
    if (!notificationQueue)
        notificationQueue = new bullmq_1.Queue('notification', CONNECTION_CONFIG);
    return notificationQueue;
}
function getCertificateQueue() {
    if (!certificateQueue)
        certificateQueue = new bullmq_1.Queue('certificate', CONNECTION_CONFIG);
    return certificateQueue;
}
function getAIQueue() {
    if (!aiQueue)
        aiQueue = new bullmq_1.Queue('ai', CONNECTION_CONFIG);
    return aiQueue;
}
function getWebhookQueue() {
    if (!webhookQueue)
        webhookQueue = new bullmq_1.Queue('webhook', CONNECTION_CONFIG);
    return webhookQueue;
}
async function initializeQueues() {
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
        await queue.waitUntilReady().catch((err) => logger_1.logger.warn(`Queue ${queue.name} not ready`, { err }));
        logger_1.logger.info(`Queue initialized: ${queue.name}`);
    }
    await startWorkers();
}
async function startWorkers() {
    const { syncWorker } = await Promise.resolve().then(() => __importStar(require('./workers/sync.worker')));
    const { emailWorker } = await Promise.resolve().then(() => __importStar(require('./workers/email.worker')));
    const { socialWorker } = await Promise.resolve().then(() => __importStar(require('./workers/social.worker')));
    const { reportWorker } = await Promise.resolve().then(() => __importStar(require('./workers/report.worker')));
    const { certificateWorker } = await Promise.resolve().then(() => __importStar(require('./workers/certificate.worker')));
    const { aiWorker } = await Promise.resolve().then(() => __importStar(require('./workers/ai.worker')));
    const { webhookWorker } = await Promise.resolve().then(() => __importStar(require('./workers/webhook.worker')));
    logger_1.logger.info('BullMQ workers started', {
        workers: ['sync', 'email', 'social', 'report', 'certificate', 'ai', 'webhook'],
    });
}
async function scheduleJob(queue, jobName, data, options = {}) {
    await queue.add(jobName, data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
        ...options,
    });
}
//# sourceMappingURL=queue.js.map