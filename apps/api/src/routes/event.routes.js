"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const event_service_1 = require("../services/event.service");
exports.eventRouter = (0, express_1.Router)();
const ok = (res, data) => res.json({ success: true, data, error: null });
// Public event tracking endpoint (no auth required for anonymous tracking)
exports.eventRouter.post('/track', async (req, res, next) => {
    try {
        const userId = req.user?.sub;
        await event_service_1.eventService.track(req.body, userId, req.ip, req.headers['user-agent']);
        res.status(204).end();
    }
    catch (e) {
        next(e);
    }
});
exports.eventRouter.post('/track/batch', async (req, res, next) => {
    try {
        const userId = req.user?.sub;
        await event_service_1.eventService.trackBatch(req.body.events, userId, req.ip, req.headers['user-agent']);
        res.status(204).end();
    }
    catch (e) {
        next(e);
    }
});
// Analytics — admin only
exports.eventRouter.use(auth_middleware_1.authenticate);
exports.eventRouter.get('/analytics', async (req, res, next) => {
    try {
        const { from, to, granularity } = req.query;
        const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate = to ? new Date(to) : new Date();
        ok(res, await event_service_1.eventService.getAnalytics(null, fromDate, toDate, (granularity ?? 'day')));
    }
    catch (e) {
        next(e);
    }
});
exports.eventRouter.get('/analytics/learning', async (req, res, next) => {
    try {
        const { from, to } = req.query;
        const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate = to ? new Date(to) : new Date();
        ok(res, await event_service_1.eventService.getLearningAnalytics(fromDate, toDate));
    }
    catch (e) {
        next(e);
    }
});
exports.eventRouter.get('/user/:userId/journey', async (req, res, next) => {
    try {
        ok(res, await event_service_1.eventService.getUserJourney(req.params.userId));
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=event.routes.js.map