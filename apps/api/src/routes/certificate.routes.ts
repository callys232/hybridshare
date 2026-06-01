import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { certificateRateLimit } from '../middleware/rateLimit.middleware';
import { certificateService } from '../services/certificate.service';
import type { Request, Response, NextFunction } from 'express';

export const certificateRouter = Router();

const ok = (res: Response, data: unknown) => res.json({ success: true, data, error: null });
const uid = (req: Request) => (req as Request & { user: { sub: string } }).user.sub;

// ─── Public ──────────────────────────────────────────────────────────────────

/**
 * GET /api/certificates/verify/:credentialId
 * Public verification endpoint — no auth required.
 * BizEvent: certificate_verified → /my-learning?tab=certificates
 */
certificateRouter.get('/verify/:credentialId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cert = await certificateService.verifyCertificate(req.params.credentialId);
    ok(res, cert);
  } catch (e) {
    next(e);
  }
});

// ─── Auth Required ───────────────────────────────────────────────────────────

certificateRouter.use(authenticate);

/**
 * GET /api/certificates
 * List current user's certificates.
 */
certificateRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const certs = await certificateService.getUserCertificates(uid(req));
    ok(res, certs);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/certificates/:id
 * Get a single certificate (owner only).
 */
certificateRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cert = await certificateService.getCertificate(req.params.id, uid(req));
    ok(res, cert);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/certificates/issue/:enrollmentId
 * Manually trigger certificate issuance (normally auto-triggered on completion).
 * Rate limited: 20/hour.
 */
certificateRouter.post('/issue/:enrollmentId', certificateRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cert = await certificateService.issueCertificate(req.params.enrollmentId);
    ok(res, cert);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/certificates/:id/revoke
 * Admin: revoke a certificate.
 */
certificateRouter.delete('/:id/revoke', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await certificateService.revokeCertificate(req.params.id, req.body.reason);
    ok(res, { revoked: true });
  } catch (e) {
    next(e);
  }
});
