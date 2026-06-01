import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { learningPathService } from '../services/learningpath.service';
import type { Request, Response, NextFunction } from 'express';

export const learningPathRouter = Router();

const ok = (res: Response, data: unknown) => res.json({ success: true, data, error: null });
const uid = (req: Request) => (req as Request & { user: { sub: string } }).user.sub;

// ─── Public ──────────────────────────────────────────────────────────────────

/**
 * GET /api/learning-paths
 * List all published learning paths.
 * BizEvent: learning_paths_viewed → /learning-paths
 */
learningPathRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, difficulty, page, limit } = req.query as Record<string, string>;
    const paths = await learningPathService.listPaths({
      category,
      difficulty,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    ok(res, paths);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/learning-paths/:id
 * BizEvent: learning_path_viewed → /learning-paths/[id]
 */
learningPathRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const path = await learningPathService.getPath(req.params.id);
    ok(res, path);
  } catch (e) {
    next(e);
  }
});

// ─── Auth Required ───────────────────────────────────────────────────────────

learningPathRouter.use(authenticate);

/**
 * POST /api/learning-paths/:id/enroll
 * Enroll in a learning path (auto-enrolls required courses).
 * BizEvent: learning_path_enrolled → /learning-paths/[id]
 */
learningPathRouter.post('/:id/enroll', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const enrollment = await learningPathService.enrollPath(req.params.id, uid(req));
    ok(res, enrollment);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/learning-paths/my/enrolled
 * Get user's enrolled learning paths with progress.
 * BizEvent: my_paths_viewed → /my-learning?tab=paths
 */
learningPathRouter.get('/my/enrolled', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const paths = await learningPathService.getUserPaths(uid(req));
    ok(res, paths);
  } catch (e) {
    next(e);
  }
});

// ─── Admin/Instructor ─────────────────────────────────────────────────────────

/**
 * POST /api/learning-paths
 * Create a learning path.
 */
learningPathRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const path = await learningPathService.createPath(uid(req), req.body);
    ok(res, path);
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/learning-paths/:id
 * Update a learning path.
 */
learningPathRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const path = await learningPathService.updatePath(req.params.id, uid(req), req.body);
    ok(res, path);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/learning-paths/:id
 * Delete a learning path.
 */
learningPathRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await learningPathService.deletePath(req.params.id, uid(req));
    ok(res, { deleted: true });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/learning-paths/:id/courses
 * Add a course to a learning path.
 */
learningPathRouter.post('/:id/courses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await learningPathService.addCourse(req.params.id, uid(req), req.body);
    ok(res, result);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/learning-paths/:id/courses/:courseId
 * Remove a course from a learning path.
 */
learningPathRouter.delete('/:id/courses/:courseId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await learningPathService.removeCourse(req.params.id, req.params.courseId, uid(req));
    ok(res, { removed: true });
  } catch (e) {
    next(e);
  }
});
