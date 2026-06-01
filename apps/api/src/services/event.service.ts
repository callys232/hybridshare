import { prisma } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';
import { logger } from '../utils/logger';
import type { EventPayload, EventCategory } from '@hybridshare/shared/types/events';

export class EventService {
  private readonly BATCH_SIZE = 100;
  private readonly SESSION_TTL = 30 * 60; // 30 min in seconds

  async track(payload: EventPayload, userId?: string, ipAddress?: string, userAgent?: string) {
    const sessionId = payload.sessionId ?? (userId ? `session:${userId}` : undefined);

    // Upsert session
    if (sessionId) {
      await this.upsertSession(sessionId, userId, ipAddress, userAgent);
    }

    // Write event
    await prisma.eventLog.create({
      data: {
        userId: userId ?? null,
        sessionId: sessionId ?? null,
        anonymousId: payload.anonymousId ?? null,
        event: payload.event,
        category: (payload.category ?? 'CUSTOM') as EventCategory,
        properties: (payload.properties ?? {}) as never,
        context: (payload.context ?? {}) as never,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        url: payload.context?.url ?? null,
        referrer: payload.context?.referrer ?? null,
        timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      },
    });

    logger.debug('Event tracked', { event: payload.event, userId, sessionId });
  }

  async trackBatch(events: EventPayload[], userId?: string, ipAddress?: string, userAgent?: string) {
    const chunks: EventPayload[][] = [];
    for (let i = 0; i < events.length; i += this.BATCH_SIZE) {
      chunks.push(events.slice(i, i + this.BATCH_SIZE));
    }

    for (const chunk of chunks) {
      await prisma.eventLog.createMany({
        data: chunk.map((payload) => ({
          userId: userId ?? null,
          sessionId: payload.sessionId ?? null,
          anonymousId: payload.anonymousId ?? null,
          event: payload.event,
          category: (payload.category ?? 'CUSTOM') as EventCategory,
          properties: (payload.properties ?? {}) as never,
          context: (payload.context ?? {}) as never,
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
          url: payload.context?.url ?? null,
          referrer: payload.context?.referrer ?? null,
          timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
        })),
        skipDuplicates: false,
      });
    }
  }

  private async upsertSession(sessionId: string, userId?: string, ipAddress?: string, userAgent?: string) {
    const cacheKey = `evtsession:${sessionId}`;
    const existing = await cacheGet<string>(cacheKey);

    if (!existing) {
      // New session
      await prisma.eventSession.create({
        data: {
          id: sessionId,
          userId: userId ?? null,
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
          device: this.parseDevice(userAgent),
          browser: this.parseBrowser(userAgent),
          os: this.parseOS(userAgent),
          events: 1,
          pageViews: 0,
        },
      }).catch(() => {}); // Ignore if session already exists in DB
    } else {
      // Update existing session
      await prisma.eventSession.update({
        where: { id: sessionId },
        data: { events: { increment: 1 } },
      }).catch(() => {});
    }

    await cacheSet(cacheKey, sessionId, this.SESSION_TTL);
  }

  async getAnalytics(
    organizationId: string | null,
    from: Date, to: Date,
    granularity: 'day' | 'week' | 'month' = 'day'
  ) {
    const where: Record<string, unknown> = {
      timestamp: { gte: from, lte: to },
    };

    const [totalEvents, uniqueUsers, topEvents, topPages, funnelData] = await Promise.all([
      prisma.eventLog.count({ where }),
      prisma.eventLog.groupBy({ by: ['userId'], where: { ...where, userId: { not: null } } }).then((r) => r.length),
      prisma.eventLog.groupBy({
        by: ['event'],
        where,
        _count: true,
        orderBy: { _count: { event: 'desc' } },
        take: 10,
      }),
      prisma.eventLog.groupBy({
        by: ['url'],
        where: { ...where, category: 'PAGE_VIEW', url: { not: null } },
        _count: true,
        orderBy: { _count: { url: 'desc' } },
        take: 10,
      }),
      this.getCheckoutFunnel(from, to),
    ]);

    const eventsOverTime = await this.getEventsOverTime(where, from, to, granularity);

    return {
      totalEvents,
      uniqueUsers,
      topEvents: topEvents.map((e) => ({ event: e.event, count: e._count })),
      topPages: topPages.map((p) => ({ url: p.url ?? '', views: p._count })),
      eventsOverTime,
      funnels: funnelData,
    };
  }

