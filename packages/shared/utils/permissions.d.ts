import { UserRole } from '../types/user';
import { WorkspaceRole } from '../types/workspace';
import { SharePermission } from '../types/file';
export declare function hasSystemRole(userRole: UserRole, requiredRole: UserRole): boolean;
export declare function hasWorkspaceRole(userRole: WorkspaceRole, requiredRole: WorkspaceRole): boolean;
export declare function canShareFile(userRole: UserRole, workspaceRole?: WorkspaceRole): boolean;
export declare function canEditFile(userRole: UserRole, workspaceRole?: WorkspaceRole): boolean;
export declare function canDeleteFile(userRole: UserRole, workspaceRole?: WorkspaceRole): boolean;
export declare function canManageWorkspace(userRole: UserRole, workspaceRole?: WorkspaceRole): boolean;
export declare function canManageUsers(userRole: UserRole): boolean;
export declare function canViewAnalytics(userRole: UserRole, workspaceRole?: WorkspaceRole): boolean;
export declare function hasSharePermission(permissions: SharePermission[], required: SharePermission): boolean;
export declare function isShareExpired(expiresAt: Date | null): boolean;
export declare function isShareViewLimitReached(viewCount: number, maxViews: number | null): boolean;
//# sourceMappingURL=permissions.d.ts.map