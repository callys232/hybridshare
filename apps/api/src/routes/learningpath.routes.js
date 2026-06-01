"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.learningPathRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const learningpath_service_1 = require("../services/learningpath.service");
exports.learningPathRouter = (0, express_1.Router)();
const ok = (res, data) => res.json({ success: true, data, error: null });
const uid = (req) => req.user.sub;
// ─── Public ──────────────────────────────────────────────────────────────────
/**
 * GET /api/learning-paths
 * List all published learning paths.
 * BizEvent: learning_paths_viewed → /learning-paths
 */
exports.learningPathRouter.get('/', async (req, res, next) => {
    try {
        const { category, difficulty, page, limit } = req.query;
        const paths = await learningpath_service_1.learningPathService.listPaths({
            category,
            difficulty,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
        ok(res, paths);
    }
    catch (e) {
        next(e);
    }
});
/**
 * GET /api/learning-paths/:id
 * BizEvent: learning_path_viewed → /learning-paths/[id]
 */
exports.learningPathRouter.get('/:id', async (req, res, next) => {
    try {
        const path = await learningpath_service_1.learningPathService.getPath(req.params.id);
        ok(res, path);
    }
    catch (e) {
        next(e);
    }
});
// ─── Auth Required ───────────────────────────────────────────────────────────
exports.learningPathRouter.use(auth_middleware_1.authenticate);
/**
 * POST /api/learning-paths/:id/enroll
 * Enroll in a learning path (auto-enrolls required courses).
 * BizEvent: learning_path_enrolled → /learning-paths/[id]
 */
exports.learningPathRouter.post('/:id/enroll', async (req, res, next) => {
    try {
        const enrollment = await learningpath_service_1.learningPathService.enrollPath(req.params.id, uid(req));
        ok(res, enrollment);
    }
    catch (e) {
        next(e);
    }
});
/**
 * GET /api/learning-paths/my/enrolled
 * Get user's enrolled learning paths with progress.
 * BizEvent: my_paths_viewed → /my-learning?tab=paths
 */
exports.learningPathRouter.get('/my/enrolled', async (req, res, next) => {
    try {
        const paths = await learningpath_service_1.learningPathService.getUserPaths(uid(req));
        ok(res, paths);
    }
    catch (e) {
        next(e);
    }
});
// ─── Admin/Instructor ─────────────────────────────────────────────────────────
/**
 * POST /api/learning-paths
 * Create a learning path.
 */
exports.learningPathRouter.post('/', async (req, res, next) => {
    try {
        const path = await learningpath_service_1.learningPathService.createPath(uid(req), req.body);
        ok(res, path);
    }
    catch (e) {
        next(e);
    }
});
/**
 * PUT /api/learning-paths/:id
 * Update a learning path.
 */
exports.learningPathRouter.put('/:id', async (req, res, next) => {
    try {
        const path = await learningpath_service_1.learningPathService.updatePath(req.params.id, uid(req), req.body);
        ok(res, path);
    }
    catch (e) {
        next(e);
    }
});
/**
 * DELETE /api/learning-paths/:id
 * Delete a learning path.
 */
exports.learningPathRouter.delete('/:id', async (req, res, next) => {
    try {
        await learningpath_service_1.learningPathService.deletePath(req.params.id, uid(req));
        ok(res, { deleted: true });
    }
    catch (e) {
        next(e);
    }
});
/**
 * POST /api/learning-paths/:id/courses
 * Add a course to a learning path.
 */
exports.learningPathRouter.post('/:id/courses', async (req, res, next) => {
    try {
        const result = await learningpath_service_1.learningPathService.addCourse(req.params.id, uid(req), req.body);
        ok(res, result);
    }
    catch (e) {
        next(e);
    }
});
/**
 * DELETE /api/learning-paths/:id/courses/:courseId
 * Remove a course from a learning path.
 */
exports.learningPathRouter.delete('/:id/courses/:courseId', async (req, res, next) => {
    try {
        await learningpath_service_1.learningPathService.removeCourse(req.params.id, req.params.courseId, uid(req));
        ok(res, { removed: true });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=learningpath.routes.js.map