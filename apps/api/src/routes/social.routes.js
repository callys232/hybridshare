"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socialRouter = void 0;
const express_1 = require("express");
const social_service_1 = require("../services/social.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const paginate_1 = require("../utils/paginate");
const router = (0, express_1.Router)();
exports.socialRouter = router;
router.use(auth_middleware_1.authMiddleware);
router.post('/share', async (req, res) => {
    try {
        const data = req.body;
        const share = await social_service_1.socialService.publishPost(req.user.id, data);
        res.status(201).json((0, paginate_1.apiResponse)(share));
    }
    catch (err) {
        const error = err;
        res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
    }
});
router.post('/schedule', async (req, res) => {
    try {
        const data = req.body;
        const share = await social_service_1.socialService.publishPost(req.user.id, data);
        res.status(201).json((0, paginate_1.apiResponse)(share));
    }
    catch (err) {
        const error = err;
        res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
    }
});
router.get('/posts', async (req, res) => {
    try {
        const query = req.query;
        const result = await social_service_1.socialService.listPosts(req.user.id, {
            page: parseInt(query.page ?? '1'),
            limit: parseInt(query.limit ?? '20'),
        });
        res.status(200).json({ success: true, data: result.items, error: null, meta: result.meta });
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.delete('/posts/:id', async (req, res) => {
    try {
        await social_service_1.socialService.cancelPost(req.params.id, req.user.id);
        res.status(200).json((0, paginate_1.apiResponse)({ message: 'Post cancelled' }));
    }
    catch (err) {
        const error = err;
        res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
    }
});
router.get('/analytics/:postId', async (req, res) => {
    try {
        const analytics = await social_service_1.socialService.getPostAnalytics(req.params.postId, req.user.id);
        res.status(200).json((0, paginate_1.apiResponse)(analytics));
    }
    catch (err) {
        const error = err;
        res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
    }
});
//# sourceMappingURL=social.routes.js.map