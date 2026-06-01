import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware';
export declare class ShareController {
    create(req: AuthRequest, res: Response): Promise<void>;
    list(req: AuthRequest, res: Response): Promise<void>;
    resolve(req: AuthRequest, res: Response): Promise<void>;
    listFiles(req: AuthRequest, res: Response): Promise<void>;
    verifyPassword(req: AuthRequest, res: Response): Promise<void>;
    revoke(req: AuthRequest, res: Response): Promise<void>;
    getAnalytics(req: AuthRequest, res: Response): Promise<void>;
}
export declare const shareController: ShareController;
//# sourceMappingURL=share.controller.d.ts.map