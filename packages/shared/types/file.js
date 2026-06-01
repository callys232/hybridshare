"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharePermission = exports.FileStatus = exports.FileType = void 0;
var FileType;
(function (FileType) {
    FileType["FILE"] = "FILE";
    FileType["FOLDER"] = "FOLDER";
})(FileType || (exports.FileType = FileType = {}));
var FileStatus;
(function (FileStatus) {
    FileStatus["ACTIVE"] = "ACTIVE";
    FileStatus["DELETED"] = "DELETED";
    FileStatus["PROCESSING"] = "PROCESSING";
    FileStatus["INFECTED"] = "INFECTED";
})(FileStatus || (exports.FileStatus = FileStatus = {}));
var SharePermission;
(function (SharePermission) {
    SharePermission["VIEW"] = "VIEW";
    SharePermission["DOWNLOAD"] = "DOWNLOAD";
    SharePermission["COMMENT"] = "COMMENT";
    SharePermission["EDIT"] = "EDIT";
})(SharePermission || (exports.SharePermission = SharePermission = {}));
//# sourceMappingURL=file.js.map