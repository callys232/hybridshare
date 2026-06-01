import type { Response, NextFunction } from 'express';
import { UserRole, WorkspaceRole } from '@hybridshare/shared/types/user';
import type { AuthRequest } from './auth.middleware';
export declare function requireRole(...roles: UserRole[]): (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare function requireAdmin(): (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare function requireWorkspaceRole(requiredRole: WorkspaceRole, paramKey?: string): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare function requireWorkspaceMembership(paramKey?: string): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare function requireWorkspaceEditor(paramKey?: string): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare function requireWorkspaceAdmin(paramKey?: string): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=rbac.middleware.d.ts.map