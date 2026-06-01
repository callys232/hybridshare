import { BaseConnector } from '../base.connector';
import { ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions } from '@hybridshare/shared/types/connector';
export declare class WebhookConnector extends BaseConnector {
    readonly id = "webhook";
    readonly name = "Webhook";
    readonly type = ConnectorType.WEBHOOK;
    readonly category = ConnectorCategory.CUSTOM;
    private receivedAssets;
    private secretToken;
    connect(credentials: Record<string, unknown>): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<HealthStatus>;
    listAssets(_path?: string, options?: ListOptions): Promise<NormalizedAsset[]>;
    getAsset(assetId: string): Promise<NormalizedAsset>;
    searchAssets(query: string): Promise<NormalizedAsset[]>;
    fetchContent(assetId: string): Promise<Buffer>;
    pushContent(_assetId: string, _content: Buffer): Promise<void>;
    deleteAsset(assetId: string): Promise<void>;
    getChanges(since: Date): Promise<AssetChange[]>;
    receiveWebhookPayload(payload: Record<string, unknown>, connectorId: string): NormalizedAsset;
    validateSignature(signature: string, body: string): boolean;
}
//# sourceMappingURL=webhook.connector.d.ts.map