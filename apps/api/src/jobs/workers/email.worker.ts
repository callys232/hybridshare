import { Worker } from 'bullmq';
import { emailService } from '../../services/email.service';
import { logger } from '../../utils/logger';

export const emailWorker = new Worker(
  'email',
  async (job) => {
    const { type, data } = job.data as { type: string; data: Record<string, unknown> };

    switch (type) {
      case 'verification':
        await emailService.sendVerificationEmail(
          data.email as string,
          data.name as string,
          data.token as string
        );
        break;

      case 'password_reset':
        await emailService.sendPasswordResetEmail(
          data.email as string,
          data.name as string,
          data.token as string
        );
        break;

      case 'share_notification':
        await emailService.sendShareNotification(
          data.email as string,
          data.senderName as string,
          data.resourceName as string,
          data.shareUrl as string
        );
        break;

      case 'workspace_invite':
        await emailService.sendWorkspaceInvite(
          data.email as string,
          data.inviterName as string,
          data.workspaceName as string,
          data.inviteUrl as string
        );
        break;

      case 'weekly_digest':
        await emailService.sendWeeklyDigest(
          data.email as string,
          data.name as string,
          data.stats as Parameters<typeof emailService.sendWeeklyDigest>[2]
        );
        break;

      default:
        logger.warn('Unknown email job type', { type });
    }

    logger.debug('Email job completed', { jobId: job.id, type });
  },
  {
    connection: { host: 'localhost', port: 6379 },
    concurrency: 5,
  }
);

emailWorker.on('failed', (job, err) => {
  logger.error('Email job failed', { jobId: job?.id, error: err.message });
});
