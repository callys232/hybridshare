"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scormRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const scorm_service_1 = require("../services/scorm.service");
exports.scormRouter = (0, express_1.Router)();
const ok = (res, data) => res.json({ success: true, data, error: null });
const uid = (req) => req.user.sub;
// ─── Package Management ───────────────────────────────────────────────────────
/**
 * GET /api/scorm/packages/:courseId
 * List SCORM packages for a course.
 */
exports.scormRouter.get('/packages/:courseId', async (req, res, next) => {
    try {
        const packages = await scorm_service_1.scormService.listPackages(req.params.courseId);
        ok(res, packages);
    }
    catch (e) {
        next(e);
    }
});
/**
 * GET /api/scorm/packages/single/:packageId
 */
exports.scormRouter.get('/packages/single/:packageId', async (req, res, next) => {
    try {
        const pkg = await scorm_service_1.scormService.getPackage(req.params.packageId);
        ok(res, pkg);
    }
    catch (e) {
        next(e);
    }
});
// Auth required below
exports.scormRouter.use(auth_middleware_1.authenticate);
/**
 * POST /api/scorm/packages
 * Register a newly-uploaded SCORM package.
 */
exports.scormRouter.post('/packages', async (req, res, next) => {
    try {
        const pkg = await scorm_service_1.scormService.createPackage({ ...req.body, uploadedById: uid(req) });
        ok(res, pkg);
    }
    catch (e) {
        next(e);
    }
});
// ─── Session Tracking ─────────────────────────────────────────────────────────
/**
 * GET /api/scorm/sessions/:packageId
 * Get or create a SCORM session for the current user.
 */
exports.scormRouter.get('/sessions/:packageId', async (req, res, next) => {
    try {
        const session = await scorm_service_1.scormService.getOrCreateSession(req.params.packageId, uid(req));
        ok(res, session);
    }
    catch (e) {
        next(e);
    }
});
/**
 * PUT /api/scorm/sessions/:sessionId
 * Called by LMSSetValue / SetValue from the SCORM runtime shim.
 */
exports.scormRouter.put('/sessions/:sessionId', async (req, res, next) => {
    try {
        const session = await scorm_service_1.scormService.updateSession(req.params.sessionId, uid(req), req.body);
        ok(res, session);
    }
    catch (e) {
        next(e);
    }
});
// ─── xAPI / Tin Can ───────────────────────────────────────────────────────────
/**
 * POST /api/scorm/xapi/statements
 * Store an xAPI statement.
 */
exports.scormRouter.post('/xapi/statements', async (req, res, next) => {
    try {
        const statement = await scorm_service_1.scormService.storeXAPIStatement({
            ...req.body,
            userId: uid(req),
        });
        ok(res, statement);
    }
    catch (e) {
        next(e);
    }
});
/**
 * GET /api/scorm/xapi/statements
 * Query xAPI statements.
 */
exports.scormRouter.get('/xapi/statements', async (req, res, next) => {
    try {
        const { courseId, verb, limit } = req.query;
        const statements = await scorm_service_1.scormService.getXAPIStatements({
            userId: uid(req),
            courseId,
            verb,
            limit: limit ? parseInt(limit) : 50,
        });
        ok(res, statements);
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=scorm.routes.js.map