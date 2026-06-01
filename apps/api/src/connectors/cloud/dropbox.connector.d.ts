import { BaseConnector } from '../base.connector';
import { ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions } from '@hybridshare/shared/types/connector';
export declare class DropboxConnector extends BaseConnector {
    readonly id = "dropbox";
    readonly name = "Dropbox";
    readonly type = ConnectorType.DROPBOX;
    readonly category = ConnectorCategory.CLOUD;
    private accessToken;
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
    private api;
    private normalizeEntry;
}
//# sourceMappingURL=dropbox.connector.d.ts.map