import { Worker } from 'bullmq';
import { socialService } from '../../services/social.service';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

export const socialWorker = new Worker(
  'social',
  async (job) => {
    const { shareId, userId } = job.data as { shareId: string; userId: string };

    const share = await prisma.socialShare.findUnique({ where: { id: shareId } });
    if (!share) {
      logger.warn('Social share not found', { shareId });
      return;
    }

    if (share.scheduledAt && new Date() < new Date(share.scheduledAt)) {
      logger.debug('Social post not yet due', { shareId, scheduledAt: share.scheduledAt });
      return;
    }

    await socialService.publishNow(shareId, userId);
    logger.info('Scheduled social post published', { shareId });
  },
  {
    connection: { host: 'localhost', port: 6379 },
    concurrency: 2,
  }
);

socialWorker.on('failed', (job, err) => {
  logger.error('Social worker job failed', { jobId: job?.id, error: err.message });
});
