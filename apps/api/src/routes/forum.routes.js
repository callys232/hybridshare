"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forumRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const forum_service_1 = require("../services/forum.service");
exports.forumRouter = (0, express_1.Router)();
const ok = (res, data) => res.json({ success: true, data, error: null });
const uid = (req) => req.user.sub;
// ─── Public (read) ───────────────────────────────────────────────────────────
/**
 * GET /api/forums/:forumId/threads
 * BizEvent: forum_viewed → /community
 */
exports.forumRouter.get('/:forumId/threads', async (req, res, next) => {
    try {
        const { sort, category, page, limit } = req.query;
        const threads = await forum_service_1.forumService.listThreads(req.params.forumId, {
            sort: sort ?? 'latest',
            category,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
        ok(res, threads);
    }
    catch (e) {
        next(e);
    }
});
/**
 * GET /api/forums/threads/:threadId
 * BizEvent: thread_viewed → /community/thread/[id]
 */
exports.forumRouter.get('/threads/:threadId', async (req, res, next) => {
    try {
        const userId = req.user?.sub;
        const thread = await forum_service_1.forumService.getThread(req.params.threadId, userId);
        ok(res, thread);
    }
    catch (e) {
        next(e);
    }
});
// ─── Auth Required ───────────────────────────────────────────────────────────
exports.forumRouter.use(auth_middleware_1.authenticate);
/**
 * POST /api/forums/:forumId/threads
 * Create a new thread.
 * BizEvent: thread_created → /community/thread/[id]
 */
exports.forumRouter.post('/:forumId/threads', rateLimit_middleware_1.forumRateLimit, async (req, res, next) => {
    try {
        const thread = await forum_service_1.forumService.createThread(req.params.forumId, uid(req), req.body);
        ok(res, thread);
    }
    catch (e) {
        next(e);
    }
});
/**
 * POST /api/forums/threads/:threadId/posts
 * Reply to a thread.
 */
exports.forumRouter.post('/threads/:threadId/posts', rateLimit_middleware_1.forumRateLimit, async (req, res, next) => {
    try {
        const post = await forum_service_1.forumService.createPost(req.params.threadId, uid(req), req.body);
        ok(res, post);
    }
    catch (e) {
        next(e);
    }
});
/**
 * PUT /api/forums/posts/:postId
 * Edit a post.
 */
exports.forumRouter.put('/posts/:postId', async (req, res, next) => {
    try {
        const post = await forum_service_1.forumService.editPost(req.params.postId, uid(req), req.body.content);
        ok(res, post);
    }
    catch (e) {
        next(e);
    }
});
/**
 * DELETE /api/forums/posts/:postId
 * Delete a post.
 */
exports.forumRouter.delete('/posts/:postId', async (req, res, next) => {
    try {
        await forum_service_1.forumService.deletePost(req.params.postId, uid(req));
        ok(res, { deleted: true });
    }
    catch (e) {
        next(e);
    }
});
/**
 * POST /api/forums/posts/:postId/like
 * Toggle like on a post.
 */
exports.forumRouter.post('/posts/:postId/like', async (req, res, next) => {
    try {
        const result = await forum_service_1.forumService.toggleLike(req.params.postId, uid(req));
        ok(res, result);
    }
    catch (e) {
        next(e);
    }
});
/**
 * POST /api/forums/posts/:postId/answer
 * Mark post as accepted answer.
 */
exports.forumRouter.post('/posts/:postId/answer', async (req, res, next) => {
    try {
        const post = await forum_service_1.forumService.markAnswer(req.params.postId, uid(req));
        ok(res, post);
    }
    catch (e) {
        next(e);
    }
});
/**
 * POST /api/forums/threads/:threadId/pin
 * Mod: pin/unpin a thread.
 */
exports.forumRouter.post('/threads/:threadId/pin', async (req, res, next) => {
    try {
        const thread = await forum_service_1.forumService.pinThread(req.params.threadId, uid(req));
        ok(res, thread);
    }
    catch (e) {
        next(e);
    }
});
/**
 * POST /api/forums/threads/:threadId/lock
 * Mod: lock/unlock a thread.
 */
exports.forumRouter.post('/threads/:threadId/lock', async (req, res, next) => {
    try {
        const thread = await forum_service_1.forumService.lockThread(req.params.threadId, uid(req));
        ok(res, thread);
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=forum.routes.js.map