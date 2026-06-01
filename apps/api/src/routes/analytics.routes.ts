import { Router } from 'express';
import { analyticsService } from '../services/analytics.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { apiResponse, apiError } from '../utils/paginate';
import type { AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '@hybridshare/shared/types/user';

const router = Router();
router.use(authMiddleware);

router.get('/storage', async (req: AuthRequest, res) => {
  try {
    const { workspaceId } = req.query as { workspaceId?: string };
    const data = await analyticsService.getStorageBreakdown(workspaceId);
    res.status(200).json(apiResponse(data));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.get('/activity', async (req: AuthRequest, res) => {
  try {
    const { period, workspaceId, days } = req.query as Record<string, string>;
    const data = await analyticsService.getActivityTimeline(
      (period as 'daily' | 'weekly' | 'monthly') ?? 'daily',
      workspaceId,
      parseInt(days ?? '30')
    );
    res.status(200).json(apiResponse(data));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.get('/top-files', async (req: AuthRequest, res) => {
  try {
    const { workspaceId, limit } = req.query as Record<string, string>;
    const data = await analyticsService.getTopFiles(workspaceId, parseInt(limit ?? '10'));
    res.status(200).json(apiResponse(data));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.get('/users', requireRole(UserRole.MANAGER), async (req: AuthRequest, res) => {
  try {
    const data = await analyticsService.getUserActivity();
    res.status(200).json(apiResponse(data));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.get('/social', async (req: AuthRequest, res) => {
  try {
    const data = await analyticsService.getSocialPerformance(req.user!.id);
    res.status(200).json(apiResponse(data));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.get('/system', requireRole(UserRole.MANAGER), async (req: AuthRequest, res) => {
  try {
    const data = await analyticsService.getSystemStats();
    res.status(200).json(apiResponse(data));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

export { router as analyticsRouter };
