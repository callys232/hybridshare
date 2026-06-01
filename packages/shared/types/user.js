"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProvider = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["MANAGER"] = "MANAGER";
    UserRole["MEMBER"] = "MEMBER";
    UserRole["VIEWER"] = "VIEWER";
    UserRole["GUEST"] = "GUEST";
})(UserRole || (exports.UserRole = UserRole = {}));
var AuthProvider;
(function (AuthProvider) {
    AuthProvider["LOCAL"] = "LOCAL";
    AuthProvider["GOOGLE"] = "GOOGLE";
    AuthProvider["MICROSOFT"] = "MICROSOFT";
    AuthProvider["LDAP"] = "LDAP";
})(AuthProvider || (exports.AuthProvider = AuthProvider = {}));
//# sourceMappingURL=user.js.map