import axios, { type AxiosRequestConfig } from 'axios';
import { BaseConnector } from '../base.connector';
import {
  ConnectorType,
  ConnectorCategory,
  HealthStatus,
  NormalizedAsset,
  AssetChange,
  ListOptions,
} from '@hybridshare/shared/types/connector';

export class RestApiConnector extends BaseConnector {
  readonly id = 'rest-api';
  readonly name = 'REST API';
  readonly type = ConnectorType.REST_API;
  readonly category = ConnectorCategory.CUSTOM;

  private baseUrl = '';
  private headers: Record<string, string> = {};
  private listEndpoint = '';
  private getEndpoint = '';
  private searchEndpoint = '';

  async connect(credentials: Record<string, unknown>): Promise<void> {
    const { baseUrl, authType, token, username, password, apiKeyHeader, apiKeyValue } = credentials as {
      baseUrl: string;
      authType: 'none' | 'bearer' | 'basic' | 'apikey';
      token?: string;
      username?: string;
      password?: string;
      apiKeyHeader?: string;
      apiKeyValue?: string;
    };

    this.baseUrl = baseUrl;

    if (authType === 'bearer' && token) {
      this.headers.Authorization = `Bearer ${token}`;
    } else if (authType === 'basic' && username && password) {
      this.headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    } else if (authType === 'apikey' && apiKeyHeader && apiKeyValue) {
      this.headers[apiKeyHeader] = apiKeyValue;
    }

    const config = credentials.config as Record<string, string> | undefined;
    this.listEndpoint = config?.listEndpoint ?? '/';
    this.getEndpoint = config?.getEndpoint ?? '/{id}';
    this.searchEndpoint = config?.searchEndpoint ?? '/?q={query}';

    this.credentials = credentials;
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    this.headers = {};
    this.isConnected = false;
  }

  async testConnection(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      await this.request('GET', this.listEndpoint);
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

  async listAssets(_path?: string, options: ListOptions = {}): Promise<NormalizedAsset[]> {
    const endpoint = this.listEndpoint + (options.cursor ? `?cursor=${options.cursor}` : '');
    const response = await this.withRetry(() => this.request('GET', endpoint));

    const items = Array.isArray(response) ? response : (response as Record<string, unknown>).data ?? response;

    return (Array.isArray(items) ? items : []).map((item: unknown) =>
      this.normalizeItem(item as Record<string, unknown>)
    );
  }

  async getAsset(assetId: string): Promise<NormalizedAsset> {
    const endpoint = this.getEndpoint.replace('{id}', encodeURIComponent(assetId));
    const response = await this.request<Record<string, unknown>>('GET', endpoint);
    return this.normalizeItem(response);
  }

  async searchAssets(query: string): Promise<NormalizedAsset[]> {
    const endpoint = this.searchEndpoint.replace('{query}', encodeURIComponent(query));
    const response = await this.request('GET', endpoint);
    const items = Array.isArray(response) ? response : (response as Record<string, unknown>).data ?? response;

    return (Array.isArray(items) ? items : []).map((item: unknown) =>
      this.normalizeItem(item as Record<string, unknown>)
    );
  }

  async fetchContent(assetId: string): Promise<Buffer> {
    const endpoint = this.getEndpoint.replace('{id}', encodeURIComponent(assetId));
    const response = await this.request<Record<string, unknown>>('GET', endpoint);
    return Buffer.from(JSON.stringify(response, null, 2));
  }

  async pushContent(assetId: string, content: Buffer): Promise<void> {
    const parsed = JSON.parse(content.toString()) as unknown;
    const endpoint = assetId === 'new'
      ? this.listEndpoint
      : this.getEndpoint.replace('{id}', encodeURIComponent(assetId));
    const method = assetId === 'new' ? 'POST' : 'PUT';
    await this.request(method, endpoint, parsed);
  }

  async deleteAsset(assetId: string): Promise<void> {
    const endpoint = this.getEndpoint.replace('{id}', encodeURIComponent(assetId));
    await this.request('DELETE', endpoint);
  }

  async getChanges(_since: Date): Promise<AssetChange[]> {
    return [];
  }

  private async request<T = unknown>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: { 'Content-Type': 'application/json', ...this.headers },
      data: body,
      timeout: 30000,
    };

    const response = await axios.request<T>(config);
    return response.data;
  }

  private normalizeItem(item: Record<string, unknown>): NormalizedAsset {
    const id = String(item.id ?? item._id ?? item.uuid ?? Math.random());
    const name = String(item.name ?? item.title ?? item.label ?? id);

    return this.buildNormalizedAsset({
      id,
      name,
      type: 'record',
      path: `/${id}`,
      updatedAt: this.normalizeDate(item.updatedAt ?? item.updated_at ?? item.modified),
      createdAt: this.normalizeDate(item.createdAt ?? item.created_at ?? item.created),
      metadata: item,
    });
  }
}
