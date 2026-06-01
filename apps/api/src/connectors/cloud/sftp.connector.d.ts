import { BaseConnector } from '../base.connector';
import { ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions } from '@hybridshare/shared/types/connector';
export declare class SftpConnector extends BaseConnector {
    readonly id = "sftp";
    readonly name = "SFTP";
    readonly type = ConnectorType.SFTP;
    readonly category = ConnectorCategory.CLOUD;
    private client;
    private remotePath;
    connect(credentials: Record<string, unknown>): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<HealthStatus>;
    listAssets(listPath?: string, options?: ListOptions): Promise<NormalizedAsset[]>;
    getAsset(assetId: string): Promise<NormalizedAsset>;
    searchAssets(query: string): Promise<NormalizedAsset[]>;
    fetchContent(assetId: string): Promise<Buffer>;
    pushContent(assetId: string, content: Buffer): Promise<void>;
    deleteAsset(assetId: string): Promise<void>;
    getChanges(since: Date): Promise<AssetChange[]>;
}
//# sourceMappingURL=sftp.connector.d.ts.map