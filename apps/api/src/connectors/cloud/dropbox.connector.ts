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

export class DropboxConnector extends BaseConnector {
  readonly id = 'dropbox';
  readonly name = 'Dropbox';
  readonly type = ConnectorType.DROPBOX;
  readonly category = ConnectorCategory.CLOUD;

  private accessToken = '';

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
      await this.api('users/get_current_account', {});
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

  async listAssets(path = '', options: ListOptions = {}): Promise<NormalizedAsset[]> {
    const body = path
      ? { path, recursive: options.recursive ?? false, limit: options.limit ?? 100 }
      : { path: '', recursive: options.recursive ?? false, limit: options.limit ?? 100 };

    const response = await this.withRetry(() =>
      this.api('files/list_folder', body)
    );

    return response.entries.map((entry: Record<string, unknown>) => this.normalizeEntry(entry));
  }

  async getAsset(assetId: string): Promise<NormalizedAsset> {
    const response = await this.api('files/get_metadata', { path: assetId });
    return this.normalizeEntry(response);
  }

  async searchAssets(query: string): Promise<NormalizedAsset[]> {
    const response = await this.withRetry(() =>
      this.api('files/search_v2', { query, options: { max_results: 50 } })
    );

    return response.matches.map((m: Record<string, unknown>) =>
      this.normalizeEntry(m.metadata as Record<string, unknown>)
    );
  }

  async fetchContent(assetId: string): Promise<Buffer> {
    const response = await axios.post(
      'https://content.dropboxapi.com/2/files/download',
      null,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Dropbox-API-Arg': JSON.stringify({ path: assetId }),
        },
        responseType: 'arraybuffer',
      }
    );
    return Buffer.from(response.data as ArrayBuffer);
  }

  async pushContent(assetId: string, content: Buffer, metadata?: Record<string, unknown>): Promise<void> {
    await axios.post(
      'https://content.dropboxapi.com/2/files/upload',
      content,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path: assetId,
            mode: 'overwrite',
            autorename: true,
          }),
        },
      }
    );
  }

  async deleteAsset(assetId: string): Promise<void> {
    await this.api('files/delete_v2', { path: assetId });
  }

  async getChanges(since: Date): Promise<AssetChange[]> {
    const response = await this.withRetry(() =>
      this.api('files/list_folder', { path: '', recursive: true, limit: 200 })
    );

    return response.entries
      .filter((e: Record<string, unknown>) => {
        const modified = e.server_modified as string;
        return modified && new Date(modified) > since;
      })
      .map((e: Record<string, unknown>) => ({
        externalId: e.id as string,
        changeType: 'updated' as const,
        asset: this.normalizeEntry(e),
        changedAt: new Date(e.server_modified as string),
      }));
  }

  private async api(endpoint: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await axios.post<Record<string, unknown>>(
      `https://api.dropboxapi.com/2/${endpoint}`,
      body,
      { headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  private normalizeEntry(entry: Record<string, unknown>): NormalizedAsset {
    const isFolder = entry['.tag'] === 'folder';

    return this.buildNormalizedAsset({
      id: (entry.id as string) || (entry.path_lower as string),
      name: entry.name as string,
      type: isFolder ? 'folder' : 'file',
      size: entry.size as number | null,
      path: entry.path_lower as string,
      updatedAt: this.normalizeDate(entry.server_modified),
      createdAt: this.normalizeDate(entry.client_modified),
      metadata: { rev: entry.rev, content_hash: entry.content_hash },
    });
  }
}
