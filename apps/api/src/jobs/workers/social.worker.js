"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socialWorker = void 0;
const bullmq_1 = require("bullmq");
const social_service_1 = require("../../services/social.service");
const database_1 = require("../../config/database");
const logger_1 = require("../../utils/logger");
exports.socialWorker = new bullmq_1.Worker('social', async (job) => {
    const { shareId, userId } = job.data;
    const share = await database_1.prisma.socialShare.findUnique({ where: { id: shareId } });
    if (!share) {
        logger_1.logger.warn('Social share not found', { shareId });
        return;
    }
    if (share.scheduledAt && new Date() < new Date(share.scheduledAt)) {
        logger_1.logger.debug('Social post not yet due', { shareId, scheduledAt: share.scheduledAt });
        return;
    }
    await social_service_1.socialService.publishNow(shareId, userId);
    logger_1.logger.info('Scheduled social post published', { shareId });
}, {
    connection: { host: 'localhost', port: 6379 },
    concurrency: 2,
});
exports.socialWorker.on('failed', (job, err) => {
    logger_1.logger.error('Social worker job failed', { jobId: job?.id, error: err.message });
});
//# sourceMappingURL=social.worker.js.map