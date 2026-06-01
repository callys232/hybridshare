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
exports.scormService = void 0;
/**
 * scorm.service.ts
 * Handles SCORM 1.2 / 2004 package management and xAPI (Tin Can) statement tracking.
 * SCORM packages are ZIP files containing an imsmanifest.xml.
 */
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const prisma = (0, database_1.getPrisma)();
exports.scormService = {
    // ─── Package Management ──────────────────────────────────────────────────────
    async createPackage(data) {
        const pkg = await prisma.sCORMPackage.create({
            data: {
                courseId: data.courseId,
                lessonId: data.lessonId ?? null,
                title: data.title,
                version: data.version,
                storageKey: data.storageKey,
                launchUrl: data.launchUrl,
                uploadedById: data.uploadedById,
                isActive: true,
            },
        });
        logger_1.logger.info('SCORM package created', { id: pkg.id, courseId: data.courseId, version: data.version });
        return pkg;
    },
    async getPackage(packageId) {
        return prisma.sCORMPackage.findUniqueOrThrow({ where: { id: packageId } });
    },
    async listPackages(courseId) {
        return prisma.sCORMPackage.findMany({ where: { courseId, isActive: true } });
    },
    // ─── Session Tracking ────────────────────────────────────────────────────────
    async getOrCreateSession(packageId, userId) {
        const existing = await prisma.sCORMSession.findFirst({
            where: { packageId, userId, completionStatus: { not: 'completed' } },
            orderBy: { updatedAt: 'desc' },
        });
        if (existing)
            return existing;
        return prisma.sCORMSession.create({
            data: {
                packageId,
                userId,
                completionStatus: 'unknown',
                successStatus: 'unknown',
                totalTime: '00:00:00',
                data: {},
            },
        });
    },
    /**
     * Called by the SCORM API shim in the frontend when it calls:
     * LMSSetValue / SetValue
     */
    async updateSession(sessionId, userId, updates) {
        const session = await prisma.sCORMSession.findUniqueOrThrow({ where: { id: sessionId } });
        if (session.userId !== userId)
            throw Object.assign(new Error('Access denied'), { statusCode: 403 });
        const updated = await prisma.sCORMSession.update({
            where: { id: sessionId },
            data: {
                completionStatus: updates.completionStatus ?? session.completionStatus,
                successStatus: updates.successStatus ?? session.successStatus,
                score: updates.score ?? session.score,
                totalTime: updates.totalTime ?? session.totalTime,
                suspendData: updates.suspendData ?? session.suspendData,
                location: updates.location ?? session.location,
                data: updates.data ? { ...session.data, ...updates.data } : session.data,
            },
        });
        // If completed, trigger enrollment completion
        if (updates.completionStatus === 'completed' && session.completionStatus !== 'completed') {
            const pkg = await prisma.sCORMPackage.findUnique({ where: { id: session.packageId } });
            if (pkg?.lessonId) {
                const { enrollmentService } = await Promise.resolve().then(() => __importStar(require('./enrollment.service')));
                await enrollmentService.updateLessonProgress(userId, pkg.lessonId, {
                    isCompleted: true,
                    watchedSeconds: 0,
                    totalSeconds: 0,
                }).catch(() => { });
            }
        }
        return updated;
    },
    // ─── xAPI / Tin Can ──────────────────────────────────────────────────────────
    async storeXAPIStatement(statement) {
        const stored = await prisma.xAPIStatement.create({
            data: {
                statementId: statement.id,
                userId: statement.userId ?? null,
                courseId: statement.courseId ?? null,
                verb: statement.verb.id,
                verbDisplay: statement.verb.display?.['en-US'] ?? statement.verb.id,
                objectId: statement.object.id ?? '',
                objectType: statement.object.objectType ?? 'Activity',
                result: statement.result ?? {},
                context: statement.context ?? {},
                actor: statement.actor,
                timestamp: statement.timestamp ? new Date(statement.timestamp) : new Date(),
                raw: statement,
            },
        });
        // Map common xAPI verbs to LMS events
        const verb = statement.verb.id;
        if (statement.userId) {
            if (verb.includes('completed') || verb.includes('passed')) {
                // Could trigger lesson completion if we have context
            }
        }
        return stored;
    },
    async getXAPIStatements(params) {
        const { userId, courseId, verb, limit = 50 } = params;
        const where = {};
        if (userId)
            where.userId = userId;
        if (courseId)
            where.courseId = courseId;
        if (verb)
            where.verb = { contains: verb };
        return prisma.xAPIStatement.findMany({
            where,
            take: limit,
            orderBy: { timestamp: 'desc' },
        });
    },
};
//# sourceMappingURL=scorm.service.js.map