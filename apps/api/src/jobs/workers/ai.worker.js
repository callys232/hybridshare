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
exports.aiWorker = void 0;
const bullmq_1 = require("bullmq");
const logger_1 = require("../../utils/logger");
const env_1 = require("../../config/env");
function redisConnection() {
    const url = new URL(env_1.env.REDIS_URL);
    return {
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: url.password || env_1.env.REDIS_PASSWORD || undefined,
        tls: url.protocol === 'rediss:' ? {} : undefined,
    };
}
exports.aiWorker = new bullmq_1.Worker('ai', async (job) => {
    const { type, fileId, workspaceId, userId, content, context } = job.data;
    logger_1.logger.info('Processing AI job', { type, fileId, userId, jobId: job.id });
    const { aiService } = await Promise.resolve().then(() => __importStar(require('../../services/ai.service')));
    let result;
    switch (type) {
        case 'generate-document-summary': {
            if (!userId)
                throw new Error('userId required for document summary');
            result = await aiService.generateSummary(content, userId);
            break;
        }
        case 'analyze-content': {
            if (!userId)
                throw new Error('userId required for content analysis');
            result = await aiService.analyzeContent(content, userId);
            break;
        }
        case 'generate-tags': {
            result = await aiService.generateSummary(`Generate 5-10 relevant tags for this file content: ${content.slice(0, 2000)}`, userId ?? 'system');
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
    logger_1.logger.info('AI job completed', { type, jobId: job.id });
    return result;
}, {
    connection: redisConnection(),
    concurrency: 2,
    limiter: { max: 10, duration: 60_000 },
});
exports.aiWorker.on('failed', (job, err) => {
    logger_1.logger.error('AI worker job failed', { jobId: job?.id, err: err.message });
});
//# sourceMappingURL=ai.worker.js.map