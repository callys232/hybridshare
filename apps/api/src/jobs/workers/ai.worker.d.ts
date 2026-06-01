import { Worker } from 'bullmq';
type AIJobType = 'generate-document-summary' | 'generate-tags' | 'analyze-content' | 'generate-recommendations';
interface AIJobData {
    type: AIJobType;
    fileId?: string;
    workspaceId?: string;
    userId?: string;
    content: string;
    context?: Record<string, unknown>;
}
export declare const aiWorker: Worker<AIJobData, any, string>;
export {};
//# sourceMappingURL=ai.worker.d.ts.map