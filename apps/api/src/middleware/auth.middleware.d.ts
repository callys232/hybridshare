import type { Request, Response, NextFunction } from 'express';
import type { JwtPayload } from '@hybridshare/shared/types/user';
export interface AuthRequest extends Request {
    user?: JwtPayload & {
        id: string;
    };
}
export declare function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map