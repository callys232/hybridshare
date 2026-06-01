"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const organization_service_1 = require("../services/organization.service");
exports.organizationRouter = (0, express_1.Router)();
const ok = (res, data) => res.json({ success: true, data, error: null });
const uid = (req) => req.user.sub;
// All org routes require auth
exports.organizationRouter.use(auth_middleware_1.authenticate);
// ─── Organization CRUD ───────────────────────────────────────────────────────
/**
 * GET /api/organizations/my
 * Get the user's organization.
 */
exports.organizationRouter.get('/my', async (req, res, next) => {
    try {
        const org = await organization_service_1.organizationService.getUserOrganization(uid(req));
        ok(res, org);
    }
    catch (e) {
        next(e);
    }
});
/**
 * GET /api/organizations/:id
 */
exports.organizationRouter.get('/:id', async (req, res, next) => {
    try {
        const org = await organization_service_1.organizationService.getOrganization(req.params.id);
        ok(res, org);
    }
    catch (e) {
        next(e);
    }
});
/**
 * POST /api/organizations
 * Create a new organization.
 */
exports.organizationRouter.post('/', async (req, res, next) => {
    try {
        const org = await organization_service_1.organizationService.createOrganization(uid(req), req.body);
        ok(res, org);
    }
    catch (e) {
        next(e);
    }
});
/**
 * PUT /api/organizations/:id
 * Update org settings.
 */
exports.organizationRouter.put('/:id', async (req, res, next) => {
    try {
        const org = await organization_service_1.organizationService.updateOrganization(req.params.id, uid(req), req.body);
        ok(res, org);
    }
    catch (e) {
        next(e);
    }
});
// ─── Members ─────────────────────────────────────────────────────────────────
/**
 * GET /api/organizations/:id/members
 */
exports.organizationRouter.get('/:id/members', async (req, res, next) => {
    try {
        const members = await organization_service_1.organizationService.getMembers(req.params.id, uid(req));
        ok(res, members);
    }
    catch (e) {
        next(e);
    }
});
/**
 * POST /api/organizations/:id/members
 * Invite a member by email.
 */
exports.organizationRouter.post('/:id/members', async (req, res, next) => {
    try {
        const member = await organization_service_1.organizationService.inviteMember(req.params.id, uid(req), req.body);
        ok(res, member);
    }
    catch (e) {
        next(e);
    }
});
/**
 * PUT /api/organizations/:id/members/:memberId
 * Update member role.
 */
exports.organizationRouter.put('/:id/members/:memberId', async (req, res, next) => {
    try {
        const member = await organization_service_1.organizationService.updateMemberRole(req.params.id, req.params.memberId, uid(req), req.body.role);
        ok(res, member);
    }
    catch (e) {
        next(e);
    }
});
/**
 * DELETE /api/organizations/:id/members/:memberId
 * Remove a member from org.
 */
exports.organizationRouter.delete('/:id/members/:memberId', async (req, res, next) => {
    try {
        await organization_service_1.organizationService.removeMember(req.params.id, req.params.memberId, uid(req));
        ok(res, { removed: true });
    }
    catch (e) {
        next(e);
    }
});
// ─── SSO ─────────────────────────────────────────────────────────────────────
/**
 * GET /api/organizations/:id/sso
 */
exports.organizationRouter.get('/:id/sso', async (req, res, next) => {
    try {
        const config = await organization_service_1.organizationService.getSSOConfig(req.params.id, uid(req));
        ok(res, config);
    }
    catch (e) {
        next(e);
    }
});
/**
 * PUT /api/organizations/:id/sso
 * Upsert SSO configuration.
 */
exports.organizationRouter.put('/:id/sso', rateLimit_middleware_1.sensitiveRateLimit, async (req, res, next) => {
    try {
        const config = await organization_service_1.organizationService.upsertSSOConfig(req.params.id, uid(req), req.body);
        ok(res, config);
    }
    catch (e) {
        next(e);
    }
});
// ─── White-label ──────────────────────────────────────────────────────────────
/**
 * GET /api/organizations/:id/branding
 */
