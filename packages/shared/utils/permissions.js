"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasSystemRole = hasSystemRole;
exports.hasWorkspaceRole = hasWorkspaceRole;
exports.canShareFile = canShareFile;
exports.canEditFile = canEditFile;
exports.canDeleteFile = canDeleteFile;
exports.canManageWorkspace = canManageWorkspace;
exports.canManageUsers = canManageUsers;
exports.canViewAnalytics = canViewAnalytics;
exports.hasSharePermission = hasSharePermission;
exports.isShareExpired = isShareExpired;
exports.isShareViewLimitReached = isShareViewLimitReached;
const user_1 = require("../types/user");
const workspace_1 = require("../types/workspace");
function hasSystemRole(userRole, requiredRole) {
    const hierarchy = {
        [user_1.UserRole.SUPER_ADMIN]: 100,
        [user_1.UserRole.ADMIN]: 80,
        [user_1.UserRole.MANAGER]: 60,
        [user_1.UserRole.MEMBER]: 40,
        [user_1.UserRole.VIEWER]: 20,
        [user_1.UserRole.GUEST]: 0,
    };
    return hierarchy[userRole] >= hierarchy[requiredRole];
}
function hasWorkspaceRole(userRole, requiredRole) {
    const hierarchy = {
        [workspace_1.WorkspaceRole.OWNER]: 100,
        [workspace_1.WorkspaceRole.ADMIN]: 80,
        [workspace_1.WorkspaceRole.EDITOR]: 60,
        [workspace_1.WorkspaceRole.COMMENTER]: 40,
        [workspace_1.WorkspaceRole.VIEWER]: 20,
    };
    return hierarchy[userRole] >= hierarchy[requiredRole];
}
function canShareFile(userRole, workspaceRole) {
    if (hasSystemRole(userRole, user_1.UserRole.ADMIN))
        return true;
    if (workspaceRole)
        return hasWorkspaceRole(workspaceRole, workspace_1.WorkspaceRole.EDITOR);
    return hasSystemRole(userRole, user_1.UserRole.MEMBER);
}
function canEditFile(userRole, workspaceRole) {
    if (hasSystemRole(userRole, user_1.UserRole.ADMIN))
        return true;
    if (workspaceRole)
        return hasWorkspaceRole(workspaceRole, workspace_1.WorkspaceRole.EDITOR);
    return hasSystemRole(userRole, user_1.UserRole.MEMBER);
}
function canDeleteFile(userRole, workspaceRole) {
    if (hasSystemRole(userRole, user_1.UserRole.ADMIN))
        return true;
    if (workspaceRole)
        return hasWorkspaceRole(workspaceRole, workspace_1.WorkspaceRole.ADMIN);
    return hasSystemRole(userRole, user_1.UserRole.MANAGER);
}
function canManageWorkspace(userRole, workspaceRole) {
    if (hasSystemRole(userRole, user_1.UserRole.ADMIN))
        return true;
    if (workspaceRole)
        return hasWorkspaceRole(workspaceRole, workspace_1.WorkspaceRole.ADMIN);
    return false;
}
function canManageUsers(userRole) {
    return hasSystemRole(userRole, user_1.UserRole.ADMIN);
}
function canViewAnalytics(userRole, workspaceRole) {
    if (hasSystemRole(userRole, user_1.UserRole.MANAGER))
        return true;
    if (workspaceRole)
        return hasWorkspaceRole(workspaceRole, workspace_1.WorkspaceRole.ADMIN);
    return false;
}
function hasSharePermission(permissions, required) {
    return permissions.includes(required);
}
function isShareExpired(expiresAt) {
    if (!expiresAt)
        return false;
    return new Date() > new Date(expiresAt);
}
function isShareViewLimitReached(viewCount, maxViews) {
    if (!maxViews)
        return false;
    return viewCount >= maxViews;
}
//# sourceMappingURL=permissions.js.map