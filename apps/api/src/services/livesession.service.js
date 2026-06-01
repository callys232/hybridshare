"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveSessionService = void 0;
const database_1 = require("../config/database");
const queue_1 = require("../jobs/queue");
const env_1 = require("../config/env");
const prisma = (0, database_1.getPrisma)();
exports.liveSessionService = {
    async listSessions(params = {}) {
        const { page = 1, limit = 12, status, courseId, hostId } = params;
        const where = {};
        if (status)
            where.status = status;
        if (courseId)
            where.lesson = { module: { courseId } };
        if (hostId)
            where.hostId = hostId;
        const [items, total] = await Promise.all([
            prisma.liveSession.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    host: { select: { id: true, name: true, avatar: true } },
                    attendees: { select: { userId: true }, take: 1 },
                    _count: { select: { attendees: true } },
                },
                orderBy: [{ scheduledAt: 'asc' }],
            }),
            prisma.liveSession.count({ where }),
        ]);
        return { items, meta: { total, page, limit } };
    },
    async getSession(sessionId, userId) {
        const session = await prisma.liveSession.findUniqueOrThrow({
            where: { id: sessionId },
            include: {
                host: { select: { id: true, name: true, avatar: true } },
                _count: { select: { attendees: true } },
            },
        });
        let isRegistered = false;
        if (userId) {
            const reg = await prisma.liveSessionAttendee.findFirst({
                where: { sessionId, userId },
            });
            isRegistered = !!reg;
        }
        return { ...session, attendeeCount: session._count.attendees, isRegistered };
    },
    async createSession(data) {
        const session = await prisma.liveSession.create({
            data: {
                ...data,
                status: 'SCHEDULED',
                scheduledAt: new Date(data.scheduledAt),
            },
        });
        // Schedule reminder job 24h and 1h before
        const reminderTime24h = new Date(session.scheduledAt).getTime() - 24 * 3600000 - Date.now();
        const reminderTime1h = new Date(session.scheduledAt).getTime() - 3600000 - Date.now();
        if (reminderTime24h > 0) {
            await (0, queue_1.scheduleJob)((0, queue_1.getEmailQueue)(), 'live-session-reminder', {
                sessionId: session.id,
                reminderType: '24h',
            }, { delay: reminderTime24h });
        }
        if (reminderTime1h > 0) {
            await (0, queue_1.scheduleJob)((0, queue_1.getEmailQueue)(), 'live-session-reminder', {
                sessionId: session.id,
                reminderType: '1h',
            }, { delay: reminderTime1h });
        }
        return session;
    },
    async registerAttendee(sessionId, userId) {
        const session = await prisma.liveSession.findUniqueOrThrow({ where: { id: sessionId } });
        if (session.status === 'ENDED' || session.status === 'CANCELLED') {
            throw Object.assign(new Error('Session has already ended'), { statusCode: 400 });
        }
        if (session.maxAttendees) {
            const count = await prisma.liveSessionAttendee.count({ where: { sessionId } });
            if (count >= session.maxAttendees) {
                throw Object.assign(new Error('Session is full'), { statusCode: 409 });
            }
        }
        const existing = await prisma.liveSessionAttendee.findFirst({ where: { sessionId, userId } });
        if (existing)
            return { alreadyRegistered: true };
        const attendee = await prisma.liveSessionAttendee.create({
            data: { sessionId, userId, joinedAt: null },
        });
        // Send confirmation email
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
            await (0, queue_1.scheduleJob)((0, queue_1.getEmailQueue)(), 'live-session-confirmation', {
                to: user.email,
                name: user.name,
                sessionTitle: session.title,
                scheduledAt: session.scheduledAt.toISOString(),
                timezone: session.timezone,
                meetingUrl: session.meetingUrl,
            });
        }
        return { registered: true };
    },
    async startSession(sessionId, hostId) {
        const session = await prisma.liveSession.findUniqueOrThrow({ where: { id: sessionId } });
        if (session.hostId !== hostId)
            throw Object.assign(new Error('Only the host can start the session'), { statusCode: 403 });
        return prisma.liveSession.update({
            where: { id: sessionId },
            data: { status: 'LIVE', meetingUrl: session.meetingUrl ?? `${env_1.env.LMS_BASE_URL}/live/${sessionId}` },
        });
    },
    async endSession(sessionId, hostId, recordingUrl) {
        const session = await prisma.liveSession.findUniqueOrThrow({ where: { id: sessionId } });
        if (session.hostId !== hostId)
            throw Object.assign(new Error('Only the host can end the session'), { statusCode: 403 });
        // Mark all registered attendees as attended
        await prisma.liveSessionAttendee.updateMany({
            where: { sessionId },
            data: { leftAt: new Date() },
        });
        return prisma.liveSession.update({
            where: { id: sessionId },
            data: {
                status: recordingUrl ? 'RECORDING_AVAILABLE' : 'ENDED',
                recordingUrl: recordingUrl ?? null,
            },
        });
    },
    async cancelSession(sessionId, hostId, reason) {
        const session = await prisma.liveSession.findUniqueOrThrow({ where: { id: sessionId } });
        if (session.hostId !== hostId)
            throw Object.assign(new Error('Permission denied'), { statusCode: 403 });
        // Notify all registered attendees
        const attendees = await prisma.liveSessionAttendee.findMany({
            where: { sessionId },
            include: { user: { select: { email: true, name: true } } },
        });
        for (const a of attendees) {
            await (0, queue_1.scheduleJob)((0, queue_1.getEmailQueue)(), 'live-session-cancelled', {
                to: a.user.email,
                name: a.user.name,
                sessionTitle: session.title,
                reason: reason ?? 'No reason provided',
            }).catch(() => { });
        }
        return prisma.liveSession.update({
            where: { id: sessionId },
            data: { status: 'CANCELLED' },
        });
    },
    async getSessionAttendees(sessionId) {
        return prisma.liveSessionAttendee.findMany({
            where: { sessionId },
            include: { user: { select: { id: true, name: true, avatar: true } } },
        });
    },
};
//# sourceMappingURL=livesession.service.js.map