/**
 * scorm.service.ts
 * Handles SCORM 1.2 / 2004 package management and xAPI (Tin Can) statement tracking.
 * SCORM packages are ZIP files containing an imsmanifest.xml.
 */
import { getPrisma } from '../config/database';
import { logger } from '../utils/logger';
import path from 'path';

const prisma = getPrisma();

export const scormService = {
  // ─── Package Management ──────────────────────────────────────────────────────

  async createPackage(data: {
    courseId: string;
    lessonId?: string;
    title: string;
    version: '1.2' | '2004';
    storageKey: string;  // S3/Minio key for zip
    launchUrl: string;   // relative path inside zip to launch file
    uploadedById: string;
  }) {
    const pkg = await prisma.sCORMPackage.create({
      data: {
        courseId: data.courseId,
        lessonId: data.lessonId ?? null,
        title: data.title,
        version: data.version as never,
        storageKey: data.storageKey,
        launchUrl: data.launchUrl,
        uploadedById: data.uploadedById,
        isActive: true,
      },
    });
    logger.info('SCORM package created', { id: pkg.id, courseId: data.courseId, version: data.version });
    return pkg;
  },

  async getPackage(packageId: string) {
    return prisma.sCORMPackage.findUniqueOrThrow({ where: { id: packageId } });
  },

  async listPackages(courseId: string) {
    return prisma.sCORMPackage.findMany({ where: { courseId, isActive: true } });
  },

  // ─── Session Tracking ────────────────────────────────────────────────────────

  async getOrCreateSession(packageId: string, userId: string) {
    const existing = await prisma.sCORMSession.findFirst({
      where: { packageId, userId, completionStatus: { not: 'completed' } },
      orderBy: { updatedAt: 'desc' },
    });
    if (existing) return existing;

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
  async updateSession(sessionId: string, userId: string, updates: {
    completionStatus?: string;
    successStatus?: string;
    score?: number;
    totalTime?: string;
    suspendData?: string;
    location?: string;
    data?: Record<string, unknown>;
  }) {
    const session = await prisma.sCORMSession.findUniqueOrThrow({ where: { id: sessionId } });
    if (session.userId !== userId) throw Object.assign(new Error('Access denied'), { statusCode: 403 });

    const updated = await prisma.sCORMSession.update({
      where: { id: sessionId },
      data: {
        completionStatus: updates.completionStatus ?? session.completionStatus,
        successStatus: updates.successStatus ?? session.successStatus,
        score: updates.score ?? session.score,
        totalTime: updates.totalTime ?? session.totalTime,
        suspendData: updates.suspendData ?? session.suspendData,
        location: updates.location ?? session.location,
        data: updates.data ? { ...(session.data as object), ...updates.data } : session.data,
      },
    });

    // If completed, trigger enrollment completion
    if (updates.completionStatus === 'completed' && session.completionStatus !== 'completed') {
      const pkg = await prisma.sCORMPackage.findUnique({ where: { id: session.packageId } });
      if (pkg?.lessonId) {
        const { enrollmentService } = await import('./enrollment.service');
        await enrollmentService.updateLessonProgress(userId, pkg.lessonId, {
          isCompleted: true,
          watchedSeconds: 0,
          totalSeconds: 0,
        }).catch(() => {});
      }
    }

    return updated;
  },

  // ─── xAPI / Tin Can ──────────────────────────────────────────────────────────

  async storeXAPIStatement(statement: {
    id: string;
    actor: Record<string, unknown>;
    verb: { id: string; display: Record<string, string> };
    object: Record<string, unknown>;
    result?: Record<string, unknown>;
    context?: Record<string, unknown>;
    timestamp?: string;
    userId?: string;
    courseId?: string;
  }) {
    const stored = await prisma.xAPIStatement.create({
      data: {
        statementId: statement.id,
        userId: statement.userId ?? null,
        courseId: statement.courseId ?? null,
        verb: statement.verb.id,
        verbDisplay: statement.verb.display?.['en-US'] ?? statement.verb.id,
        objectId: (statement.object as Record<string, string>).id ?? '',
        objectType: (statement.object as Record<string, string>).objectType ?? 'Activity',
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

  async getXAPIStatements(params: { userId?: string; courseId?: string; verb?: string; limit?: number }) {
    const { userId, courseId, verb, limit = 50 } = params;
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (courseId) where.courseId = courseId;
    if (verb) where.verb = { contains: verb };

    return prisma.xAPIStatement.findMany({
      where,
      take: limit,
      orderBy: { timestamp: 'desc' },
    });
  },
};
