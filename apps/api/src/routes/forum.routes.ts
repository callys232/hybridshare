import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { forumRateLimit } from '../middleware/rateLimit.middleware';
import { forumService } from '../services/forum.service';
import type { Request, Response, NextFunction } from 'express';

export const forumRouter = Router();

const ok = (res: Response, data: unknown) => res.json({ success: true, data, error: null });
const uid = (req: Request) => (req as Request & { user: { sub: string } }).user.sub;

// ─── Public (read) ───────────────────────────────────────────────────────────

/**
 * GET /api/forums/:forumId/threads
 * BizEvent: forum_viewed → /community
 */
forumRouter.get('/:forumId/threads', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sort, category, page, limit } = req.query as Record<string, string>;
    const threads = await forumService.listThreads(req.params.forumId, {
      sort: (sort as 'latest' | 'popular' | 'unanswered') ?? 'latest',
      category,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    ok(res, threads);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/forums/threads/:threadId
 * BizEvent: thread_viewed → /community/thread/[id]
 */
forumRouter.get('/threads/:threadId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as Request & { user?: { sub: string } }).user?.sub;
    const thread = await forumService.getThread(req.params.threadId, userId);
    ok(res, thread);
  } catch (e) {
    next(e);
  }
});

// ─── Auth Required ───────────────────────────────────────────────────────────

forumRouter.use(authenticate);

/**
 * POST /api/forums/:forumId/threads
 * Create a new thread.
 * BizEvent: thread_created → /community/thread/[id]
 */
forumRouter.post('/:forumId/threads', forumRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const thread = await forumService.createThread(req.params.forumId, uid(req), req.body);
    ok(res, thread);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/forums/threads/:threadId/posts
 * Reply to a thread.
 */
forumRouter.post('/threads/:threadId/posts', forumRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await forumService.createPost(req.params.threadId, uid(req), req.body);
    ok(res, post);
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/forums/posts/:postId
 * Edit a post.
 */
forumRouter.put('/posts/:postId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await forumService.editPost(req.params.postId, uid(req), req.body.content);
    ok(res, post);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/forums/posts/:postId
 * Delete a post.
 */
forumRouter.delete('/posts/:postId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await forumService.deletePost(req.params.postId, uid(req));
    ok(res, { deleted: true });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/forums/posts/:postId/like
 * Toggle like on a post.
 */
forumRouter.post('/posts/:postId/like', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await forumService.toggleLike(req.params.postId, uid(req));
    ok(res, result);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/forums/posts/:postId/answer
 * Mark post as accepted answer.
 */
forumRouter.post('/posts/:postId/answer', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await forumService.markAnswer(req.params.postId, uid(req));
    ok(res, post);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/forums/threads/:threadId/pin
 * Mod: pin/unpin a thread.
 */
forumRouter.post('/threads/:threadId/pin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const thread = await forumService.pinThread(req.params.threadId, uid(req));
    ok(res, thread);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/forums/threads/:threadId/lock
 * Mod: lock/unlock a thread.
 */
forumRouter.post('/threads/:threadId/lock', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const thread = await forumService.lockThread(req.params.threadId, uid(req));
    ok(res, thread);
  } catch (e) {
    next(e);
  }
});
