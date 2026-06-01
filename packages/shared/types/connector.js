"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncMode = exports.ConnectorStatus = exports.ConnectorCategory = exports.ConnectorType = void 0;
var ConnectorType;
(function (ConnectorType) {
    // Cloud Storage
    ConnectorType["GOOGLE_DRIVE"] = "GOOGLE_DRIVE";
    ConnectorType["DROPBOX"] = "DROPBOX";
    ConnectorType["ONEDRIVE"] = "ONEDRIVE";
    ConnectorType["BOX"] = "BOX";
    ConnectorType["S3"] = "S3";
    ConnectorType["SFTP"] = "SFTP";
    // Databases
    ConnectorType["POSTGRES"] = "POSTGRES";
    ConnectorType["MYSQL"] = "MYSQL";
    ConnectorType["MONGODB"] = "MONGODB";
    ConnectorType["SQLITE"] = "SQLITE";
    ConnectorType["MSSQL"] = "MSSQL";
    ConnectorType["REDIS_DB"] = "REDIS_DB";
    // CRM / Productivity
    ConnectorType["HUBSPOT"] = "HUBSPOT";
    ConnectorType["ZOHO"] = "ZOHO";
    ConnectorType["SALESFORCE"] = "SALESFORCE";
    ConnectorType["NOTION"] = "NOTION";
    ConnectorType["AIRTABLE"] = "AIRTABLE";
    ConnectorType["GOOGLE_SHEETS"] = "GOOGLE_SHEETS";
    // Custom
    ConnectorType["REST_API"] = "REST_API";
    ConnectorType["GRAPHQL"] = "GRAPHQL";
    ConnectorType["WEBHOOK"] = "WEBHOOK";
    ConnectorType["CSV"] = "CSV";
})(ConnectorType || (exports.ConnectorType = ConnectorType = {}));
var ConnectorCategory;
(function (ConnectorCategory) {
    ConnectorCategory["CLOUD"] = "CLOUD";
    ConnectorCategory["DATABASE"] = "DATABASE";
    ConnectorCategory["CRM"] = "CRM";
    ConnectorCategory["CUSTOM"] = "CUSTOM";
})(ConnectorCategory || (exports.ConnectorCategory = ConnectorCategory = {}));
var ConnectorStatus;
(function (ConnectorStatus) {
    ConnectorStatus["CONNECTED"] = "CONNECTED";
    ConnectorStatus["DISCONNECTED"] = "DISCONNECTED";
    ConnectorStatus["ERROR"] = "ERROR";
    ConnectorStatus["SYNCING"] = "SYNCING";
    ConnectorStatus["PENDING"] = "PENDING";
})(ConnectorStatus || (exports.ConnectorStatus = ConnectorStatus = {}));
var SyncMode;
(function (SyncMode) {
    SyncMode["MANUAL"] = "MANUAL";
    SyncMode["SCHEDULED"] = "SCHEDULED";
    SyncMode["LIVE"] = "LIVE";
})(SyncMode || (exports.SyncMode = SyncMode = {}));
//# sourceMappingURL=connector.js.map