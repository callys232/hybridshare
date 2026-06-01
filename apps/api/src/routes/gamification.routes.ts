import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { gamificationService } from '../services/gamification.service';
import type { Request, Response, NextFunction } from 'express';

export const gamificationRouter = Router();
const ok = (res: Response, data: unknown) => res.json({ success: true, data, error: null });
const uid = (req: Request) => (req as Request & { user: { sub: string } }).user.sub;

// Public leaderboards
gamificationRouter.get('/leaderboard/:period', async (req, res, next) => {
  try {
    const period = req.params.period as 'weekly' | 'monthly' | 'alltime';
    ok(res, await gamificationService.getLeaderboard(period, Number(req.query.limit) || 50));
  } catch (e) { next(e); }
});

gamificationRouter.get('/badges', async (req, res, next) => {
  try {
    const { prisma } = await import('../config/database');
    ok(res, await prisma.badge.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } }));
  } catch (e) { next(e); }
});

// Auth required
gamificationRouter.use(authenticate);

gamificationRouter.get('/me', async (req, res, next) => {
  try { ok(res, await gamificationService.getUserGamificationProfile(uid(req))); } catch (e) { next(e); }
});

gamificationRouter.get('/me/events', async (req, res, next) => {
  try {
    const { prisma } = await import('../config/database');
    ok(res, await prisma.gamificationEvent.findMany({
      where: { userId: uid(req) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }));
  } catch (e) { next(e); }
});

gamificationRouter.post('/daily-login', async (req, res, next) => {
  try {
    const userId = uid(req);
    await gamificationService.awardXP(userId, 'DAILY_LOGIN');
    await gamificationService.updateStreak(userId);
    ok(res, await gamificationService.getUserGamificationProfile(userId));
  } catch (e) { next(e); }
});
