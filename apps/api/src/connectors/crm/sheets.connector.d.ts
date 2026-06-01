import { BaseConnector } from '../base.connector';
import { ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions } from '@hybridshare/shared/types/connector';
export declare class GoogleSheetsConnector extends BaseConnector {
    readonly id = "google-sheets";
    readonly name = "Google Sheets";
    readonly type = ConnectorType.GOOGLE_SHEETS;
    readonly category = ConnectorCategory.CRM;
    private sheets;
    connect(credentials: Record<string, unknown>): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<HealthStatus>;
    listAssets(spreadsheetId?: string, _options?: ListOptions): Promise<NormalizedAsset[]>;
    getAsset(assetId: string): Promise<NormalizedAsset>;
    searchAssets(query: string): Promise<NormalizedAsset[]>;
    fetchContent(assetId: string): Promise<Buffer>;
    pushContent(assetId: string, content: Buffer): Promise<void>;
    deleteAsset(assetId: string): Promise<void>;
    getChanges(_since: Date): Promise<AssetChange[]>;
}
//# sourceMappingURL=sheets.connector.d.ts.map