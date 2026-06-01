export declare enum ConnectorType {
    GOOGLE_DRIVE = "GOOGLE_DRIVE",
    DROPBOX = "DROPBOX",
    ONEDRIVE = "ONEDRIVE",
    BOX = "BOX",
    S3 = "S3",
    SFTP = "SFTP",
    POSTGRES = "POSTGRES",
    MYSQL = "MYSQL",
    MONGODB = "MONGODB",
    SQLITE = "SQLITE",
    MSSQL = "MSSQL",
    REDIS_DB = "REDIS_DB",
    HUBSPOT = "HUBSPOT",
    ZOHO = "ZOHO",
    SALESFORCE = "SALESFORCE",
    NOTION = "NOTION",
    AIRTABLE = "AIRTABLE",
    GOOGLE_SHEETS = "GOOGLE_SHEETS",
    REST_API = "REST_API",
    GRAPHQL = "GRAPHQL",
    WEBHOOK = "WEBHOOK",
    CSV = "CSV"
}
export declare enum ConnectorCategory {
    CLOUD = "CLOUD",
    DATABASE = "DATABASE",
    CRM = "CRM",
    CUSTOM = "CUSTOM"
}
export declare enum ConnectorStatus {
    CONNECTED = "CONNECTED",
    DISCONNECTED = "DISCONNECTED",
    ERROR = "ERROR",
    SYNCING = "SYNCING",
    PENDING = "PENDING"
}
export declare enum SyncMode {
    MANUAL = "MANUAL",
    SCHEDULED = "SCHEDULED",
    LIVE = "LIVE"
}
export interface Connector {
    id: string;
    name: string;
    type: ConnectorType;
    category: ConnectorCategory;
    status: ConnectorStatus;
    syncMode: SyncMode;
    syncInterval: number | null;
    lastSyncAt: Date | null;
    nextSyncAt: Date | null;
    workspaceId: string | null;
    createdById: string;
    config: Record<string, unknown>;
    isEnabled: boolean;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface ConnectorCredential {
    id: string;
    connectorId: string;
    encryptedData: string;
    iv: string;
    tag: string;
    updatedAt: Date;
}
export interface ConnectorSyncLog {
    id: string;
    connectorId: string;
    startedAt: Date;
    completedAt: Date | null;
    status: 'running' | 'success' | 'failed' | 'partial';
    assetsProcessed: number;
    assetsAdded: number;
    assetsUpdated: number;
    assetsDeleted: number;
    errorMessage: string | null;
    details: Record<string, unknown>;
}
export interface HealthStatus {
    healthy: boolean;
    latencyMs: number;
    message: string;
    checkedAt: Date;
}
export interface NormalizedAsset {
    id: string;
    connectorId: string;
    externalId: string;
    name: string;
    type: 'file' | 'folder' | 'record' | 'sheet' | 'document' | 'image' | 'video' | 'other';
    mimeType: string | null;
    size: number | null;
    path: string;
    url: string | null;
    thumbnailUrl: string | null;
    metadata: Record<string, unknown>;
    tags: string[];
    createdAt: Date | null;
    updatedAt: Date | null;
    fetchedAt: Date;
}
export interface AssetChange {
    externalId: string;
    changeType: 'created' | 'updated' | 'deleted';
    asset: NormalizedAsset | null;
    changedAt: Date;
}
export interface ListOptions {
    path?: string;
    limit?: number;
    cursor?: string;
    recursive?: boolean;
    filter?: Record<string, unknown>;
}
export interface EncryptedCredentials {
    encryptedData: string;
    iv: string;
    tag: string;
}
export type ChangeHandler = (change: AssetChange) => void | Promise<void>;
//# sourceMappingURL=connector.d.ts.map