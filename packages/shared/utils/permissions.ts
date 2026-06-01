import { UserRole } from '../types/user';
import { WorkspaceRole } from '../types/workspace';
import { SharePermission } from '../types/file';

export function hasSystemRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    [UserRole.SUPER_ADMIN]: 100,
    [UserRole.ADMIN]: 80,
    [UserRole.MANAGER]: 60,
    [UserRole.MEMBER]: 40,
    [UserRole.VIEWER]: 20,
    [UserRole.GUEST]: 0,
  };
  return hierarchy[userRole] >= hierarchy[requiredRole];
}

export function hasWorkspaceRole(userRole: WorkspaceRole, requiredRole: WorkspaceRole): boolean {
  const hierarchy: Record<WorkspaceRole, number> = {
    [WorkspaceRole.OWNER]: 100,
    [WorkspaceRole.ADMIN]: 80,
    [WorkspaceRole.EDITOR]: 60,
    [WorkspaceRole.COMMENTER]: 40,
    [WorkspaceRole.VIEWER]: 20,
  };
  return hierarchy[userRole] >= hierarchy[requiredRole];
}

export function canShareFile(userRole: UserRole, workspaceRole?: WorkspaceRole): boolean {
  if (hasSystemRole(userRole, UserRole.ADMIN)) return true;
  if (workspaceRole) return hasWorkspaceRole(workspaceRole, WorkspaceRole.EDITOR);
  return hasSystemRole(userRole, UserRole.MEMBER);
}

export function canEditFile(userRole: UserRole, workspaceRole?: WorkspaceRole): boolean {
  if (hasSystemRole(userRole, UserRole.ADMIN)) return true;
  if (workspaceRole) return hasWorkspaceRole(workspaceRole, WorkspaceRole.EDITOR);
  return hasSystemRole(userRole, UserRole.MEMBER);
}

export function canDeleteFile(userRole: UserRole, workspaceRole?: WorkspaceRole): boolean {
  if (hasSystemRole(userRole, UserRole.ADMIN)) return true;
  if (workspaceRole) return hasWorkspaceRole(workspaceRole, WorkspaceRole.ADMIN);
  return hasSystemRole(userRole, UserRole.MANAGER);
}

export function canManageWorkspace(userRole: UserRole, workspaceRole?: WorkspaceRole): boolean {
  if (hasSystemRole(userRole, UserRole.ADMIN)) return true;
  if (workspaceRole) return hasWorkspaceRole(workspaceRole, WorkspaceRole.ADMIN);
  return false;
}

export function canManageUsers(userRole: UserRole): boolean {
  return hasSystemRole(userRole, UserRole.ADMIN);
}

export function canViewAnalytics(userRole: UserRole, workspaceRole?: WorkspaceRole): boolean {
  if (hasSystemRole(userRole, UserRole.MANAGER)) return true;
  if (workspaceRole) return hasWorkspaceRole(workspaceRole, WorkspaceRole.ADMIN);
  return false;
}

export function hasSharePermission(permissions: SharePermission[], required: SharePermission): boolean {
  return permissions.includes(required);
}

export function isShareExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() > new Date(expiresAt);
}

export function isShareViewLimitReached(viewCount: number, maxViews: number | null): boolean {
  if (!maxViews) return false;
  return viewCount >= maxViews;
}
