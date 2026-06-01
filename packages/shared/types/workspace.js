"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceRole = exports.WorkspaceType = void 0;
var WorkspaceType;
(function (WorkspaceType) {
    WorkspaceType["PERSONAL"] = "PERSONAL";
    WorkspaceType["TEAM"] = "TEAM";
    WorkspaceType["PROJECT"] = "PROJECT";
    WorkspaceType["DEPARTMENT"] = "DEPARTMENT";
})(WorkspaceType || (exports.WorkspaceType = WorkspaceType = {}));
var WorkspaceRole;
(function (WorkspaceRole) {
    WorkspaceRole["OWNER"] = "OWNER";
    WorkspaceRole["ADMIN"] = "ADMIN";
    WorkspaceRole["EDITOR"] = "EDITOR";
    WorkspaceRole["VIEWER"] = "VIEWER";
    WorkspaceRole["COMMENTER"] = "COMMENTER";
})(WorkspaceRole || (exports.WorkspaceRole = WorkspaceRole = {}));
//# sourceMappingURL=workspace.js.map