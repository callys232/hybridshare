"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.certificateRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const certificate_service_1 = require("../services/certificate.service");
exports.certificateRouter = (0, express_1.Router)();
const ok = (res, data) => res.json({ success: true, data, error: null });
const uid = (req) => req.user.sub;
// ─── Public ──────────────────────────────────────────────────────────────────
/**
 * GET /api/certificates/verify/:credentialId
 * Public verification endpoint — no auth required.
 * BizEvent: certificate_verified → /my-learning?tab=certificates
 */
exports.certificateRouter.get('/verify/:credentialId', async (req, res, next) => {
    try {
        const cert = await certificate_service_1.certificateService.verifyCertificate(req.params.credentialId);
        ok(res, cert);
    }
    catch (e) {
        next(e);
    }
});
// ─── Auth Required ───────────────────────────────────────────────────────────
exports.certificateRouter.use(auth_middleware_1.authenticate);
/**
 * GET /api/certificates
 * List current user's certificates.
 */
exports.certificateRouter.get('/', async (req, res, next) => {
    try {
        const certs = await certificate_service_1.certificateService.getUserCertificates(uid(req));
        ok(res, certs);
    }
    catch (e) {
        next(e);
    }
});
/**
 * GET /api/certificates/:id
 * Get a single certificate (owner only).
 */
exports.certificateRouter.get('/:id', async (req, res, next) => {
    try {
        const cert = await certificate_service_1.certificateService.getCertificate(req.params.id, uid(req));
        ok(res, cert);
    }
    catch (e) {
        next(e);
    }
});
/**
 * POST /api/certificates/issue/:enrollmentId
 * Manually trigger certificate issuance (normally auto-triggered on completion).
 * Rate limited: 20/hour.
 */
exports.certificateRouter.post('/issue/:enrollmentId', rateLimit_middleware_1.certificateRateLimit, async (req, res, next) => {
    try {
        const cert = await certificate_service_1.certificateService.issueCertificate(req.params.enrollmentId);
        ok(res, cert);
    }
    catch (e) {
        next(e);
    }
});
/**
 * DELETE /api/certificates/:id/revoke
 * Admin: revoke a certificate.
 */
exports.certificateRouter.delete('/:id/revoke', async (req, res, next) => {
    try {
        await certificate_service_1.certificateService.revokeCertificate(req.params.id, req.body.reason);
        ok(res, { revoked: true });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=certificate.routes.js.map