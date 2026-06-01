"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldMapSchema = exports.UpdateConnectorSchema = exports.GraphQLCredentialsSchema = exports.RestApiCredentialsSchema = exports.NotionCredentialsSchema = exports.AirtableCredentialsSchema = exports.HubSpotCredentialsSchema = exports.MongoCredentialsSchema = exports.DatabaseCredentialsSchema = exports.SftpCredentialsSchema = exports.S3CredentialsSchema = exports.DropboxCredentialsSchema = exports.GoogleDriveCredentialsSchema = exports.BaseConnectorSchema = void 0;
const zod_1 = require("zod");
const connector_1 = require("../types/connector");
exports.BaseConnectorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    type: zod_1.z.nativeEnum(connector_1.ConnectorType),
    syncMode: zod_1.z.nativeEnum(connector_1.SyncMode).default(connector_1.SyncMode.MANUAL),
    syncInterval: zod_1.z.number().int().min(5).max(10080).nullable().optional(),
    workspaceId: zod_1.z.string().uuid().nullable().optional(),
    config: zod_1.z.record(zod_1.z.unknown()).optional().default({}),
});
exports.GoogleDriveCredentialsSchema = zod_1.z.object({
    accessToken: zod_1.z.string(),
    refreshToken: zod_1.z.string(),
    tokenExpiry: zod_1.z.string().datetime(),
    folderId: zod_1.z.string().optional(),
});
exports.DropboxCredentialsSchema = zod_1.z.object({
    accessToken: zod_1.z.string(),
    refreshToken: zod_1.z.string().optional(),
    accountId: zod_1.z.string().optional(),
});
exports.S3CredentialsSchema = zod_1.z.object({
    accessKeyId: zod_1.z.string().min(1),
    secretAccessKey: zod_1.z.string().min(1),
    region: zod_1.z.string().min(1),
    bucket: zod_1.z.string().min(1),
    endpoint: zod_1.z.string().url().optional(),
});
exports.SftpCredentialsSchema = zod_1.z.object({
    host: zod_1.z.string().min(1),
    port: zod_1.z.number().int().default(22),
    username: zod_1.z.string().min(1),
    password: zod_1.z.string().optional(),
    privateKey: zod_1.z.string().optional(),
    remotePath: zod_1.z.string().default('/'),
});
exports.DatabaseCredentialsSchema = zod_1.z.object({
    host: zod_1.z.string().min(1),
    port: zod_1.z.number().int(),
    database: zod_1.z.string().min(1),
    username: zod_1.z.string().min(1),
    password: zod_1.z.string(),
    ssl: zod_1.z.boolean().default(false),
});
exports.MongoCredentialsSchema = zod_1.z.object({
    connectionString: zod_1.z.string().min(1),
    database: zod_1.z.string().min(1),
});
exports.HubSpotCredentialsSchema = zod_1.z.object({
    accessToken: zod_1.z.string().min(1),
    refreshToken: zod_1.z.string().optional(),
    portalId: zod_1.z.string().optional(),
});
exports.AirtableCredentialsSchema = zod_1.z.object({
    apiKey: zod_1.z.string().min(1),
    baseId: zod_1.z.string().min(1),
});
exports.NotionCredentialsSchema = zod_1.z.object({
    apiKey: zod_1.z.string().min(1),
    databaseId: zod_1.z.string().optional(),
});
exports.RestApiCredentialsSchema = zod_1.z.object({
    baseUrl: zod_1.z.string().url(),
    authType: zod_1.z.enum(['none', 'bearer', 'basic', 'apikey', 'oauth2']),
    token: zod_1.z.string().optional(),
    username: zod_1.z.string().optional(),
    password: zod_1.z.string().optional(),
    apiKeyHeader: zod_1.z.string().optional(),
    apiKeyValue: zod_1.z.string().optional(),
});
exports.GraphQLCredentialsSchema = zod_1.z.object({
    endpoint: zod_1.z.string().url(),
    authType: zod_1.z.enum(['none', 'bearer', 'apikey']).default('none'),
    token: zod_1.z.string().optional(),
    headers: zod_1.z.record(zod_1.z.string()).optional(),
});
exports.UpdateConnectorSchema = exports.BaseConnectorSchema.partial().extend({
    isEnabled: zod_1.z.boolean().optional(),
});
exports.FieldMapSchema = zod_1.z.object({
    sourceField: zod_1.z.string().min(1),
    targetField: zod_1.z.string().min(1),
    transformation: zod_1.z.string().nullable().optional(),
    isRequired: zod_1.z.boolean().default(false),
});
//# sourceMappingURL=connector.schema.js.map