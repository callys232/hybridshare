import { z } from 'zod';
import { ConnectorType, SyncMode } from '../types/connector';
export declare const BaseConnectorSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodNativeEnum<typeof ConnectorType>;
    syncMode: z.ZodDefault<z.ZodNativeEnum<typeof SyncMode>>;
    syncInterval: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    workspaceId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    config: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, "strip", z.ZodTypeAny, {
    type: ConnectorType;
    name: string;
    config: Record<string, unknown>;
    syncMode: SyncMode;
    workspaceId?: string | null | undefined;
    syncInterval?: number | null | undefined;
}, {
    type: ConnectorType;
    name: string;
    workspaceId?: string | null | undefined;
    config?: Record<string, unknown> | undefined;
    syncMode?: SyncMode | undefined;
    syncInterval?: number | null | undefined;
}>;
export declare const GoogleDriveCredentialsSchema: z.ZodObject<{
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
    tokenExpiry: z.ZodString;
    folderId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
    accessToken: string;
    tokenExpiry: string;
    folderId?: string | undefined;
}, {
    refreshToken: string;
    accessToken: string;
    tokenExpiry: string;
    folderId?: string | undefined;
}>;
export declare const DropboxCredentialsSchema: z.ZodObject<{
    accessToken: z.ZodString;
    refreshToken: z.ZodOptional<z.ZodString>;
    accountId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessToken: string;
    refreshToken?: string | undefined;
    accountId?: string | undefined;
}, {
    accessToken: string;
    refreshToken?: string | undefined;
    accountId?: string | undefined;
}>;
export declare const S3CredentialsSchema: z.ZodObject<{
    accessKeyId: z.ZodString;
    secretAccessKey: z.ZodString;
    region: z.ZodString;
    bucket: z.ZodString;
    endpoint: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
    endpoint?: string | undefined;
}, {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
    endpoint?: string | undefined;
}>;
export declare const SftpCredentialsSchema: z.ZodObject<{
    host: z.ZodString;
    port: z.ZodDefault<z.ZodNumber>;
    username: z.ZodString;
    password: z.ZodOptional<z.ZodString>;
    privateKey: z.ZodOptional<z.ZodString>;
    remotePath: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    port: number;
    host: string;
    username: string;
    remotePath: string;
    password?: string | undefined;
    privateKey?: string | undefined;
}, {
    host: string;
    username: string;
    port?: number | undefined;
    password?: string | undefined;
    privateKey?: string | undefined;
    remotePath?: string | undefined;
}>;
export declare const DatabaseCredentialsSchema: z.ZodObject<{
    host: z.ZodString;
    port: z.ZodNumber;
    database: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
    ssl: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    port: number;
    host: string;
    password: string;
    username: string;
    database: string;
    ssl: boolean;
}, {
    port: number;
    host: string;
    password: string;
    username: string;
    database: string;
    ssl?: boolean | undefined;
}>;
export declare const MongoCredentialsSchema: z.ZodObject<{
    connectionString: z.ZodString;
    database: z.ZodString;
}, "strip", z.ZodTypeAny, {
    database: string;
    connectionString: string;
}, {
    database: string;
    connectionString: string;
}>;
export declare const HubSpotCredentialsSchema: z.ZodObject<{
    accessToken: z.ZodString;
    refreshToken: z.ZodOptional<z.ZodString>;
    portalId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessToken: string;
    refreshToken?: string | undefined;
    portalId?: string | undefined;
}, {
    accessToken: string;
    refreshToken?: string | undefined;
    portalId?: string | undefined;
}>;
export declare const AirtableCredentialsSchema: z.ZodObject<{
    apiKey: z.ZodString;
    baseId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    apiKey: string;
    baseId: string;
}, {
    apiKey: string;
    baseId: string;
}>;
export declare const NotionCredentialsSchema: z.ZodObject<{
    apiKey: z.ZodString;
    databaseId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    apiKey: string;
    databaseId?: string | undefined;
}, {
    apiKey: string;
    databaseId?: string | undefined;
}>;
export declare const RestApiCredentialsSchema: z.ZodObject<{
    baseUrl: z.ZodString;
    authType: z.ZodEnum<["none", "bearer", "basic", "apikey", "oauth2"]>;
    token: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    apiKeyHeader: z.ZodOptional<z.ZodString>;
    apiKeyValue: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    baseUrl: string;
    authType: "basic" | "none" | "bearer" | "apikey" | "oauth2";
    token?: string | undefined;
    password?: string | undefined;
    username?: string | undefined;
    apiKeyHeader?: string | undefined;
    apiKeyValue?: string | undefined;
}, {
    baseUrl: string;
    authType: "basic" | "none" | "bearer" | "apikey" | "oauth2";
    token?: string | undefined;
    password?: string | undefined;
    username?: string | undefined;
    apiKeyHeader?: string | undefined;
    apiKeyValue?: string | undefined;
}>;
export declare const GraphQLCredentialsSchema: z.ZodObject<{
    endpoint: z.ZodString;
    authType: z.ZodDefault<z.ZodEnum<["none", "bearer", "apikey"]>>;
    token: z.ZodOptional<z.ZodString>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    endpoint: string;
    authType: "none" | "bearer" | "apikey";
    headers?: Record<string, string> | undefined;
    token?: string | undefined;
}, {
    endpoint: string;
    headers?: Record<string, string> | undefined;
    token?: string | undefined;
    authType?: "none" | "bearer" | "apikey" | undefined;
}>;
export declare const UpdateConnectorSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof ConnectorType>>;
    syncMode: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<typeof SyncMode>>>;
    syncInterval: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    workspaceId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    config: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>>;
} & {
    isEnabled: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type?: ConnectorType | undefined;
    name?: string | undefined;
    workspaceId?: string | null | undefined;
    config?: Record<string, unknown> | undefined;
    syncMode?: SyncMode | undefined;
    syncInterval?: number | null | undefined;
    isEnabled?: boolean | undefined;
}, {
    type?: ConnectorType | undefined;
    name?: string | undefined;
    workspaceId?: string | null | undefined;
    config?: Record<string, unknown> | undefined;
    syncMode?: SyncMode | undefined;
    syncInterval?: number | null | undefined;
    isEnabled?: boolean | undefined;
}>;
export declare const FieldMapSchema: z.ZodObject<{
    sourceField: z.ZodString;
    targetField: z.ZodString;
    transformation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isRequired: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    sourceField: string;
    targetField: string;
    isRequired: boolean;
    transformation?: string | null | undefined;
}, {
    sourceField: string;
    targetField: string;
    transformation?: string | null | undefined;
    isRequired?: boolean | undefined;
}>;
export type BaseConnectorInput = z.infer<typeof BaseConnectorSchema>;
export type S3CredentialsInput = z.infer<typeof S3CredentialsSchema>;
export type SftpCredentialsInput = z.infer<typeof SftpCredentialsSchema>;
export type DatabaseCredentialsInput = z.infer<typeof DatabaseCredentialsSchema>;
export type RestApiCredentialsInput = z.infer<typeof RestApiCredentialsSchema>;
export type UpdateConnectorInput = z.infer<typeof UpdateConnectorSchema>;
export type FieldMapInput = z.infer<typeof FieldMapSchema>;
//# sourceMappingURL=connector.schema.d.ts.map