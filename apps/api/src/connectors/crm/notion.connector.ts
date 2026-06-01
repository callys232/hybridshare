import axios from 'axios';
import { BaseConnector } from '../base.connector';
import {
  ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions,
} from '@hybridshare/shared/types/connector';

export class NotionConnector extends BaseConnector {
  readonly id = 'notion';
  readonly name = 'Notion';
  readonly type = ConnectorType.NOTION;
  readonly category = ConnectorCategory.CRM;

  private apiKey = '';
  private readonly BASE = 'https://api.notion.com/v1';
  private readonly VERSION = '2022-06-28';

  async connect(credentials: Record<string, unknown>): Promise<void> {
    this.apiKey = credentials.apiKey as string;
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
      await this.get('/users/me');
      return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message, checkedAt: new Date() };
    }
  }

  async listAssets(_path?: string, options: ListOptions = {}): Promise<NormalizedAsset[]> {
    const response = await this.withRetry(() =>
      this.post<{ results: Record<string, unknown>[] }>('/search', {
        filter: { value: 'database', property: 'object' },
        page_size: options.limit ?? 50,
      })
    );
    return response.results.map((db) => this.normalizeDatabase(db));
  }

  async getAsset(assetId: string): Promise<NormalizedAsset> {
    const db = await this.get<Record<string, unknown>>(`/databases/${assetId}`);
    return this.normalizeDatabase(db);
  }

  async searchAssets(query: string): Promise<NormalizedAsset[]> {
    const response = await this.withRetry(() =>
      this.post<{ results: Record<string, unknown>[] }>('/search', { query, page_size: 50 })
    );
    return response.results.map((item) => this.normalizeDatabase(item));
  }

  async fetchContent(assetId: string): Promise<Buffer> {
    const response = await this.withRetry(() =>
      this.post<{ results: Record<string, unknown>[] }>(`/databases/${assetId}/query`, { page_size: 100 })
    );
    return Buffer.from(JSON.stringify(response.results, null, 2));
  }

  async pushContent(assetId: string, content: Buffer): Promise<void> {
    const records = JSON.parse(content.toString()) as Array<{ properties: Record<string, unknown> }>;
    for (const record of records) {
      await this.post('/pages', { parent: { database_id: assetId }, properties: record.properties || record });
    }
  }

  async deleteAsset(assetId: string): Promise<void> {
    await this.patch(`/pages/${assetId}`, { archived: true });
  }

  async getChanges(since: Date): Promise<AssetChange[]> {
    const response = await this.post<{ results: Record<string, unknown>[] }>('/search', {
      filter: { timestamp: 'last_edited_time', last_edited_time: { on_or_after: since.toISOString() } },
      page_size: 100,
    });
    return response.results.map((item) => ({
      externalId: item.id as string,
      changeType: 'updated' as const,
      asset: this.normalizeDatabase(item),
      changedAt: new Date(item.last_edited_time as string),
    }));
  }

  private async get<T>(path: string): Promise<T> {
    const r = await axios.get<T>(`${this.BASE}${path}`, {
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Notion-Version': this.VERSION },
      timeout: 15000,
    });
    return r.data;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const r = await axios.post<T>(`${this.BASE}${path}`, body, {
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Notion-Version': this.VERSION, 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    return r.data;
  }

  private async patch<T>(path: string, body: unknown): Promise<T> {
    const r = await axios.patch<T>(`${this.BASE}${path}`, body, {
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Notion-Version': this.VERSION, 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    return r.data;
  }

  private normalizeDatabase(db: Record<string, unknown>): NormalizedAsset {
    const title = (db.title as Array<{ plain_text?: string }> | undefined)?.[0]?.plain_text
      ?? (db.properties as Record<string, Record<string, Array<{ plain_text?: string }>>>)?.Name?.title?.[0]?.plain_text
      ?? (db.id as string);
    return this.buildNormalizedAsset({
      id: db.id as string,
      name: String(title),
      type: db.object === 'database' ? 'other' : 'record',
      path: `/${db.id as string}`,
      url: db.url as string | null,
      createdAt: this.normalizeDate(db.created_time),
      updatedAt: this.normalizeDate(db.last_edited_time),
      metadata: { object: db.object },
    });
  }
}
