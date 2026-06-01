"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailWorker = void 0;
const bullmq_1 = require("bullmq");
const email_service_1 = require("../../services/email.service");
const logger_1 = require("../../utils/logger");
exports.emailWorker = new bullmq_1.Worker('email', async (job) => {
    const { type, data } = job.data;
    switch (type) {
        case 'verification':
            await email_service_1.emailService.sendVerificationEmail(data.email, data.name, data.token);
            break;
        case 'password_reset':
            await email_service_1.emailService.sendPasswordResetEmail(data.email, data.name, data.token);
            break;
        case 'share_notification':
            await email_service_1.emailService.sendShareNotification(data.email, data.senderName, data.resourceName, data.shareUrl);
            break;
        case 'workspace_invite':
            await email_service_1.emailService.sendWorkspaceInvite(data.email, data.inviterName, data.workspaceName, data.inviteUrl);
            break;
        case 'weekly_digest':
            await email_service_1.emailService.sendWeeklyDigest(data.email, data.name, data.stats);
            break;
        default:
            logger_1.logger.warn('Unknown email job type', { type });
    }
    logger_1.logger.debug('Email job completed', { jobId: job.id, type });
}, {
    connection: { host: 'localhost', port: 6379 },
    concurrency: 5,
});
exports.emailWorker.on('failed', (job, err) => {
    logger_1.logger.error('Email job failed', { jobId: job?.id, error: err.message });
});
//# sourceMappingURL=email.worker.js.map