"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportWorker = void 0;
const bullmq_1 = require("bullmq");
const pdfkit_1 = __importDefault(require("pdfkit"));
const xlsx_1 = __importDefault(require("xlsx"));
const database_1 = require("../../config/database");
const minio_1 = require("../../config/minio");
const logger_1 = require("../../utils/logger");
exports.reportWorker = new bullmq_1.Worker('report', async (job) => {
    const { reportId } = job.data;
    const report = await database_1.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
        logger_1.logger.warn('Report not found', { reportId });
        return;
    }
    await database_1.prisma.report.update({ where: { id: reportId }, data: { status: 'generating' } });
    const params = report.parameters;
    let buffer;
    let mimeType;
    let ext;
    if (report.type === 'pdf') {
        buffer = await generatePdfReport(report.name, params);
        mimeType = 'application/pdf';
        ext = 'pdf';
    }
    else {
        buffer = await generateXlsxReport(report.name, params);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        ext = 'xlsx';
    }
    const storagePath = `reports/${reportId}/report_${Date.now()}.${ext}`;
    await (0, minio_1.uploadBuffer)(storagePath, buffer, mimeType);
    await database_1.prisma.report.update({
        where: { id: reportId },
        data: { status: 'ready', outputUrl: storagePath, generatedAt: new Date() },
    });
    logger_1.logger.info('Report generated', { reportId, type: report.type });
}, {
    connection: { host: 'localhost', port: 6379 },
    concurrency: 2,
});
async function generatePdfReport(name, params) {
    return new Promise((resolve) => {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 50 });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc
            .font('Helvetica-Bold')
            .fontSize(24)
            .fillColor('#000000')
            .text('HybridShare', 50, 50);
        doc
            .font('Helvetica')
            .fontSize(10)
            .fillColor('#c12129')
            .text('Enterprise File Sharing Platform', 50, 80);
        doc.moveTo(50, 100).lineTo(545, 100).strokeColor('#c12129').lineWidth(2).stroke();
        doc
            .font('Helvetica-Bold')
            .fontSize(18)
            .fillColor('#000000')
            .text(name, 50, 120);
        doc
            .font('Helvetica')
            .fontSize(11)
            .fillColor('#333333')
            .text(`Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}`, 50, 150);
        if (params.data && Array.isArray(params.data)) {
            doc.moveDown(2);
            const headers = Object.keys(params.data[0] || {});
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff');
            doc.rect(50, doc.y, 495, 20).fill('#000000');
            headers.forEach((h, i) => {
                doc.text(h, 55 + (i * 495) / headers.length, doc.y - 14, { width: 495 / headers.length });
            });
            doc.moveDown(0.5);
            doc.font('Helvetica').fontSize(9).fillColor('#333333');
            params.data.forEach((row, idx) => {
                if (idx % 2 === 0)
                    doc.rect(50, doc.y - 5, 495, 18).fill('#f5f5f5');
                headers.forEach((h, i) => {
                    doc.fillColor('#333333').text(String(row[h] ?? ''), 55 + (i * 495) / headers.length, doc.y, {
                        width: 495 / headers.length,
                    });
                });
                doc.moveDown(0.3);
            });
        }
        doc
            .fontSize(8)
            .fillColor('#999999')
            .text('© HybridShare. Confidential.', 50, doc.page.height - 50, { align: 'center' });
        doc.end();
    });
}
async function generateXlsxReport(name, params) {
    const wb = xlsx_1.default.utils.book_new();
    const data = params.data ?? [{ message: 'No data available' }];
    const ws = xlsx_1.default.utils.json_to_sheet(data);
    xlsx_1.default.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    return Buffer.from(xlsx_1.default.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}
exports.reportWorker.on('failed', (job, err) => {
    logger_1.logger.error('Report worker job failed', { jobId: job?.id, error: err.message });
});
//# sourceMappingURL=report.worker.js.map