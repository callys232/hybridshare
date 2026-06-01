import { Worker, Job } from 'bullmq';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

type AIJobType = 'generate-document-summary' | 'generate-tags' | 'analyze-content' | 'generate-recommendations';

interface AIJobData {
  type: AIJobType;
  fileId?: string;
  workspaceId?: string;
  userId?: string;
  content: string;
  context?: Record<string, unknown>;
}

function redisConnection() {
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || env.REDIS_PASSWORD || undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
  };
}

export const aiWorker = new Worker<AIJobData>(
  'ai',
  async (job: Job<AIJobData>) => {
    const { type, fileId, workspaceId, userId, content, context } = job.data;
    logger.info('Processing AI job', { type, fileId, userId, jobId: job.id });

    const { aiService } = await import('../../services/ai.service');
    let result: unknown;

    switch (type) {
      case 'generate-document-summary': {
        if (!userId) throw new Error('userId required for document summary');
        result = await aiService.generateSummary(content, userId);
        break;
      }

      case 'analyze-content': {
        if (!userId) throw new Error('userId required for content analysis');
        result = await aiService.analyzeContent(content, userId);
        break;
      }

      case 'generate-tags': {
        result = await aiService.generateSummary(
          `Generate 5-10 relevant tags for this file content: ${content.slice(0, 2000)}`,
          userId ?? 'system'
        );
        break;
      }

      case 'generate-recommendations': {
        if (userId) {
          result = await aiService.generateRecommendations(userId);
        }
        break;
      }

      default:
        throw new Error(`Unknown AI job type: ${type}`);
    }

    logger.info('AI job completed', { type, jobId: job.id });
    return result;
  },
  {
    connection: redisConnection(),
    concurrency: 2,
    limiter: { max: 10, duration: 60_000 },
  }
);

aiWorker.on('failed', (job, err) => {
  logger.error('AI worker job failed', { jobId: job?.id, err: (err as Error).message });
});
