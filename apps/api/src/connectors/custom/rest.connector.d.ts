import { BaseConnector } from '../base.connector';
import { ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions } from '@hybridshare/shared/types/connector';
export declare class RestApiConnector extends BaseConnector {
    readonly id = "rest-api";
    readonly name = "REST API";
    readonly type = ConnectorType.REST_API;
    readonly category = ConnectorCategory.CUSTOM;
    private baseUrl;
    private headers;
    private listEndpoint;
    private getEndpoint;
    private searchEndpoint;
    connect(credentials: Record<string, unknown>): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<HealthStatus>;
    listAssets(_path?: string, options?: ListOptions): Promise<NormalizedAsset[]>;
    getAsset(assetId: string): Promise<NormalizedAsset>;
    searchAssets(query: string): Promise<NormalizedAsset[]>;
    fetchContent(assetId: string): Promise<Buffer>;
    pushContent(assetId: string, content: Buffer): Promise<void>;
    deleteAsset(assetId: string): Promise<void>;
    getChanges(_since: Date): Promise<AssetChange[]>;
    private request;
    private normalizeItem;
}
//# sourceMappingURL=rest.connector.d.ts.map