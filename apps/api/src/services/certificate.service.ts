import { getPrisma } from '../config/database';
import { getEmailQueue } from '../jobs/queue';
import { scheduleJob } from '../jobs/queue';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const prisma = getPrisma();

export const certificateService = {
  /**
   * Issue a certificate after course completion.
   * Called by enrollment.service after handleCourseCompletion.
   */
  async issueCertificate(enrollmentId: string): Promise<{
    id: string;
    credentialId: string;
    title: string;
    pdfUrl?: string;
  }> {
    const enrollment = await prisma.enrollment.findUniqueOrThrow({
      where: { id: enrollmentId },
      include: {
        user: true,
        course: { include: { instructor: { include: { user: true } } } },
      },
    });

    if (!enrollment.course.certificateEnabled) {
      throw Object.assign(new Error('This course does not issue certificates'), { statusCode: 400 });
    }

    // Check for existing cert
    const existing = await prisma.userCertificate.findFirst({ where: { enrollmentId } });
    if (existing) return { id: existing.id, credentialId: existing.credentialId, title: existing.title };

    // Generate credential ID: HS-YEAR-UPPERCASE_RANDOM
    const year = new Date().getFullYear();
    const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
    const credentialId = `HS-${year}-${rand}`;

    const cert = await prisma.userCertificate.create({
      data: {
        userId: enrollment.userId,
        enrollmentId,
        courseId: enrollment.courseId,
        instructorId: enrollment.course.instructorId ?? undefined,
        credentialId,
        title: `Certificate of Completion: ${enrollment.course.title}`,
        status: 'ISSUED',
        issuedAt: new Date(),
      },
    });

    // Queue PDF generation asynchronously
    try {
      const { getCertificateQueue } = await import('../jobs/queue');
      await scheduleJob(getCertificateQueue(), 'generate-pdf', {
        certificateId: cert.id,
        userId: enrollment.userId,
        userName: enrollment.user.name,
        courseTitle: enrollment.course.title,
        instructorName: enrollment.course.instructor?.user?.name ?? 'HybridShare Academy',
        credentialId,
        completedAt: enrollment.completedAt?.toISOString() ?? new Date().toISOString(),
      });
    } catch (err) {
      logger.warn('Certificate PDF queue failed, will retry', { err });
    }

    // Send email notification
    try {
      await scheduleJob(getEmailQueue(), 'certificate-issued', {
        to: enrollment.user.email,
        name: enrollment.user.name,
        courseTitle: enrollment.course.title,
        credentialId,
        certificateUrl: `${process.env.LMS_BASE_URL}/my-learning?tab=certificates`,
      });
    } catch (err) {
      logger.warn('Certificate email failed', { err });
    }

    logger.info('Certificate issued', { certId: cert.id, credentialId, userId: enrollment.userId });
    return { id: cert.id, credentialId, title: cert.title };
  },

  async getCertificate(certId: string, userId: string) {
    const cert = await prisma.userCertificate.findUniqueOrThrow({
      where: { id: certId },
      include: {
        course: { select: { id: true, title: true, slug: true, level: true, durationMinutes: true } },
        instructor: { include: { user: { select: { name: true } } } },
      },
    });

    // Only cert owner can see it
    if (cert.userId !== userId) {
      throw Object.assign(new Error('Access denied'), { statusCode: 403 });
    }
    return cert;
  },

  async getUserCertificates(userId: string) {
    return prisma.userCertificate.findMany({
      where: { userId, status: 'ISSUED' },
      include: {
        course: { select: { id: true, title: true, slug: true, thumbnailUrl: true, level: true } },
        instructor: { include: { user: { select: { name: true } } } },
      },
      orderBy: { issuedAt: 'desc' },
    });
  },

  /** Public credential verification (no auth required) */
  async verifyCertificate(credentialId: string) {
    const cert = await prisma.userCertificate.findFirst({
      where: { credentialId: credentialId.toUpperCase() },
      include: {
        user: { select: { name: true } },
        course: { select: { title: true, slug: true, level: true } },
        instructor: { include: { user: { select: { name: true } } } },
      },
    });
    if (!cert || cert.status !== 'ISSUED') {
      throw Object.assign(new Error('Certificate not found or has been revoked'), { statusCode: 404 });
    }
    return {
      valid: true,
      credentialId: cert.credentialId,
      recipientName: cert.user.name,
      courseTitle: cert.course.title,
      courseLevel: cert.course.level,
      instructorName: cert.instructor?.user?.name,
      issuedAt: cert.issuedAt,
      expiresAt: cert.expiresAt,
    };
  },

  async revokeCertificate(certId: string, adminId: string, reason: string) {
    const cert = await prisma.userCertificate.update({
      where: { id: certId },
      data: { status: 'REVOKED' },
    });
    logger.info('Certificate revoked', { certId, adminId, reason });
    return cert;
  },

  /** Attach S3/Minio PDF URL after generation */
  async setPdfUrl(certId: string, pdfUrl: string) {
    return prisma.userCertificate.update({ where: { id: certId }, data: { pdfUrl } });
  },
};
