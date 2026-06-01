import axios from 'axios';
import { BaseConnector } from '../base.connector';
import {
  ConnectorType,
  ConnectorCategory,
  HealthStatus,
  NormalizedAsset,
  AssetChange,
  ListOptions,
} from '@hybridshare/shared/types/connector';

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime: string;
}

export class AirtableConnector extends BaseConnector {
  readonly id = 'airtable';
  readonly name = 'Airtable';
  readonly type = ConnectorType.AIRTABLE;
  readonly category = ConnectorCategory.CRM;

  private apiKey = '';
  private baseId = '';
  private readonly BASE_URL = 'https://api.airtable.com/v0';

  async connect(credentials: Record<string, unknown>): Promise<void> {
    this.apiKey = credentials.apiKey as string;
    this.baseId = credentials.baseId as string;
    this.credentials = credentials;
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    this.apiKey = '';
    this.isConnected = false;
  }

  async testConnection(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      await this.request('GET', `meta/bases/${this.baseId}/tables`);
      return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : 'Failed',
        checkedAt: new Date(),
      };
    }
  }

  async listAssets(tableName?: string, options: ListOptions = {}): Promise<NormalizedAsset[]> {
    if (!tableName) {
      const response = await this.request<{ tables: Array<{ id: string; name: string }> }>(
        'GET',
        `meta/bases/${this.baseId}/tables`
      );
      return response.tables.map((t) =>
        this.buildNormalizedAsset({
          id: t.id,
          name: t.name,
          type: 'other',
          path: `${this.baseId}/${t.name}`,
          metadata: { baseId: this.baseId, tableId: t.id },
        })
      );
    }

    const records = await this.fetchAllRecords(tableName, options.limit);
    return records.map((r) => this.normalizeRecord(r, tableName));
  }

  async getAsset(assetId: string): Promise<NormalizedAsset> {
    const [tableId, recordId] = assetId.split('/');
    const record = await this.request<AirtableRecord>('GET', `${this.baseId}/${tableId}/${recordId}`);
    return this.normalizeRecord(record, tableId);
  }

  async searchAssets(query: string): Promise<NormalizedAsset[]> {
    const tablesResponse = await this.request<{ tables: Array<{ name: string }> }>(
      'GET',
      `meta/bases/${this.baseId}/tables`
    );

    const results: NormalizedAsset[] = [];

    for (const table of tablesResponse.tables.slice(0, 3)) {
      const records = await this.request<{ records: AirtableRecord[] }>(
        'GET',
        `${this.baseId}/${table.name}?filterByFormula=SEARCH("${query}", ARRAYJOIN(ARRAYUNIQUE(VALUES(RECORD_ID()))))&maxRecords=10`
      );
      results.push(...records.records.map((r) => this.normalizeRecord(r, table.name)));
    }

    return results;
  }

  async fetchContent(assetId: string): Promise<Buffer> {
    const [tableId] = assetId.split('/');
    const records = await this.fetchAllRecords(tableId);
    return Buffer.from(JSON.stringify(records, null, 2));
  }

  async pushContent(assetId: string, content: Buffer): Promise<void> {
    const [tableId] = assetId.split('/');
    const records = JSON.parse(content.toString()) as Array<{ fields: Record<string, unknown> }>;

    for (let i = 0; i < records.length; i += 10) {
      const batch = records.slice(i, i + 10).map((r) => ({ fields: r.fields || r }));
      await this.request('POST', `${this.baseId}/${tableId}`, { records: batch });
    }
  }

  async deleteAsset(assetId: string): Promise<void> {
    const [tableId, recordId] = assetId.split('/');
    await this.request('DELETE', `${this.baseId}/${tableId}/${recordId}`);
  }

  async getChanges(_since: Date): Promise<AssetChange[]> {
    return [];
  }

  private async fetchAllRecords(tableId: string, limit = 100): Promise<AirtableRecord[]> {
    const response = await this.withRetry(() =>
      this.request<{ records: AirtableRecord[] }>(
        'GET',
        `${this.baseId}/${tableId}?maxRecords=${limit}`
      )
    );
    return response.records;
  }

  private async request<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
    const response = await axios.request<T>({
      method,
      url: `${this.BASE_URL}/${endpoint}`,
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      data: body,
      timeout: 15000,
    });
    return response.data;
  }

  private normalizeRecord(record: AirtableRecord, tableName: string): NormalizedAsset {
    const name = Object.values(record.fields)[0]?.toString() ?? record.id;

    return this.buildNormalizedAsset({
      id: `${tableName}/${record.id}`,
      name: String(name),
      type: 'record',
      path: `${this.baseId}/${tableName}/${record.id}`,
      createdAt: this.normalizeDate(record.createdTime),
      metadata: record.fields,
    });
  }
}
