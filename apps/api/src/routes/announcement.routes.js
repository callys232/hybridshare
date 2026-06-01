"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.announcementRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const announcement_service_1 = require("../services/announcement.service");
exports.announcementRouter = (0, express_1.Router)();
const ok = (res, data) => res.json({ success: true, data, error: null });
const uid = (req) => req.user.sub;
// ─── Authenticated ────────────────────────────────────────────────────────────
exports.announcementRouter.use(auth_middleware_1.authenticate);
/**
 * GET /api/announcements
 * List announcements for the user's context (org or platform-wide).
 */
exports.announcementRouter.get('/', async (req, res, next) => {
    try {
        const { organizationId, courseId, page, limit } = req.query;
        const result = await announcement_service_1.announcementService.listAnnouncements(uid(req), {
            organizationId,
            courseId,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
        ok(res, result);
    }
    catch (e) {
        next(e);
    }
});
/**
 * GET /api/announcements/unread-count
 * Get unread badge count.
 */
exports.announcementRouter.get('/unread-count', async (req, res, next) => {
    try {
        const count = await announcement_service_1.announcementService.getUnreadCount(uid(req));
        ok(res, { count });
    }
    catch (e) {
        next(e);
    }
});
/**
 * GET /api/announcements/:id
 * Get a single announcement (auto-marks read).
 */
exports.announcementRouter.get('/:id', async (req, res, next) => {
    try {
        const announcement = await announcement_service_1.announcementService.getAnnouncement(req.params.id, uid(req));
        ok(res, announcement);
    }
    catch (e) {
        next(e);
    }
});
/**
 * POST /api/announcements/:id/read
 * Mark a single announcement as read.
 */
exports.announcementRouter.post('/:id/read', async (req, res, next) => {
    try {
        await announcement_service_1.announcementService.markRead(req.params.id, uid(req));
        ok(res, { read: true });
    }
    catch (e) {
        next(e);
    }
});
/**
 * POST /api/announcements/read-all
 * Mark all announcements as read.
 */
exports.announcementRouter.post('/read-all', async (req, res, next) => {
    try {
        const count = await announcement_service_1.announcementService.markAllRead(uid(req));
        ok(res, { markedRead: count });
    }
    catch (e) {
        next(e);
    }
});
// ─── Admin/Instructor ─────────────────────────────────────────────────────────
/**
 * POST /api/announcements
 * Create an announcement.
 */
exports.announcementRouter.post('/', async (req, res, next) => {
    try {
        const announcement = await announcement_service_1.announcementService.createAnnouncement(uid(req), req.body);
        ok(res, announcement);
    }
    catch (e) {
        next(e);
    }
});
/**
 * PUT /api/announcements/:id
 * Update an announcement.
 */
exports.announcementRouter.put('/:id', async (req, res, next) => {
    try {
        const announcement = await announcement_service_1.announcementService.updateAnnouncement(req.params.id, uid(req), req.body);
        ok(res, announcement);
    }
    catch (e) {
        next(e);
    }
});
/**
 * DELETE /api/announcements/:id
 * Delete an announcement.
 */
exports.announcementRouter.delete('/:id', async (req, res, next) => {
    try {
        await announcement_service_1.announcementService.deleteAnnouncement(req.params.id, uid(req));
        ok(res, { deleted: true });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=announcement.routes.js.map