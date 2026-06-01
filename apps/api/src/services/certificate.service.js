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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.certificateService = void 0;
const database_1 = require("../config/database");
const queue_1 = require("../jobs/queue");
const queue_2 = require("../jobs/queue");
const logger_1 = require("../utils/logger");
const crypto_1 = __importDefault(require("crypto"));
const prisma = (0, database_1.getPrisma)();
exports.certificateService = {
    /**
     * Issue a certificate after course completion.
     * Called by enrollment.service after handleCourseCompletion.
     */
    async issueCertificate(enrollmentId) {
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
        if (existing)
            return { id: existing.id, credentialId: existing.credentialId, title: existing.title };
        // Generate credential ID: HS-YEAR-UPPERCASE_RANDOM
        const year = new Date().getFullYear();
        const rand = crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
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
            const { getCertificateQueue } = await Promise.resolve().then(() => __importStar(require('../jobs/queue')));
            await (0, queue_2.scheduleJob)(getCertificateQueue(), 'generate-pdf', {
                certificateId: cert.id,
                userId: enrollment.userId,
                userName: enrollment.user.name,
                courseTitle: enrollment.course.title,
                instructorName: enrollment.course.instructor?.user?.name ?? 'HybridShare Academy',
                credentialId,
                completedAt: enrollment.completedAt?.toISOString() ?? new Date().toISOString(),
            });
        }
        catch (err) {
            logger_1.logger.warn('Certificate PDF queue failed, will retry', { err });
        }
        // Send email notification
        try {
            await (0, queue_2.scheduleJob)((0, queue_1.getEmailQueue)(), 'certificate-issued', {
                to: enrollment.user.email,
                name: enrollment.user.name,
                courseTitle: enrollment.course.title,
                credentialId,
                certificateUrl: `${process.env.LMS_BASE_URL}/my-learning?tab=certificates`,
            });
        }
        catch (err) {
            logger_1.logger.warn('Certificate email failed', { err });
        }
        logger_1.logger.info('Certificate issued', { certId: cert.id, credentialId, userId: enrollment.userId });
        return { id: cert.id, credentialId, title: cert.title };
    },
    async getCertificate(certId, userId) {
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
    async getUserCertificates(userId) {
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
    async verifyCertificate(credentialId) {
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
    async revokeCertificate(certId, adminId, reason) {
        const cert = await prisma.userCertificate.update({
            where: { id: certId },
            data: { status: 'REVOKED' },
        });
        logger_1.logger.info('Certificate revoked', { certId, adminId, reason });
        return cert;
    },
    /** Attach S3/Minio PDF URL after generation */
    async setPdfUrl(certId, pdfUrl) {
        return prisma.userCertificate.update({ where: { id: certId }, data: { pdfUrl } });
    },
};
//# sourceMappingURL=certificate.service.js.map