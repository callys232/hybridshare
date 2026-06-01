/**
 * certificate.worker.ts
 *
 * Processes the 'certificate' queue for async PDF generation.
 * Uses a pure HTML→PDF approach via Puppeteer (or falls back to
 * a simple SVG-based cert when Puppeteer is unavailable in the env).
 */
import { Worker } from 'bullmq';
interface CertificateJobData {
    certificateId: string;
    userId: string;
    userName: string;
    courseTitle: string;
    instructorName: string;
    credentialId: string;
    completedAt: string;
}
export declare const certificateWorker: Worker<CertificateJobData, any, string>;
export {};
//# sourceMappingURL=certificate.worker.d.ts.map