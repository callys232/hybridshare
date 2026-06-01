import { Router } from 'express';
import { socialService } from '../services/social.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { apiResponse, apiError } from '../utils/paginate';
import type { AuthRequest } from '../middleware/auth.middleware';
import type { ShareComposerData } from '@hybridshare/shared/types/social';

const router = Router();
router.use(authMiddleware);

router.post('/share', async (req: AuthRequest, res) => {
  try {
    const data = req.body as ShareComposerData;
    const share = await socialService.publishPost(req.user!.id, data);
    res.status(201).json(apiResponse(share));
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    res.status(error.statusCode ?? 500).json(apiError(error.message));
  }
});

router.post('/schedule', async (req: AuthRequest, res) => {
  try {
    const data = req.body as ShareComposerData;
    const share = await socialService.publishPost(req.user!.id, data);
    res.status(201).json(apiResponse(share));
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    res.status(error.statusCode ?? 500).json(apiError(error.message));
  }
});

router.get('/posts', async (req: AuthRequest, res) => {
  try {
    const query = req.query as Record<string, string>;
    const result = await socialService.listPosts(req.user!.id, {
      page: parseInt(query.page ?? '1'),
      limit: parseInt(query.limit ?? '20'),
    });
    res.status(200).json({ success: true, data: result.items, error: null, meta: result.meta });
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.delete('/posts/:id', async (req: AuthRequest, res) => {
  try {
    await socialService.cancelPost(req.params.id, req.user!.id);
    res.status(200).json(apiResponse({ message: 'Post cancelled' }));
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    res.status(error.statusCode ?? 500).json(apiError(error.message));
  }
});

router.get('/analytics/:postId', async (req: AuthRequest, res) => {
  try {
    const analytics = await socialService.getPostAnalytics(req.params.postId, req.user!.id);
    res.status(200).json(apiResponse(analytics));
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    res.status(error.statusCode ?? 500).json(apiError(error.message));
  }
});

export { router as socialRouter };
