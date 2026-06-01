import { BaseConnector } from '../base.connector';
import { ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions } from '@hybridshare/shared/types/connector';
export declare class OneDriveConnector extends BaseConnector {
    readonly id = "onedrive";
    readonly name = "OneDrive";
    readonly type = ConnectorType.ONEDRIVE;
    readonly category = ConnectorCategory.CLOUD;
    private accessToken;
    private readonly BASE;
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
    private get;
    private normalizeItem;
}
//# sourceMappingURL=onedrive.connector.d.ts.map