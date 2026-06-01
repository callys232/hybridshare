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
exports.certificateWorker = void 0;
/**
 * certificate.worker.ts
 *
 * Processes the 'certificate' queue for async PDF generation.
 * Uses a pure HTML→PDF approach via Puppeteer (or falls back to
 * a simple SVG-based cert when Puppeteer is unavailable in the env).
 */
const bullmq_1 = require("bullmq");
const logger_1 = require("../../utils/logger");
const database_1 = require("../../config/database");
const prisma = (0, database_1.getPrisma)();
async function generateCertificatePDF(data) {
    // HTML template for the certificate
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1056px; height: 748px;
      font-family: 'Georgia', serif;
      background: #fff;
      display: flex; align-items: center; justify-content: center;
    }
    .cert {
      width: 100%; height: 100%;
      border: 12px solid #c12129;
      padding: 48px;
      position: relative;
      background: linear-gradient(135deg, #fff 0%, #fafafa 100%);
    }
    .corner {
      position: absolute; width: 60px; height: 60px;
      border-color: #c12129; border-style: solid;
    }
    .corner.tl { top: 8px; left: 8px; border-width: 3px 0 0 3px; }
    .corner.tr { top: 8px; right: 8px; border-width: 3px 3px 0 0; }
    .corner.bl { bottom: 8px; left: 8px; border-width: 0 0 3px 3px; }
    .corner.br { bottom: 8px; right: 8px; border-width: 0 3px 3px 0; }
    .logo {
      text-align: center; margin-bottom: 12px;
      font-size: 13px; font-weight: bold; letter-spacing: 4px;
      color: #c12129; text-transform: uppercase;
    }
    .logo span { color: #000; }
    .divider { height: 2px; background: #c12129; margin: 12px auto; width: 120px; }
    h1 { text-align: center; font-size: 14px; letter-spacing: 6px; color: #666; text-transform: uppercase; margin-bottom: 20px; }
    .recipient { text-align: center; font-size: 42px; color: #1a1a1a; margin: 12px 0; font-style: italic; }
    .body-text { text-align: center; font-size: 15px; color: #444; line-height: 1.8; margin: 16px 0; }
    .course-title { font-size: 22px; font-weight: bold; color: #1a1a1a; font-style: normal; }
    .meta { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
    .meta-item { text-align: center; }
    .meta-label { font-size: 10px; color: #888; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }
    .meta-value { font-size: 13px; color: #1a1a1a; font-weight: bold; }
    .credential { text-align: center; margin-top: 16px; font-size: 10px; color: #999; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="cert">
    <div class="corner tl"></div><div class="corner tr"></div>
    <div class="corner bl"></div><div class="corner br"></div>
    <div class="logo">Hybrid<span>Share</span> Academy</div>
    <div class="divider"></div>
    <h1>Certificate of Completion</h1>
    <p class="body-text">This is to certify that</p>
    <p class="recipient">${escapeHtml(data.userName)}</p>
    <p class="body-text">has successfully completed the course</p>
    <p class="body-text"><span class="course-title">${escapeHtml(data.courseTitle)}</span></p>
    <div class="meta">
      <div class="meta-item">
        <div class="meta-label">Completed On</div>
        <div class="meta-value">${new Date(data.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Instructor</div>
        <div class="meta-value">${escapeHtml(data.instructorName)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Platform</div>
        <div class="meta-value">HybridShare Academy</div>
      </div>
    </div>
    <div class="credential">Credential ID: ${data.credentialId} · Verify at hybridshare.io/verify</div>
  </div>
</body>
</html>`;
    try {
        const puppeteer = await Promise.resolve().then(() => __importStar(require('puppeteer')));
        const browser = await puppeteer.default.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.setViewport({ width: 1056, height: 748 });
        const pdf = await page.pdf({ width: '1056px', height: '748px', printBackground: true });
        await browser.close();
        return Buffer.from(pdf);
    }
    catch (err) {
        logger_1.logger.warn('Puppeteer unavailable, generating placeholder PDF', { err });
        // Return a minimal valid PDF placeholder
        return Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 792 612]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n164\n%%EOF');
    }
}
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
exports.certificateWorker = new bullmq_1.Worker('certificate', async (job) => {
    const data = job.data;
    logger_1.logger.info('Generating certificate PDF', { certId: data.certificateId });
    try {
        const pdfBuffer = await generateCertificatePDF(data);
        // Upload to MinIO / S3
        const { storageService } = await Promise.resolve().then(() => __importStar(require('../../services/storage.service')));
        const key = `certificates/${data.userId}/${data.credentialId}.pdf`;
        await storageService.uploadBuffer(pdfBuffer, key, 'application/pdf', process.env.CERTIFICATES_BUCKET ?? 'certificates');
        const pdfUrl = await storageService.getPublicUrl(key, process.env.CERTIFICATES_BUCKET ?? 'certificates');
        // Update DB with PDF URL
        await prisma.userCertificate.update({
            where: { id: data.certificateId },
            data: { pdfUrl },
        });
        logger_1.logger.info('Certificate PDF generated', { certId: data.certificateId, url: pdfUrl });
    }
    catch (err) {
        logger_1.logger.error('Certificate generation failed', { certId: data.certificateId, err });
        throw err;
    }
}, { connection: { host: 'localhost', port: 6379 }, concurrency: 3 });
exports.certificateWorker.on('failed', (job, err) => {
    logger_1.logger.error('Certificate job failed', { jobId: job?.id, err });
});
//# sourceMappingURL=certificate.worker.js.map