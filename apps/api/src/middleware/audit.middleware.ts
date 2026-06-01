import type { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import type { AuthRequest } from './auth.middleware';

interface AuditOptions {
  action: string;
  resourceType: string;
  getResourceId?: (req: AuthRequest) => string;
  getResourceName?: (req: AuthRequest, res: Response) => string;
  getMetadata?: (req: AuthRequest) => Record<string, unknown>;
}

export function auditLog(options: AuditOptions) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown) {
      const response = body as { success?: boolean };

      if (response?.success !== false) {
        const resourceId = options.getResourceId?.(req) || req.params.id || 'unknown';
        const metadata = options.getMetadata?.(req) || {};

        prisma.auditLog
          .create({
            data: {
              userId: req.user?.id || null,
              action: options.action,
              resourceType: options.resourceType,
              resourceId,
              resourceName: options.getResourceName?.(req, res),
              ipAddress: req.ip || req.headers['x-forwarded-for']?.toString(),
              userAgent: req.headers['user-agent'],
              metadata,
            },
          })
          .catch((err) => logger.error('Audit log write failed', { err }));
      }

      return originalJson(body);
    };

    next();
  };
}

export function auditMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (!mutatingMethods.includes(req.method)) {
    next();
    return;
  }

  const originalJson = res.json.bind(res);

  res.json = function (body: unknown) {
    const response = body as { success?: boolean };

    if (response?.success !== false && req.user) {
      const resourceType = req.path.split('/')[1] || 'unknown';
      const resourceId = req.params.id || 'unknown';

      prisma.auditLog
        .create({
          data: {
            userId: req.user.id,
            action: `${req.method} ${req.path}`,
            resourceType,
            resourceId,
            ipAddress: req.ip || req.headers['x-forwarded-for']?.toString(),
            userAgent: req.headers['user-agent'],
            metadata: { body: req.body, query: req.query },
          },
        })
        .catch((err) => logger.error('Audit middleware write failed', { err }));
    }

    return originalJson(body);
  };

  next();
}
