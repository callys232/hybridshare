import { BaseConnector } from '../base.connector';
import { ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions } from '@hybridshare/shared/types/connector';
export declare class GoogleDriveConnector extends BaseConnector {
    readonly id = "google-drive";
    readonly name = "Google Drive";
    readonly type = ConnectorType.GOOGLE_DRIVE;
    readonly category = ConnectorCategory.CLOUD;
    private drive;
    connect(credentials: Record<string, unknown>): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<HealthStatus>;
    listAssets(path?: string, options?: ListOptions): Promise<NormalizedAsset[]>;
    getAsset(assetId: string): Promise<NormalizedAsset>;
    searchAssets(query: string): Promise<NormalizedAsset[]>;
    fetchContent(assetId: string): Promise<Buffer>;
    pushContent(assetId: string, content: Buffer, metadata?: Record<string, unknown>): Promise<void>;
    deleteAsset(assetId: string): Promise<void>;
    getChanges(since: Date): Promise<AssetChange[]>;
    private normalizeFile;
}
//# sourceMappingURL=googledrive.connector.d.ts.map