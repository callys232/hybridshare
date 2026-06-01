"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const search_service_1 = require("../services/search.service");
const paginate_1 = require("../utils/paginate");
const router = (0, express_1.Router)();
exports.searchRouter = router;
router.get('/', auth_middleware_1.authMiddleware, rateLimit_middleware_1.searchRateLimit, async (req, res) => {
    try {
        const { q, workspaceId, type, dateFrom, dateTo, limit, offset } = req.query;
        const results = await search_service_1.searchService.search(q ?? '', {
            workspaceId,
            type,
            dateFrom,
            dateTo,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
        });
        res.status(200).json((0, paginate_1.apiResponse)(results));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.post('/reindex', auth_middleware_1.authMiddleware, (0, rbac_middleware_1.requireAdmin)(), async (req, res) => {
    try {
        const result = await search_service_1.searchService.reindex();
        res.status(200).json((0, paginate_1.apiResponse)(result));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
//# sourceMappingURL=search.routes.js.map