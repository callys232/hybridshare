import type { NormalizedAsset } from './connector';

export interface UDCAsset {
  id: string;
  connectorId: string;
  externalId: string;
  name: string;
  type: string;
  mimeType: string | null;
  size: number | null;
  path: string;
  url: string | null;
  thumbnailUrl: string | null;
  metadata: Record<string, unknown>;
  tags: string[];
  isImported: boolean;
  importedFileId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UDCFieldMap {
  id: string;
  connectorId: string;
  sourceField: string;
  targetField: string;
  transformation: string | null;
  isRequired: boolean;
  createdAt: Date;
}

export interface UDCAudit {
  id: string;
  assetId: string;
  connectorId: string;
  action: 'fetch' | 'push' | 'delete' | 'import' | 'snapshot' | 'share' | 'edit';
  userId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface AssetSnapshot {
  id: string;
  assetId: string;
  connectorId: string;
  content: Buffer;
  metadata: Record<string, unknown>;
  version: number;
  createdAt: Date;
  createdById: string;
}

export interface AssetEditPayload {
  assetId: string;
  connectorId: string;
  content: string | Buffer;
  contentType: 'text' | 'binary' | 'json' | 'spreadsheet';
  schema: AssetFieldSchema[];
}

export interface AssetFieldSchema {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  label: string;
  required: boolean;
  readonly: boolean;
  options?: Array<{ label: string; value: unknown }>;
}

export interface AssetSharePayload {
  assetIds: string[];
  connectorId: string;
  platforms: string[];
  message: string;
  scheduledAt?: Date;
}

export interface ImportedAsset extends NormalizedAsset {
  importedAt: Date;
  importedById: string;
  hybridShareFileId: string;
}
