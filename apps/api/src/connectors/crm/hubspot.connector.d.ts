import { BaseConnector } from '../base.connector';
import { ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions } from '@hybridshare/shared/types/connector';
export declare class HubSpotConnector extends BaseConnector {
    readonly id = "hubspot";
    readonly name = "HubSpot";
    readonly type = ConnectorType.HUBSPOT;
    readonly category = ConnectorCategory.CRM;
    private accessToken;
    private readonly BASE;
    connect(credentials: Record<string, unknown>): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<HealthStatus>;
    listAssets(objectType?: string, options?: ListOptions): Promise<NormalizedAsset[]>;
    getAsset(assetId: string): Promise<NormalizedAsset>;
    searchAssets(query: string): Promise<NormalizedAsset[]>;
    fetchContent(assetId: string): Promise<Buffer>;
    pushContent(assetId: string, content: Buffer): Promise<void>;
    deleteAsset(assetId: string): Promise<void>;
    getChanges(since: Date): Promise<AssetChange[]>;
    private get;
    private post;
    private patch;
    private normalizeRecord;
}
//# sourceMappingURL=hubspot.connector.d.ts.map