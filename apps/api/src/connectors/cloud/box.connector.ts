import axios from 'axios';
import { BaseConnector } from '../base.connector';
import {
  ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions,
} from '@hybridshare/shared/types/connector';

export class BoxConnector extends BaseConnector {
  readonly id = 'box';
  readonly name = 'Box';
  readonly type = ConnectorType.BOX;
  readonly category = ConnectorCategory.CLOUD;

  private accessToken = '';
  private readonly BASE = 'https://api.box.com/2.0';

  async connect(credentials: Record<string, unknown>): Promise<void> {
    this.accessToken = credentials.accessToken as string;
    this.credentials = credentials;
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    this.accessToken = '';
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

  async listAssets(folderId = '0', options: ListOptions = {}): Promise<NormalizedAsset[]> {
    const response = await this.withRetry(() =>
      this.get<{ entries: Record<string, unknown>[] }>(`/folders/${folderId}/items?limit=${options.limit ?? 100}`)
    );
    return response.entries.map((e) => this.normalizeEntry(e));
  }

  async getAsset(assetId: string): Promise<NormalizedAsset> {
    const item = await this.get<Record<string, unknown>>(`/files/${assetId}`);
    return this.normalizeEntry(item);
  }

  async searchAssets(query: string): Promise<NormalizedAsset[]> {
    const response = await this.withRetry(() =>
      this.get<{ entries: Record<string, unknown>[] }>(`/search?query=${encodeURIComponent(query)}&limit=50`)
    );
    return response.entries.map((e) => this.normalizeEntry(e));
  }

  async fetchContent(assetId: string): Promise<Buffer> {
    const response = await axios.get<ArrayBuffer>(`${this.BASE}/files/${assetId}/content`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data);
  }

  async pushContent(assetId: string, content: Buffer): Promise<void> {
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', content, { filename: assetId });
    await axios.post(`https://upload.box.com/api/2.0/files/${assetId}/content`, form, {
      headers: { Authorization: `Bearer ${this.accessToken}`, ...form.getHeaders() },
    });
  }

  async deleteAsset(assetId: string): Promise<void> {
    await axios.delete(`${this.BASE}/files/${assetId}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
  }

  async getChanges(_since: Date): Promise<AssetChange[]> {
    return [];
  }

  private async get<T>(path: string): Promise<T> {
    const response = await axios.get<T>(`${this.BASE}${path}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      timeout: 15000,
    });
    return response.data;
  }

  private normalizeEntry(e: Record<string, unknown>): NormalizedAsset {
    return this.buildNormalizedAsset({
      id: e.id as string,
      name: e.name as string,
      type: e.type === 'folder' ? 'folder' : 'file',
      size: e.size as number | null,
      path: `/${e.name as string}`,
      updatedAt: this.normalizeDate(e.modified_at),
      createdAt: this.normalizeDate(e.created_at),
      metadata: { etag: e.etag, sha1: e.sha1 },
    });
  }
}
