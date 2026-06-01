"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRouter = void 0;
const express_1 = require("express");
const notification_service_1 = require("../services/notification.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const paginate_1 = require("../utils/paginate");
const router = (0, express_1.Router)();
exports.notificationRouter = router;
router.use(auth_middleware_1.authMiddleware);
router.get('/', async (req, res) => {
    try {
        const result = await notification_service_1.notificationService.list(req.user.id, {
            page: parseInt(req.query.page ?? '1'),
            limit: parseInt(req.query.limit ?? '20'),
        });
        res.status(200).json({ success: true, data: result.items, error: null, meta: result.meta, unreadCount: result.unreadCount });
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.put('/read-all', async (req, res) => {
    try {
        await notification_service_1.notificationService.markAllRead(req.user.id);
        res.status(200).json((0, paginate_1.apiResponse)({ message: 'All notifications marked as read' }));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.put('/:id/read', async (req, res) => {
    try {
        await notification_service_1.notificationService.markRead(req.params.id, req.user.id);
        res.status(200).json((0, paginate_1.apiResponse)({ message: 'Notification marked as read' }));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.delete('/:id', async (req, res) => {
    try {
        await notification_service_1.notificationService.dismiss(req.params.id, req.user.id);
        res.status(200).json((0, paginate_1.apiResponse)({ message: 'Notification dismissed' }));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
//# sourceMappingURL=notification.routes.js.map