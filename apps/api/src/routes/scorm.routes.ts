import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { scormService } from '../services/scorm.service';
import type { Request, Response, NextFunction } from 'express';

export const scormRouter = Router();

const ok = (res: Response, data: unknown) => res.json({ success: true, data, error: null });
const uid = (req: Request) => (req as Request & { user: { sub: string } }).user.sub;

// ─── Package Management ───────────────────────────────────────────────────────

/**
 * GET /api/scorm/packages/:courseId
 * List SCORM packages for a course.
 */
scormRouter.get('/packages/:courseId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const packages = await scormService.listPackages(req.params.courseId);
    ok(res, packages);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/scorm/packages/single/:packageId
 */
scormRouter.get('/packages/single/:packageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pkg = await scormService.getPackage(req.params.packageId);
    ok(res, pkg);
  } catch (e) {
    next(e);
  }
});

// Auth required below
scormRouter.use(authenticate);

/**
 * POST /api/scorm/packages
 * Register a newly-uploaded SCORM package.
 */
scormRouter.post('/packages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pkg = await scormService.createPackage({ ...req.body, uploadedById: uid(req) });
    ok(res, pkg);
  } catch (e) {
    next(e);
  }
});

// ─── Session Tracking ─────────────────────────────────────────────────────────

/**
 * GET /api/scorm/sessions/:packageId
 * Get or create a SCORM session for the current user.
 */
scormRouter.get('/sessions/:packageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await scormService.getOrCreateSession(req.params.packageId, uid(req));
    ok(res, session);
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/scorm/sessions/:sessionId
 * Called by LMSSetValue / SetValue from the SCORM runtime shim.
 */
scormRouter.put('/sessions/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await scormService.updateSession(req.params.sessionId, uid(req), req.body);
    ok(res, session);
  } catch (e) {
    next(e);
  }
});

// ─── xAPI / Tin Can ───────────────────────────────────────────────────────────

/**
 * POST /api/scorm/xapi/statements
 * Store an xAPI statement.
 */
scormRouter.post('/xapi/statements', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const statement = await scormService.storeXAPIStatement({
      ...req.body,
      userId: uid(req),
    });
    ok(res, statement);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/scorm/xapi/statements
 * Query xAPI statements.
 */
scormRouter.get('/xapi/statements', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, verb, limit } = req.query as Record<string, string>;
    const statements = await scormService.getXAPIStatements({
      userId: uid(req),
      courseId,
      verb,
      limit: limit ? parseInt(limit) : 50,
    });
    ok(res, statements);
  } catch (e) {
    next(e);
  }
});
