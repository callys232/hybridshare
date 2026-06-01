"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shareRouter = void 0;
const express_1 = require("express");
const share_controller_1 = require("../controllers/share.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
exports.shareRouter = router;
router.post('/', auth_middleware_1.authMiddleware, (req, res) => share_controller_1.shareController.create(req, res));
router.get('/', auth_middleware_1.authMiddleware, (req, res) => share_controller_1.shareController.list(req, res));
router.get('/:token', auth_middleware_1.optionalAuthMiddleware, (req, res) => share_controller_1.shareController.resolve(req, res));
router.get('/:token/files', auth_middleware_1.optionalAuthMiddleware, (req, res) => share_controller_1.shareController.listFiles(req, res));
router.post('/:token/verify', (req, res) => share_controller_1.shareController.verifyPassword(req, res));
router.delete('/:id', auth_middleware_1.authMiddleware, (req, res) => share_controller_1.shareController.revoke(req, res));
router.get('/:id/analytics', auth_middleware_1.authMiddleware, (req, res) => share_controller_1.shareController.getAnalytics(req, res));
//# sourceMappingURL=share.routes.js.map