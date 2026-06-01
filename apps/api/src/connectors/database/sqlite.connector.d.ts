import { BaseConnector } from '../base.connector';
import { ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions } from '@hybridshare/shared/types/connector';
export declare class SQLiteConnector extends BaseConnector {
    readonly id = "sqlite";
    readonly name = "SQLite";
    readonly type = ConnectorType.SQLITE;
    readonly category = ConnectorCategory.DATABASE;
    private db;
    private filePath;
    connect(credentials: Record<string, unknown>): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<HealthStatus>;
    listAssets(_path?: string, _options?: ListOptions): Promise<NormalizedAsset[]>;
    getAsset(assetId: string): Promise<NormalizedAsset>;
    searchAssets(query: string): Promise<NormalizedAsset[]>;
    fetchContent(assetId: string): Promise<Buffer>;
    pushContent(assetId: string, content: Buffer): Promise<void>;
    deleteAsset(assetId: string): Promise<void>;
    getChanges(_since: Date): Promise<AssetChange[]>;
}
//# sourceMappingURL=sqlite.connector.d.ts.map