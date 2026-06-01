import type { Response, NextFunction } from 'express';
import { UserRole, WorkspaceRole } from '@hybridshare/shared/types/user';
import { hasSystemRole, hasWorkspaceRole } from '@hybridshare/shared/utils/permissions';
import { prisma } from '../config/database';
import type { AuthRequest } from './auth.middleware';

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, data: null, error: 'Authentication required' });
      return;
    }

    const userRole = req.user.role as UserRole;
    const hasAccess = roles.some((role) => hasSystemRole(userRole, role));

    if (!hasAccess) {
      res.status(403).json({ success: false, data: null, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

export function requireAdmin() {
  return requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);
}

export function requireWorkspaceRole(requiredRole: WorkspaceRole, paramKey = 'id') {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, data: null, error: 'Authentication required' });
      return;
    }

    const workspaceId = req.params[paramKey] || req.body.workspaceId;

    if (!workspaceId) {
      res.status(400).json({ success: false, data: null, error: 'Workspace ID required' });
      return;
    }

    const userSystemRole = req.user.role as UserRole;
    if (hasSystemRole(userSystemRole, UserRole.ADMIN)) {
      next();
      return;
    }

    try {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: req.user.id,
          },
        },
      });

      if (!member) {
        res.status(403).json({ success: false, data: null, error: 'Not a member of this workspace' });
        return;
      }

      if (!hasWorkspaceRole(member.role as WorkspaceRole, requiredRole)) {
        res.status(403).json({ success: false, data: null, error: 'Insufficient workspace permissions' });
        return;
      }

      next();
    } catch {
      res.status(500).json({ success: false, data: null, error: 'Failed to verify workspace permissions' });
    }
  };
}

export function requireWorkspaceMembership(paramKey = 'id') {
  return requireWorkspaceRole(WorkspaceRole.VIEWER, paramKey);
}

export function requireWorkspaceEditor(paramKey = 'id') {
  return requireWorkspaceRole(WorkspaceRole.EDITOR, paramKey);
}

export function requireWorkspaceAdmin(paramKey = 'id') {
  return requireWorkspaceRole(WorkspaceRole.ADMIN, paramKey);
}
