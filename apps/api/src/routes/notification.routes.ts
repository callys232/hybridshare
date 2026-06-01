import { Router } from 'express';
import { notificationService } from '../services/notification.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { apiResponse, apiError } from '../utils/paginate';
import type { AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const result = await notificationService.list(req.user!.id, {
      page: parseInt((req.query.page as string) ?? '1'),
      limit: parseInt((req.query.limit as string) ?? '20'),
    });
    res.status(200).json({ success: true, data: result.items, error: null, meta: result.meta, unreadCount: result.unreadCount });
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.put('/read-all', async (req: AuthRequest, res) => {
  try {
    await notificationService.markAllRead(req.user!.id);
    res.status(200).json(apiResponse({ message: 'All notifications marked as read' }));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.put('/:id/read', async (req: AuthRequest, res) => {
  try {
    await notificationService.markRead(req.params.id, req.user!.id);
    res.status(200).json(apiResponse({ message: 'Notification marked as read' }));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await notificationService.dismiss(req.params.id, req.user!.id);
    res.status(200).json(apiResponse({ message: 'Notification dismissed' }));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

export { router as notificationRouter };
