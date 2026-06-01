import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { announcementService } from '../services/announcement.service';
import type { Request, Response, NextFunction } from 'express';

export const announcementRouter = Router();

const ok = (res: Response, data: unknown) => res.json({ success: true, data, error: null });
const uid = (req: Request) => (req as Request & { user: { sub: string } }).user.sub;

// ─── Authenticated ────────────────────────────────────────────────────────────

announcementRouter.use(authenticate);

/**
 * GET /api/announcements
 * List announcements for the user's context (org or platform-wide).
 */
announcementRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, courseId, page, limit } = req.query as Record<string, string>;
    const result = await announcementService.listAnnouncements(uid(req), {
      organizationId,
      courseId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    ok(res, result);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/announcements/unread-count
 * Get unread badge count.
 */
announcementRouter.get('/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await announcementService.getUnreadCount(uid(req));
    ok(res, { count });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/announcements/:id
 * Get a single announcement (auto-marks read).
 */
announcementRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const announcement = await announcementService.getAnnouncement(req.params.id, uid(req));
    ok(res, announcement);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/announcements/:id/read
 * Mark a single announcement as read.
 */
announcementRouter.post('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await announcementService.markRead(req.params.id, uid(req));
    ok(res, { read: true });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/announcements/read-all
 * Mark all announcements as read.
 */
announcementRouter.post('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await announcementService.markAllRead(uid(req));
    ok(res, { markedRead: count });
  } catch (e) {
    next(e);
  }
});

// ─── Admin/Instructor ─────────────────────────────────────────────────────────

/**
 * POST /api/announcements
 * Create an announcement.
 */
announcementRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const announcement = await announcementService.createAnnouncement(uid(req), req.body);
    ok(res, announcement);
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/announcements/:id
 * Update an announcement.
 */
announcementRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const announcement = await announcementService.updateAnnouncement(req.params.id, uid(req), req.body);
    ok(res, announcement);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/announcements/:id
 * Delete an announcement.
 */
announcementRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await announcementService.deleteAnnouncement(req.params.id, uid(req));
    ok(res, { deleted: true });
  } catch (e) {
    next(e);
  }
});
