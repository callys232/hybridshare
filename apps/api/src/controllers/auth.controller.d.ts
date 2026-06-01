import type { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware';
export declare class AuthController {
    register(req: Request, res: Response): Promise<void>;
    login(req: Request, res: Response): Promise<void>;
    refresh(req: Request, res: Response): Promise<void>;
    logout(req: AuthRequest, res: Response): Promise<void>;
    verifyEmail(req: Request, res: Response): Promise<void>;
    forgotPassword(req: Request, res: Response): Promise<void>;
    resetPassword(req: Request, res: Response): Promise<void>;
    setupTwoFactor(req: AuthRequest, res: Response): Promise<void>;
    verifyTwoFactor(req: AuthRequest, res: Response): Promise<void>;
    validateTwoFactor(req: AuthRequest, res: Response): Promise<void>;
    googleCallback(req: Request, res: Response): void;
    microsoftCallback(req: Request, res: Response): void;
    ldapLogin(req: Request, res: Response): Promise<void>;
}
export declare const authController: AuthController;
//# sourceMappingURL=auth.controller.d.ts.map