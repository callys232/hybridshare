import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { sensitiveRateLimit } from '../middleware/rateLimit.middleware';
import { validateApiKeyScope } from '../middleware/security.middleware';
import { organizationService } from '../services/organization.service';
import type { Request, Response, NextFunction } from 'express';

export const organizationRouter = Router();

const ok = (res: Response, data: unknown) => res.json({ success: true, data, error: null });
const uid = (req: Request) => (req as Request & { user: { sub: string } }).user.sub;

// All org routes require auth
organizationRouter.use(authenticate);

// ─── Organization CRUD ───────────────────────────────────────────────────────

/**
 * GET /api/organizations/my
 * Get the user's organization.
 */
organizationRouter.get('/my', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await organizationService.getUserOrganization(uid(req));
    ok(res, org);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/organizations/:id
 */
organizationRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await organizationService.getOrganization(req.params.id);
    ok(res, org);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/organizations
 * Create a new organization.
 */
organizationRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await organizationService.createOrganization(uid(req), req.body);
    ok(res, org);
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/organizations/:id
 * Update org settings.
 */
organizationRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await organizationService.updateOrganization(req.params.id, uid(req), req.body);
    ok(res, org);
  } catch (e) {
    next(e);
  }
});

// ─── Members ─────────────────────────────────────────────────────────────────

/**
 * GET /api/organizations/:id/members
 */
organizationRouter.get('/:id/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await organizationService.getMembers(req.params.id, uid(req));
    ok(res, members);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/organizations/:id/members
 * Invite a member by email.
 */
organizationRouter.post('/:id/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await organizationService.inviteMember(req.params.id, uid(req), req.body);
    ok(res, member);
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/organizations/:id/members/:memberId
 * Update member role.
 */
organizationRouter.put('/:id/members/:memberId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await organizationService.updateMemberRole(req.params.id, req.params.memberId, uid(req), req.body.role);
    ok(res, member);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/organizations/:id/members/:memberId
 * Remove a member from org.
 */
organizationRouter.delete('/:id/members/:memberId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await organizationService.removeMember(req.params.id, req.params.memberId, uid(req));
    ok(res, { removed: true });
  } catch (e) {
    next(e);
  }
});

// ─── SSO ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/organizations/:id/sso
 */
organizationRouter.get('/:id/sso', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await organizationService.getSSOConfig(req.params.id, uid(req));
    ok(res, config);
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/organizations/:id/sso
 * Upsert SSO configuration.
 */
organizationRouter.put('/:id/sso', sensitiveRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await organizationService.upsertSSOConfig(req.params.id, uid(req), req.body);
    ok(res, config);
  } catch (e) {
    next(e);
  }
});

// ─── White-label ──────────────────────────────────────────────────────────────

/**
 * GET /api/organizations/:id/branding
 */
organizationRouter.get('/:id/branding', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branding = await organizationService.getWhiteLabel(req.params.id, uid(req));
    ok(res, branding);
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/organizations/:id/branding
 */
organizationRouter.put('/:id/branding', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branding = await organizationService.upsertWhiteLabel(req.params.id, uid(req), req.body);
    ok(res, branding);
  } catch (e) {
    next(e);
  }
});

// ─── API Keys ─────────────────────────────────────────────────────────────────

/**
 * GET /api/organizations/:id/api-keys
 */
organizationRouter.get('/:id/api-keys', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keys = await organizationService.listApiKeys(req.params.id, uid(req));
    ok(res, keys);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/organizations/:id/api-keys
 * Creates key — raw value returned ONCE, stored as hash.
 */
organizationRouter.post('/:id/api-keys', sensitiveRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = await organizationService.createApiKey(req.params.id, uid(req), req.body);
    ok(res, key);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/organizations/:id/api-keys/:keyId
 * Revoke an API key.
 */
organizationRouter.delete('/:id/api-keys/:keyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await organizationService.revokeApiKey(req.params.id, req.params.keyId, uid(req));
    ok(res, { revoked: true });
  } catch (e) {
    next(e);
  }
});

// ─── Webhooks ─────────────────────────────────────────────────────────────────

/**
 * GET /api/organizations/:id/webhooks
 */
organizationRouter.get('/:id/webhooks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const webhooks = await organizationService.listWebhooks(req.params.id, uid(req));
    ok(res, webhooks);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/organizations/:id/webhooks
 */
organizationRouter.post('/:id/webhooks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const webhook = await organizationService.createWebhook(req.params.id, uid(req), req.body);
    ok(res, webhook);
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/organizations/:id/webhooks/:webhookId
 */
organizationRouter.put('/:id/webhooks/:webhookId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const webhook = await organizationService.updateWebhook(req.params.id, req.params.webhookId, uid(req), req.body);
    ok(res, webhook);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/organizations/:id/webhooks/:webhookId
 */
organizationRouter.delete('/:id/webhooks/:webhookId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await organizationService.deleteWebhook(req.params.id, req.params.webhookId, uid(req));
    ok(res, { deleted: true });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/organizations/:id/webhooks/:webhookId/deliveries
 * View delivery history.
 */
organizationRouter.get('/:id/webhooks/:webhookId/deliveries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deliveries = await organizationService.getWebhookDeliveries(req.params.webhookId, uid(req));
    ok(res, deliveries);
  } catch (e) {
    next(e);
  }
});
