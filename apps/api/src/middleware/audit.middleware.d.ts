import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.middleware';
interface AuditOptions {
    action: string;
    resourceType: string;
    getResourceId?: (req: AuthRequest) => string;
    getResourceName?: (req: AuthRequest, res: Response) => string;
    getMetadata?: (req: AuthRequest) => Record<string, unknown>;
}
export declare function auditLog(options: AuditOptions): (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare function auditMiddleware(req: AuthRequest, res: Response, next: NextFunction): void;
export {};
//# sourceMappingURL=audit.middleware.d.ts.map