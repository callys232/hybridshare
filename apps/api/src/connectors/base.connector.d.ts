import type { ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions, ChangeHandler } from '@hybridshare/shared/types/connector';
export declare abstract class BaseConnector {
    abstract readonly id: string;
    abstract readonly name: string;
    abstract readonly type: ConnectorType;
    abstract readonly category: ConnectorCategory;
    protected credentials: Record<string, unknown>;
    protected isConnected: boolean;
    private changeHandlers;
    abstract connect(credentials: Record<string, unknown>): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract testConnection(): Promise<HealthStatus>;
    abstract listAssets(path?: string, options?: ListOptions): Promise<NormalizedAsset[]>;
    abstract getAsset(assetId: string): Promise<NormalizedAsset>;
    abstract searchAssets(query: string): Promise<NormalizedAsset[]>;
    abstract fetchContent(assetId: string): Promise<Buffer>;
    abstract pushContent(assetId: string, content: Buffer, metadata?: Record<string, unknown>): Promise<void>;
    abstract deleteAsset(assetId: string): Promise<void>;
    abstract getChanges(since: Date): Promise<AssetChange[]>;
    subscribeToChanges(handler: ChangeHandler): Promise<void>;
    protected emitChange(change: AssetChange): Promise<void>;
    protected normalizeDate(dateValue: unknown): Date | null;
    protected buildNormalizedAsset(partial: Partial<NormalizedAsset> & {
        id: string;
        name: string;
        path: string;
    }): NormalizedAsset;
    protected withRetry<T>(operation: () => Promise<T>, maxRetries?: number, delayMs?: number): Promise<T>;
}
//# sourceMappingURL=base.connector.d.ts.map