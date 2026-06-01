import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/rbac.middleware';
import { searchRateLimit } from '../middleware/rateLimit.middleware';
import { searchService } from '../services/search.service';
import { apiResponse, apiError } from '../utils/paginate';

const router = Router();

router.get('/', authMiddleware, searchRateLimit, async (req, res) => {
  try {
    const { q, workspaceId, type, dateFrom, dateTo, limit, offset } = req.query as Record<string, string>;
    const results = await searchService.search(q ?? '', {
      workspaceId,
      type,
      dateFrom,
      dateTo,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
    res.status(200).json(apiResponse(results));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.post('/reindex', authMiddleware, requireAdmin(), async (req, res) => {
  try {
    const result = await searchService.reindex();
    res.status(200).json(apiResponse(result));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

export { router as searchRouter };
