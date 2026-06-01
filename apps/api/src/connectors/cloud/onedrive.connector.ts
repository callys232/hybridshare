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

interface OneDriveItem {
  id: string;
  name: string;
  size?: number;
  lastModifiedDateTime?: string;
  createdDateTime?: string;
  webUrl?: string;
  file?: { mimeType?: string };
  folder?: { childCount?: number };
  thumbnails?: Array<{ medium?: { url?: string } }>;
}

export class OneDriveConnector extends BaseConnector {
  readonly id = 'onedrive';
  readonly name = 'OneDrive';
  readonly type = ConnectorType.ONEDRIVE;
  readonly category = ConnectorCategory.CLOUD;

  private accessToken = '';
  private readonly BASE = 'https://graph.microsoft.com/v1.0';

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
      await this.get('/me/drive');
      return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message, checkedAt: new Date() };
    }
  }

  async listAssets(path = 'root', options: ListOptions = {}): Promise<NormalizedAsset[]> {
    const endpoint = path === 'root'
      ? '/me/drive/root/children'
      : `/me/drive/items/${path}/children`;

    const response = await this.withRetry(() =>
      this.get<{ value: OneDriveItem[] }>(`${endpoint}?$top=${options.limit ?? 100}`)
    );

    return response.value.map((item) => this.normalizeItem(item));
  }

  async getAsset(assetId: string): Promise<NormalizedAsset> {
    const item = await this.get<OneDriveItem>(`/me/drive/items/${assetId}`);
    return this.normalizeItem(item);
  }

  async searchAssets(query: string): Promise<NormalizedAsset[]> {
    const response = await this.withRetry(() =>
      this.get<{ value: OneDriveItem[] }>(`/me/drive/root/search(q='${encodeURIComponent(query)}')`)
    );
    return response.value.map((item) => this.normalizeItem(item));
  }

  async fetchContent(assetId: string): Promise<Buffer> {
    const response = await axios.get<ArrayBuffer>(
      `${this.BASE}/me/drive/items/${assetId}/content`,
      { headers: { Authorization: `Bearer ${this.accessToken}` }, responseType: 'arraybuffer' }
    );
    return Buffer.from(response.data);
  }

  async pushContent(assetId: string, content: Buffer, metadata?: Record<string, unknown>): Promise<void> {
    await axios.put(
      `${this.BASE}/me/drive/items/${assetId}/content`,
      content,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': (metadata?.mimeType as string) ?? 'application/octet-stream',
        },
      }
    );
  }

  async deleteAsset(assetId: string): Promise<void> {
    await axios.delete(`${this.BASE}/me/drive/items/${assetId}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
  }

  async getChanges(since: Date): Promise<AssetChange[]> {
    const response = await this.withRetry(() =>
      this.get<{ value: OneDriveItem[] }>(
        `/me/drive/root/delta?$filter=lastModifiedDateTime gt '${since.toISOString()}'`
      )
    );
    return response.value.map((item) => ({
      externalId: item.id,
      changeType: 'updated' as const,
      asset: this.normalizeItem(item),
      changedAt: new Date(item.lastModifiedDateTime ?? Date.now()),
    }));
  }

  private async get<T>(endpoint: string): Promise<T> {
    const response = await axios.get<T>(`${this.BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      timeout: 15000,
    });
    return response.data;
  }

  private normalizeItem(item: OneDriveItem): NormalizedAsset {
    return this.buildNormalizedAsset({
      id: item.id,
      name: item.name,
      type: item.folder ? 'folder' : 'file',
      mimeType: item.file?.mimeType ?? null,
      size: item.size ?? null,
      path: item.id,
      url: item.webUrl ?? null,
      thumbnailUrl: item.thumbnails?.[0]?.medium?.url ?? null,
      createdAt: this.normalizeDate(item.createdDateTime),
      updatedAt: this.normalizeDate(item.lastModifiedDateTime),
    });
  }
}
