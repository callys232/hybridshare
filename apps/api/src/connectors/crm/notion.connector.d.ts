import { BaseConnector } from '../base.connector';
import { ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions } from '@hybridshare/shared/types/connector';
export declare class NotionConnector extends BaseConnector {
    readonly id = "notion";
    readonly name = "Notion";
    readonly type = ConnectorType.NOTION;
    readonly category = ConnectorCategory.CRM;
    private apiKey;
    private readonly BASE;
    private readonly VERSION;
    connect(credentials: Record<string, unknown>): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<HealthStatus>;
    listAssets(_path?: string, options?: ListOptions): Promise<NormalizedAsset[]>;
    getAsset(assetId: string): Promise<NormalizedAsset>;
    searchAssets(query: string): Promise<NormalizedAsset[]>;
    fetchContent(assetId: string): Promise<Buffer>;
    pushContent(assetId: string, content: Buffer): Promise<void>;
    deleteAsset(assetId: string): Promise<void>;
    getChanges(since: Date): Promise<AssetChange[]>;
    private get;
    private post;
    private patch;
    private normalizeDatabase;
}
//# sourceMappingURL=notion.connector.d.ts.map