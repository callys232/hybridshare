import { Worker } from 'bullmq';
import PDFDocument from 'pdfkit';
import XLSX from 'xlsx';
import { prisma } from '../../config/database';
import { uploadBuffer } from '../../config/minio';
import { logger } from '../../utils/logger';

export const reportWorker = new Worker(
  'report',
  async (job) => {
    const { reportId } = job.data as { reportId: string };

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      logger.warn('Report not found', { reportId });
      return;
    }

    await prisma.report.update({ where: { id: reportId }, data: { status: 'generating' } });

    const params = report.parameters as Record<string, unknown>;
    let buffer: Buffer;
    let mimeType: string;
    let ext: string;

    if (report.type === 'pdf') {
      buffer = await generatePdfReport(report.name, params);
      mimeType = 'application/pdf';
      ext = 'pdf';
    } else {
      buffer = await generateXlsxReport(report.name, params);
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      ext = 'xlsx';
    }

    const storagePath = `reports/${reportId}/report_${Date.now()}.${ext}`;
    await uploadBuffer(storagePath, buffer, mimeType);

    await prisma.report.update({
      where: { id: reportId },
      data: { status: 'ready', outputUrl: storagePath, generatedAt: new Date() },
    });

    logger.info('Report generated', { reportId, type: report.type });
  },
  {
    connection: { host: 'localhost', port: 6379 },
    concurrency: 2,
  }
);

async function generatePdfReport(name: string, params: Record<string, unknown>): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
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
      const headers = Object.keys((params.data as Record<string, unknown>[])[0] || {});

      doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff');
      doc.rect(50, doc.y, 495, 20).fill('#000000');
      headers.forEach((h, i) => {
        doc.text(h, 55 + (i * 495) / headers.length, doc.y - 14, { width: 495 / headers.length });
      });

      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(9).fillColor('#333333');
      (params.data as Record<string, unknown>[]).forEach((row, idx) => {
        if (idx % 2 === 0) doc.rect(50, doc.y - 5, 495, 18).fill('#f5f5f5');
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

async function generateXlsxReport(name: string, params: Record<string, unknown>): Promise<Buffer> {
  const wb = XLSX.utils.book_new();
  const data = (params.data as Record<string, unknown>[]) ?? [{ message: 'No data available' }];
  const ws = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));

  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer);
}

reportWorker.on('failed', (job, err) => {
  logger.error('Report worker job failed', { jobId: job?.id, error: err.message });
});
