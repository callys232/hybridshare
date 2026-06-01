"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRouter = void 0;
const express_1 = require("express");
const analytics_service_1 = require("../services/analytics.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const paginate_1 = require("../utils/paginate");
const user_1 = require("@hybridshare/shared/types/user");
const router = (0, express_1.Router)();
exports.analyticsRouter = router;
router.use(auth_middleware_1.authMiddleware);
router.get('/storage', async (req, res) => {
    try {
        const { workspaceId } = req.query;
        const data = await analytics_service_1.analyticsService.getStorageBreakdown(workspaceId);
        res.status(200).json((0, paginate_1.apiResponse)(data));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.get('/activity', async (req, res) => {
    try {
        const { period, workspaceId, days } = req.query;
        const data = await analytics_service_1.analyticsService.getActivityTimeline(period ?? 'daily', workspaceId, parseInt(days ?? '30'));
        res.status(200).json((0, paginate_1.apiResponse)(data));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.get('/top-files', async (req, res) => {
    try {
        const { workspaceId, limit } = req.query;
        const data = await analytics_service_1.analyticsService.getTopFiles(workspaceId, parseInt(limit ?? '10'));
        res.status(200).json((0, paginate_1.apiResponse)(data));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.get('/users', (0, rbac_middleware_1.requireRole)(user_1.UserRole.MANAGER), async (req, res) => {
    try {
        const data = await analytics_service_1.analyticsService.getUserActivity();
        res.status(200).json((0, paginate_1.apiResponse)(data));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.get('/social', async (req, res) => {
    try {
        const data = await analytics_service_1.analyticsService.getSocialPerformance(req.user.id);
        res.status(200).json((0, paginate_1.apiResponse)(data));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.get('/system', (0, rbac_middleware_1.requireRole)(user_1.UserRole.MANAGER), async (req, res) => {
    try {
        const data = await analytics_service_1.analyticsService.getSystemStats();
        res.status(200).json((0, paginate_1.apiResponse)(data));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
//# sourceMappingURL=analytics.routes.js.map