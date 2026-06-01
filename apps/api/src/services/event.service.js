"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventService = exports.EventService = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
class EventService {
    BATCH_SIZE = 100;
    SESSION_TTL = 30 * 60; // 30 min in seconds
    async track(payload, userId, ipAddress, userAgent) {
        const sessionId = payload.sessionId ?? (userId ? `session:${userId}` : undefined);
        // Upsert session
        if (sessionId) {
            await this.upsertSession(sessionId, userId, ipAddress, userAgent);
        }
        // Write event
        await database_1.prisma.eventLog.create({
            data: {
                userId: userId ?? null,
                sessionId: sessionId ?? null,
                anonymousId: payload.anonymousId ?? null,
                event: payload.event,
                category: (payload.category ?? 'CUSTOM'),
                properties: (payload.properties ?? {}),
                context: (payload.context ?? {}),
                ipAddress: ipAddress ?? null,
                userAgent: userAgent ?? null,
                url: payload.context?.url ?? null,
                referrer: payload.context?.referrer ?? null,
                timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
            },
        });
        logger_1.logger.debug('Event tracked', { event: payload.event, userId, sessionId });
    }
    async trackBatch(events, userId, ipAddress, userAgent) {
        const chunks = [];
        for (let i = 0; i < events.length; i += this.BATCH_SIZE) {
            chunks.push(events.slice(i, i + this.BATCH_SIZE));
        }
        for (const chunk of chunks) {
            await database_1.prisma.eventLog.createMany({
                data: chunk.map((payload) => ({
                    userId: userId ?? null,
                    sessionId: payload.sessionId ?? null,
                    anonymousId: payload.anonymousId ?? null,
                    event: payload.event,
                    category: (payload.category ?? 'CUSTOM'),
                    properties: (payload.properties ?? {}),
                    context: (payload.context ?? {}),
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
    async upsertSession(sessionId, userId, ipAddress, userAgent) {
        const cacheKey = `evtsession:${sessionId}`;
        const existing = await (0, redis_1.cacheGet)(cacheKey);
        if (!existing) {
            // New session
            await database_1.prisma.eventSession.create({
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
            }).catch(() => { }); // Ignore if session already exists in DB
        }
        else {
            // Update existing session
            await database_1.prisma.eventSession.update({
                where: { id: sessionId },
                data: { events: { increment: 1 } },
            }).catch(() => { });
        }
        await (0, redis_1.cacheSet)(cacheKey, sessionId, this.SESSION_TTL);
    }
    async getAnalytics(organizationId, from, to, granularity = 'day') {
        const where = {
            timestamp: { gte: from, lte: to },
        };
        const [totalEvents, uniqueUsers, topEvents, topPages, funnelData] = await Promise.all([
            database_1.prisma.eventLog.count({ where }),
            database_1.prisma.eventLog.groupBy({ by: ['userId'], where: { ...where, userId: { not: null } } }).then((r) => r.length),
            database_1.prisma.eventLog.groupBy({
                by: ['event'],
                where,
                _count: true,
                orderBy: { _count: { event: 'desc' } },
                take: 10,
            }),
            database_1.prisma.eventLog.groupBy({
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
    async getEventsOverTime(where, from, to, granularity) {
        // Use raw SQL for date truncation
        const result = await database_1.prisma.$queryRaw `
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
    async getCheckoutFunnel(from, to) {
        const where = { timestamp: { gte: from, lte: to } };
        const steps = [
            { name: 'Course Viewed', event: 'course_viewed' },
            { name: 'Checkout Started', event: 'checkout_started' },
            { name: 'Checkout Completed', event: 'checkout_completed' },
            { name: 'Course Enrolled', event: 'course_enrolled' },
        ];
        const counts = await Promise.all(steps.map((s) => database_1.prisma.eventLog.groupBy({ by: ['userId'], where: { ...where, event: s.event } }).then((r) => r.length)));
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
    async getUserJourney(userId, limit = 100) {
        return database_1.prisma.eventLog.findMany({
            where: { userId },
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
    }
    async getLearningAnalytics(from, to) {
        const [enrollments, completions, quizAttempts, videoEvents, avgProgress, totalTimeSpent,] = await Promise.all([
            database_1.prisma.enrollment.count({ where: { createdAt: { gte: from, lte: to } } }),
            database_1.prisma.enrollment.count({ where: { completedAt: { gte: from, lte: to }, status: 'COMPLETED' } }),
            database_1.prisma.quizAttempt.aggregate({
                where: { createdAt: { gte: from, lte: to } },
                _count: true,
                _avg: { percentage: true },
            }),
            database_1.prisma.eventLog.count({ where: { event: 'video_played', timestamp: { gte: from, lte: to } } }),
            database_1.prisma.enrollment.aggregate({ where: { status: 'ACTIVE' }, _avg: { progress: true } }),
            database_1.prisma.enrollment.aggregate({ _sum: { timeSpentMinutes: true } }),
        ]);
        const completionRate = enrollments > 0 ? Math.round((completions / enrollments) * 100) : 0;
        const topCourses = await database_1.prisma.course.findMany({
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
    parseDevice(ua) {
        if (!ua)
            return 'unknown';
        if (/mobile/i.test(ua))
            return 'mobile';
        if (/tablet/i.test(ua))
            return 'tablet';
        return 'desktop';
    }
    parseBrowser(ua) {
        if (!ua)
            return 'unknown';
        if (/chrome/i.test(ua))
            return 'Chrome';
        if (/firefox/i.test(ua))
            return 'Firefox';
        if (/safari/i.test(ua))
            return 'Safari';
        if (/edge/i.test(ua))
            return 'Edge';
        return 'other';
    }
    parseOS(ua) {
        if (!ua)
            return 'unknown';
        if (/windows/i.test(ua))
            return 'Windows';
        if (/mac/i.test(ua))
            return 'macOS';
        if (/android/i.test(ua))
            return 'Android';
        if (/ios|iphone|ipad/i.test(ua))
            return 'iOS';
        if (/linux/i.test(ua))
            return 'Linux';
        return 'other';
    }
}
exports.EventService = EventService;
exports.eventService = new EventService();
//# sourceMappingURL=event.service.js.map