"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const router = (0, express_1.Router)();
exports.authRouter = router;
router.post('/register', rateLimit_middleware_1.authRateLimit, (req, res) => auth_controller_1.authController.register(req, res));
router.post('/login', rateLimit_middleware_1.authRateLimit, (req, res) => auth_controller_1.authController.login(req, res));
router.post('/refresh', (req, res) => auth_controller_1.authController.refresh(req, res));
router.post('/logout', auth_middleware_1.authMiddleware, (req, res) => auth_controller_1.authController.logout(req, res));
router.post('/verify-email', (req, res) => auth_controller_1.authController.verifyEmail(req, res));
router.post('/forgot-password', rateLimit_middleware_1.authRateLimit, (req, res) => auth_controller_1.authController.forgotPassword(req, res));
router.post('/reset-password', rateLimit_middleware_1.authRateLimit, (req, res) => auth_controller_1.authController.resetPassword(req, res));
router.post('/2fa/setup', auth_middleware_1.authMiddleware, (req, res) => auth_controller_1.authController.setupTwoFactor(req, res));
router.post('/2fa/verify', auth_middleware_1.authMiddleware, (req, res) => auth_controller_1.authController.verifyTwoFactor(req, res));
router.post('/2fa/validate', rateLimit_middleware_1.authRateLimit, (req, res) => auth_controller_1.authController.validateTwoFactor(req, res));
router.get('/oauth/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/oauth/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: '/auth/login?error=oauth_failed' }), (req, res) => auth_controller_1.authController.googleCallback(req, res));
router.get('/oauth/microsoft', passport_1.default.authenticate('azuread-openidconnect', { session: false }));
router.get('/oauth/microsoft/callback', passport_1.default.authenticate('azuread-openidconnect', { session: false, failureRedirect: '/auth/login?error=oauth_failed' }), (req, res) => auth_controller_1.authController.microsoftCallback(req, res));
router.post('/ldap', rateLimit_middleware_1.authRateLimit, (req, res) => auth_controller_1.authController.ldapLogin(req, res));
//# sourceMappingURL=auth.routes.js.map