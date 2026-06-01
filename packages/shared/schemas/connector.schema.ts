import { z } from 'zod';
import { ConnectorType, SyncMode } from '../types/connector';

export const BaseConnectorSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.nativeEnum(ConnectorType),
  syncMode: z.nativeEnum(SyncMode).default(SyncMode.MANUAL),
  syncInterval: z.number().int().min(5).max(10080).nullable().optional(),
  workspaceId: z.string().uuid().nullable().optional(),
  config: z.record(z.unknown()).optional().default({}),
});

export const GoogleDriveCredentialsSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenExpiry: z.string().datetime(),
  folderId: z.string().optional(),
});

export const DropboxCredentialsSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  accountId: z.string().optional(),
});

export const S3CredentialsSchema = z.object({
  accessKeyId: z.string().min(1),
  secretAccessKey: z.string().min(1),
  region: z.string().min(1),
  bucket: z.string().min(1),
  endpoint: z.string().url().optional(),
});

export const SftpCredentialsSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().default(22),
  username: z.string().min(1),
  password: z.string().optional(),
  privateKey: z.string().optional(),
  remotePath: z.string().default('/'),
});

export const DatabaseCredentialsSchema = z.object({
  host: z.string().min(1),
  port: z.number().int(),
  database: z.string().min(1),
  username: z.string().min(1),
  password: z.string(),
  ssl: z.boolean().default(false),
});

export const MongoCredentialsSchema = z.object({
  connectionString: z.string().min(1),
  database: z.string().min(1),
});

export const HubSpotCredentialsSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  portalId: z.string().optional(),
});

export const AirtableCredentialsSchema = z.object({
  apiKey: z.string().min(1),
  baseId: z.string().min(1),
});

export const NotionCredentialsSchema = z.object({
  apiKey: z.string().min(1),
  databaseId: z.string().optional(),
});

export const RestApiCredentialsSchema = z.object({
  baseUrl: z.string().url(),
  authType: z.enum(['none', 'bearer', 'basic', 'apikey', 'oauth2']),
  token: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  apiKeyHeader: z.string().optional(),
  apiKeyValue: z.string().optional(),
});

export const GraphQLCredentialsSchema = z.object({
  endpoint: z.string().url(),
  authType: z.enum(['none', 'bearer', 'apikey']).default('none'),
  token: z.string().optional(),
  headers: z.record(z.string()).optional(),
});

export const UpdateConnectorSchema = BaseConnectorSchema.partial().extend({
  isEnabled: z.boolean().optional(),
});

export const FieldMapSchema = z.object({
  sourceField: z.string().min(1),
  targetField: z.string().min(1),
  transformation: z.string().nullable().optional(),
  isRequired: z.boolean().default(false),
});

export type BaseConnectorInput = z.infer<typeof BaseConnectorSchema>;
export type S3CredentialsInput = z.infer<typeof S3CredentialsSchema>;
export type SftpCredentialsInput = z.infer<typeof SftpCredentialsSchema>;
export type DatabaseCredentialsInput = z.infer<typeof DatabaseCredentialsSchema>;
export type RestApiCredentialsInput = z.infer<typeof RestApiCredentialsSchema>;
export type UpdateConnectorInput = z.infer<typeof UpdateConnectorSchema>;
export type FieldMapInput = z.infer<typeof FieldMapSchema>;
