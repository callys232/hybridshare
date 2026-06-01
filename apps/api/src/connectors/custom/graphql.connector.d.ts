import { BaseConnector } from '../base.connector';
import { ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions } from '@hybridshare/shared/types/connector';
export declare class GraphQLConnector extends BaseConnector {
    readonly id = "graphql";
    readonly name = "GraphQL";
    readonly type = ConnectorType.GRAPHQL;
    readonly category = ConnectorCategory.CUSTOM;
    private endpoint;
    private headers;
    private listQuery;
    private getQuery;
    private searchQuery;
    connect(credentials: Record<string, unknown>): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<HealthStatus>;
    listAssets(_path?: string, options?: ListOptions): Promise<NormalizedAsset[]>;
    getAsset(assetId: string): Promise<NormalizedAsset>;
    searchAssets(q: string): Promise<NormalizedAsset[]>;
    fetchContent(assetId: string): Promise<Buffer>;
    pushContent(_assetId: string, _content: Buffer): Promise<void>;
    deleteAsset(_assetId: string): Promise<void>;
    getChanges(_since: Date): Promise<AssetChange[]>;
    private query;
    private normalizeItem;
}
//# sourceMappingURL=graphql.connector.d.ts.map