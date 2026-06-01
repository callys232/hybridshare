import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { eventService } from '../services/event.service';
import type { Request, Response, NextFunction } from 'express';

export const eventRouter = Router();
const ok = (res: Response, data: unknown) => res.json({ success: true, data, error: null });

// Public event tracking endpoint (no auth required for anonymous tracking)
eventRouter.post('/track', async (req, res, next) => {
  try {
    const userId = (req as Request & { user?: { sub: string } }).user?.sub;
    await eventService.track(req.body, userId, req.ip, req.headers['user-agent']);
    res.status(204).end();
  } catch (e) { next(e); }
});

eventRouter.post('/track/batch', async (req, res, next) => {
  try {
    const userId = (req as Request & { user?: { sub: string } }).user?.sub;
    await eventService.trackBatch(req.body.events, userId, req.ip, req.headers['user-agent']);
    res.status(204).end();
  } catch (e) { next(e); }
});

// Analytics — admin only
eventRouter.use(authenticate);

eventRouter.get('/analytics', async (req, res, next) => {
  try {
    const { from, to, granularity } = req.query as { from?: string; to?: string; granularity?: string };
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    ok(res, await eventService.getAnalytics(null, fromDate, toDate, (granularity ?? 'day') as 'day' | 'week' | 'month'));
  } catch (e) { next(e); }
});

eventRouter.get('/analytics/learning', async (req, res, next) => {
  try {
    const { from, to } = req.query as { from?: string; to?: string };
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    ok(res, await eventService.getLearningAnalytics(fromDate, toDate));
  } catch (e) { next(e); }
});

eventRouter.get('/user/:userId/journey', async (req, res, next) => {
  try { ok(res, await eventService.getUserJourney(req.params.userId)); } catch (e) { next(e); }
});
