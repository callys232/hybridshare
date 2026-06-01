import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { liveSessionService } from '../services/livesession.service';
import type { Request, Response, NextFunction } from 'express';

export const liveSessionRouter = Router();

const ok = (res: Response, data: unknown) => res.json({ success: true, data, error: null });
const uid = (req: Request) => (req as Request & { user: { sub: string } }).user.sub;

// ─── Public ──────────────────────────────────────────────────────────────────

/**
 * GET /api/live-sessions
 * List sessions (public can see upcoming ones).
 * BizEvent: live_sessions_viewed → /live-sessions
 */
liveSessionRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, instructorId, courseId, page, limit } = req.query as Record<string, string>;
    const sessions = await liveSessionService.listSessions({
      status: status as never,
      instructorId,
      courseId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    ok(res, sessions);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/live-sessions/:id
 * BizEvent: live_session_viewed → /live-sessions/[id]
 */
liveSessionRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await liveSessionService.getSession(req.params.id);
    ok(res, session);
  } catch (e) {
    next(e);
  }
});

// ─── Auth Required ───────────────────────────────────────────────────────────

liveSessionRouter.use(authenticate);

/**
 * POST /api/live-sessions/:id/register
 * Register for an upcoming session.
 * BizEvent: live_session_registered → /live-sessions/[id]
 */
liveSessionRouter.post('/:id/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attendee = await liveSessionService.registerAttendee(req.params.id, uid(req));
    ok(res, attendee);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/live-sessions/:id/register
 * Cancel registration.
 */
liveSessionRouter.delete('/:id/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await liveSessionService.cancelRegistration(req.params.id, uid(req));
    ok(res, { cancelled: true });
  } catch (e) {
    next(e);
  }
});

// ─── Instructor/Admin ─────────────────────────────────────────────────────────

/**
 * POST /api/live-sessions
 * Create a new live session.
 */
liveSessionRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await liveSessionService.createSession({ ...req.body, instructorId: uid(req) });
    ok(res, session);
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/live-sessions/:id
 * Update session details.
 */
liveSessionRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await liveSessionService.updateSession(req.params.id, uid(req), req.body);
    ok(res, session);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/live-sessions/:id/start
 * Mark session as LIVE.
 */
liveSessionRouter.post('/:id/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await liveSessionService.startSession(req.params.id, uid(req));
    ok(res, session);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/live-sessions/:id/end
 * Mark session as COMPLETED.
 */
liveSessionRouter.post('/:id/end', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await liveSessionService.endSession(req.params.id, uid(req), req.body.recordingUrl);
    ok(res, session);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/live-sessions/:id/cancel
 * Cancel session and notify attendees.
 */
liveSessionRouter.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await liveSessionService.cancelSession(req.params.id, uid(req));
    ok(res, session);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/live-sessions/:id
 * Delete a session.
 */
liveSessionRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await liveSessionService.deleteSession(req.params.id, uid(req));
    ok(res, { deleted: true });
  } catch (e) {
    next(e);
  }
});