  private async getEventsOverTime(
    where: Record<string, unknown>,
    from: Date, to: Date,
    granularity: 'day' | 'week' | 'month'
  ) {
    // Use raw SQL for date truncation
    const result = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE_TRUNC(${granularity}, timestamp) as date, COUNT(*) as count
      FROM event_logs
      WHERE timestamp >= ${from} AND timestamp <= ${to}
      GROUP BY date
      ORDER BY date ASC
    `;

    return result.map((r) => ({
      date: r.date.toISOString().split('T')[0],
      count: Number(r.count),
    }));
  }

  private async getCheckoutFunnel(from: Date, to: Date) {
    const where = { timestamp: { gte: from, lte: to } };
    const steps = [
      { name: 'Course Viewed', event: 'course_viewed' },
      { name: 'Checkout Started', event: 'checkout_started' },
      { name: 'Checkout Completed', event: 'checkout_completed' },
      { name: 'Course Enrolled', event: 'course_enrolled' },
    ];

    const counts = await Promise.all(
      steps.map((s) =>
        prisma.eventLog.groupBy({ by: ['userId'], where: { ...where, event: s.event } }).then((r) => r.length)
      )
    );

    return [{
      name: 'Enrollment Funnel',
      steps: steps.map((s, i) => ({
        name: s.name,
        event: s.event,
        count: counts[i],
        conversionRate: i === 0 ? 100 : counts[0] > 0 ? Math.round((counts[i] / counts[0]) * 100) : 0,
        dropoffRate: i === 0 ? 0 : counts[i - 1] > 0 ? Math.round(((counts[i - 1] - counts[i]) / counts[i - 1]) * 100) : 0,
      })),
      totalUsers: counts[0],
      completionRate: counts[0] > 0 ? Math.round((counts[counts.length - 1] / counts[0]) * 100) : 0,
    }];
  }

  async getUserJourney(userId: string, limit = 100) {
    return prisma.eventLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async getLearningAnalytics(from: Date, to: Date) {
    const [
      enrollments, completions, quizAttempts, videoEvents,
      avgProgress, totalTimeSpent,
    ] = await Promise.all([
      prisma.enrollment.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.enrollment.count({ where: { completedAt: { gte: from, lte: to }, status: 'COMPLETED' } }),
      prisma.quizAttempt.aggregate({
        where: { createdAt: { gte: from, lte: to } },
        _count: true,
        _avg: { percentage: true },
      }),
      prisma.eventLog.count({ where: { event: 'video_played', timestamp: { gte: from, lte: to } } }),
      prisma.enrollment.aggregate({ where: { status: 'ACTIVE' }, _avg: { progress: true } }),
      prisma.enrollment.aggregate({ _sum: { timeSpentMinutes: true } }),
    ]);

    const completionRate = enrollments > 0 ? Math.round((completions / enrollments) * 100) : 0;

    const topCourses = await prisma.course.findMany({
      take: 5,
      orderBy: { totalStudents: 'desc' },
      where: { status: 'PUBLISHED' },
      select: { id: true, title: true, totalStudents: true, rating: true },
    });

    return {
      totalEnrollments: enrollments,
      completions,
      completionRate,
      avgProgress: Math.round(avgProgress._avg.progress ?? 0),
      totalTimeSpentHours: Math.round((totalTimeSpent._sum.timeSpentMinutes ?? 0) / 60),
      quizAttempts: quizAttempts._count,
      avgQuizScore: Math.round(quizAttempts._avg.percentage ?? 0),
      videoPlays: videoEvents,
      topCourses,
    };
  }

  private parseDevice(ua?: string): string {
    if (!ua) return 'unknown';
    if (/mobile/i.test(ua)) return 'mobile';
    if (/tablet/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  private parseBrowser(ua?: string): string {
    if (!ua) return 'unknown';
    if (/chrome/i.test(ua)) return 'Chrome';
    if (/firefox/i.test(ua)) return 'Firefox';
    if (/safari/i.test(ua)) return 'Safari';
    if (/edge/i.test(ua)) return 'Edge';
    return 'other';
  }

  private parseOS(ua?: string): string {
    if (!ua) return 'unknown';
    if (/windows/i.test(ua)) return 'Windows';
    if (/mac/i.test(ua)) return 'macOS';
    if (/android/i.test(ua)) return 'Android';
    if (/ios|iphone|ipad/i.test(ua)) return 'iOS';
    if (/linux/i.test(ua)) return 'Linux';
    return 'other';
  }
}

export const eventService = new EventService();
