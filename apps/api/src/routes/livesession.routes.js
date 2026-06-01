"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveSessionRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const livesession_service_1 = require("../services/livesession.service");
exports.liveSessionRouter = (0, express_1.Router)();
const ok = (res, data) => res.json({ success: true, data, error: null });
const uid = (req) => req.user.sub;
// ─── Public ──────────────────────────────────────────────────────────────────
/**
 * GET /api/live-sessions
 * List sessions (public can see upcoming ones).
 * BizEvent: live_sessions_viewed → /live-sessions
 */
exports.liveSessionRouter.get('/', async (req, res, next) => {
    try {
        const { status, instructorId, courseId, page, limit } = req.query;
        const sessions = await livesession_service_1.liveSessionService.listSessions({
            status: status,
            instructorId,
            courseId,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
        ok(res, sessions);
    }
    catch (e) {
        next(e);
    }
});
/**
 * GET /api/live-sessions/:id
 * BizEvent: live_session_viewed → /live-sessions/[id]
 */
exports.liveSessionRouter.get('/:id', async (req, res, next) => {
    try {
        const session = await livesession_service_1.liveSessionService.getSession(req.params.id);
        ok(res, session);
    }
    catch (e) {
        next(e);
    }
});
// ─── Auth Required ───────────────────────────────────────────────────────────
exports.liveSessionRouter.use(auth_middleware_1.authenticate);
/**
 * POST /api/live-sessions/:id/register
 * Register for an upcoming session.
 * BizEvent: live_session_registered → /live-sessions/[id]
 */
exports.liveSessionRouter.post('/:id/register', async (req, res, next) => {
    try {
        const attendee = await livesession_service_1.liveSessionService.registerAttendee(req.params.id, uid(req));
        ok(res, attendee);
    }
    catch (e) {
        next(e);
    }
});
/**
 * DELETE /api/live-sessions/:id/register
 * Cancel registration.
 */
exports.liveSessionRouter.delete('/:id/register', async (req, res, next) => {
    try {
        await livesession_service_1.liveSessionService.cancelRegistration(req.params.id, uid(req));
        ok(res, { cancelled: true });
    }
    catch (e) {
        next(e);
    }
});
// ─── Instructor/Admin ─────────────────────────────────────────────────────────
/**
 * POST /api/live-sessions
 * Create a new live session.
 */
exports.liveSessionRouter.post('/', async (req, res, next) => {
    try {
        const session = await livesession_service_1.liveSessionService.createSession({ ...req.body, instructorId: uid(req) });
        ok(res, session);
    }
    catch (e) {
        next(e);
    }
});
/**
 * PUT /api/live-sessions/:id
 * Update session details.
 */
exports.liveSessionRouter.put('/:id', async (req, res, next) => {
    try {
        const session = await livesession_service_1.liveSessionService.updateSession(req.params.id, uid(req), req.body);
        ok(res, session);
    }
    catch (e) {
        next(e);
    }
});
/**
 * POST /api/live-sessions/:id/start
 * Mark session as LIVE.
 */
exports.liveSessionRouter.post('/:id/start', async (req, res, next) => {
    try {
        const session = await livesession_service_1.liveSessionService.startSession(req.params.id, uid(req));
        ok(res, session);
    }
    catch (e) {
        next(e);
    }
});
/**
 * POST /api/live-sessions/:id/end
 * Mark session as COMPLETED.
 */
exports.liveSessionRouter.post('/:id/end', async (req, res, next) => {
    try {
        const session = await livesession_service_1.liveSessionService.endSession(req.params.id, uid(req), req.body.recordingUrl);
        ok(res, session);
    }
    catch (e) {
        next(e);
    }
});
/**
 * POST /api/live-sessions/:id/cancel
 * Cancel session and notify attendees.
 */
exports.liveSessionRouter.post('/:id/cancel', async (req, res, next) => {
    try {
        const session = await livesession_service_1.liveSessionService.cancelSession(req.params.id, uid(req));
        ok(res, session);
    }
    catch (e) {
        next(e);
    }
});
/**
 * DELETE /api/live-sessions/:id
 * Delete a session.
 */
exports.liveSessionRouter.delete('/:id', async (req, res, next) => {
    try {
        await livesession_service_1.liveSessionService.deleteSession(req.params.id, uid(req));
        ok(res, { deleted: true });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=livesession.routes.js.map