import { BaseConnector } from '../base.connector';
import { ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions } from '@hybridshare/shared/types/connector';
export declare class BoxConnector extends BaseConnector {
    readonly id = "box";
    readonly name = "Box";
    readonly type = ConnectorType.BOX;
    readonly category = ConnectorCategory.CLOUD;
    private accessToken;
    private readonly BASE;
    connect(credentials: Record<string, unknown>): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<HealthStatus>;
    listAssets(folderId?: string, options?: ListOptions): Promise<NormalizedAsset[]>;
    getAsset(assetId: string): Promise<NormalizedAsset>;
    searchAssets(query: string): Promise<NormalizedAsset[]>;
    fetchContent(assetId: string): Promise<Buffer>;
    pushContent(assetId: string, content: Buffer): Promise<void>;
    deleteAsset(assetId: string): Promise<void>;
    getChanges(_since: Date): Promise<AssetChange[]>;
    private get;
    private normalizeEntry;
}
//# sourceMappingURL=box.connector.d.ts.map