exports.organizationRouter.get('/:id/branding', async (req, res, next) => {
    try {
        const branding = await organization_service_1.organizationService.getWhiteLabel(req.params.id, uid(req));
        ok(res, branding);
    }
    catch (e) {
        next(e);
    }
});
/**
 * PUT /api/organizations/:id/branding
 */
exports.organizationRouter.put('/:id/branding', async (req, res, next) => {
    try {
        const branding = await organization_service_1.organizationService.upsertWhiteLabel(req.params.id, uid(req), req.body);
        ok(res, branding);
    }
    catch (e) {
        next(e);
    }
});
// ─── API Keys ─────────────────────────────────────────────────────────────────
/**
 * GET /api/organizations/:id/api-keys
 */
exports.organizationRouter.get('/:id/api-keys', async (req, res, next) => {
    try {
        const keys = await organization_service_1.organizationService.listApiKeys(req.params.id, uid(req));
        ok(res, keys);
    }
    catch (e) {
        next(e);
    }
});
/**
 * POST /api/organizations/:id/api-keys
 * Creates key — raw value returned ONCE, stored as hash.
 */
exports.organizationRouter.post('/:id/api-keys', rateLimit_middleware_1.sensitiveRateLimit, async (req, res, next) => {
    try {
        const key = await organization_service_1.organizationService.createApiKey(req.params.id, uid(req), req.body);
        ok(res, key);
    }
    catch (e) {
        next(e);
    }
});
/**
 * DELETE /api/organizations/:id/api-keys/:keyId
 * Revoke an API key.
 */
exports.organizationRouter.delete('/:id/api-keys/:keyId', async (req, res, next) => {
    try {
        await organization_service_1.organizationService.revokeApiKey(req.params.id, req.params.keyId, uid(req));
        ok(res, { revoked: true });
    }
    catch (e) {
        next(e);
    }
});
// ─── Webhooks ─────────────────────────────────────────────────────────────────
/**
 * GET /api/organizations/:id/webhooks
 */
exports.organizationRouter.get('/:id/webhooks', async (req, res, next) => {
    try {
        const webhooks = await organization_service_1.organizationService.listWebhooks(req.params.id, uid(req));
        ok(res, webhooks);
    }
    catch (e) {
        next(e);
    }
});
/**
 * POST /api/organizations/:id/webhooks
 */
exports.organizationRouter.post('/:id/webhooks', async (req, res, next) => {
    try {
        const webhook = await organization_service_1.organizationService.createWebhook(req.params.id, uid(req), req.body);
        ok(res, webhook);
    }
    catch (e) {
        next(e);
    }
});
/**
 * PUT /api/organizations/:id/webhooks/:webhookId
 */
exports.organizationRouter.put('/:id/webhooks/:webhookId', async (req, res, next) => {
    try {
        const webhook = await organization_service_1.organizationService.updateWebhook(req.params.id, req.params.webhookId, uid(req), req.body);
        ok(res, webhook);
    }
    catch (e) {
        next(e);
    }
});
/**
 * DELETE /api/organizations/:id/webhooks/:webhookId
 */
exports.organizationRouter.delete('/:id/webhooks/:webhookId', async (req, res, next) => {
    try {
        await organization_service_1.organizationService.deleteWebhook(req.params.id, req.params.webhookId, uid(req));
        ok(res, { deleted: true });
    }
    catch (e) {
        next(e);
    }
});
/**
 * GET /api/organizations/:id/webhooks/:webhookId/deliveries
 * View delivery history.
 */
exports.organizationRouter.get('/:id/webhooks/:webhookId/deliveries', async (req, res, next) => {
    try {
        const deliveries = await organization_service_1.organizationService.getWebhookDeliveries(req.params.webhookId, uid(req));
        ok(res, deliveries);
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=organization.routes.js.map