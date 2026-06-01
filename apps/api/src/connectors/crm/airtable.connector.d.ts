import { BaseConnector } from '../base.connector';
import { ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions } from '@hybridshare/shared/types/connector';
export declare class AirtableConnector extends BaseConnector {
    readonly id = "airtable";
    readonly name = "Airtable";
    readonly type = ConnectorType.AIRTABLE;
    readonly category = ConnectorCategory.CRM;
    private apiKey;
    private baseId;
    private readonly BASE_URL;
    connect(credentials: Record<string, unknown>): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<HealthStatus>;
    listAssets(tableName?: string, options?: ListOptions): Promise<NormalizedAsset[]>;
    getAsset(assetId: string): Promise<NormalizedAsset>;
    searchAssets(query: string): Promise<NormalizedAsset[]>;
    fetchContent(assetId: string): Promise<Buffer>;
    pushContent(assetId: string, content: Buffer): Promise<void>;
    deleteAsset(assetId: string): Promise<void>;
    getChanges(_since: Date): Promise<AssetChange[]>;
    private fetchAllRecords;
    private request;
    private normalizeRecord;
}
//# sourceMappingURL=airtable.connector.d.ts.map