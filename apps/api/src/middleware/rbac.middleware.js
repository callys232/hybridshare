"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
exports.requireAdmin = requireAdmin;
exports.requireWorkspaceRole = requireWorkspaceRole;
exports.requireWorkspaceMembership = requireWorkspaceMembership;
exports.requireWorkspaceEditor = requireWorkspaceEditor;
exports.requireWorkspaceAdmin = requireWorkspaceAdmin;
const user_1 = require("@hybridshare/shared/types/user");
const permissions_1 = require("@hybridshare/shared/utils/permissions");
const database_1 = require("../config/database");
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, data: null, error: 'Authentication required' });
            return;
        }
        const userRole = req.user.role;
        const hasAccess = roles.some((role) => (0, permissions_1.hasSystemRole)(userRole, role));
        if (!hasAccess) {
            res.status(403).json({ success: false, data: null, error: 'Insufficient permissions' });
            return;
        }
        next();
    };
}
function requireAdmin() {
    return requireRole(user_1.UserRole.ADMIN, user_1.UserRole.SUPER_ADMIN);
}
function requireWorkspaceRole(requiredRole, paramKey = 'id') {
    return async (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, data: null, error: 'Authentication required' });
            return;
        }
        const workspaceId = req.params[paramKey] || req.body.workspaceId;
        if (!workspaceId) {
            res.status(400).json({ success: false, data: null, error: 'Workspace ID required' });
            return;
        }
        const userSystemRole = req.user.role;
        if ((0, permissions_1.hasSystemRole)(userSystemRole, user_1.UserRole.ADMIN)) {
            next();
            return;
        }
        try {
            const member = await database_1.prisma.workspaceMember.findUnique({
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
            if (!(0, permissions_1.hasWorkspaceRole)(member.role, requiredRole)) {
                res.status(403).json({ success: false, data: null, error: 'Insufficient workspace permissions' });
                return;
            }
            next();
        }
        catch {
            res.status(500).json({ success: false, data: null, error: 'Failed to verify workspace permissions' });
        }
    };
}
function requireWorkspaceMembership(paramKey = 'id') {
    return requireWorkspaceRole(user_1.WorkspaceRole.VIEWER, paramKey);
}
function requireWorkspaceEditor(paramKey = 'id') {
    return requireWorkspaceRole(user_1.WorkspaceRole.EDITOR, paramKey);
}
function requireWorkspaceAdmin(paramKey = 'id') {
    return requireWorkspaceRole(user_1.WorkspaceRole.ADMIN, paramKey);
}
//# sourceMappingURL=rbac.middleware.js.map