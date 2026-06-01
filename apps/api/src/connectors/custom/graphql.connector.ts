import axios from 'axios';
import { BaseConnector } from '../base.connector';
import {
  ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions,
} from '@hybridshare/shared/types/connector';

export class GraphQLConnector extends BaseConnector {
  readonly id = 'graphql';
  readonly name = 'GraphQL';
  readonly type = ConnectorType.GRAPHQL;
  readonly category = ConnectorCategory.CUSTOM;

  private endpoint = '';
  private headers: Record<string, string> = {};
  private listQuery = '';
  private getQuery = '';
  private searchQuery = '';

  async connect(credentials: Record<string, unknown>): Promise<void> {
    const { endpoint, authType, token, headers } = credentials as {
      endpoint: string; authType?: string; token?: string; headers?: Record<string, string>;
    };
    this.endpoint = endpoint;
    if (authType === 'bearer' && token) this.headers.Authorization = `Bearer ${token}`;
    if (authType === 'apikey' && token) this.headers['X-API-Key'] = token;
    if (headers) Object.assign(this.headers, headers);

    const config = credentials.config as Record<string, string> | undefined;
    this.listQuery = config?.listQuery ?? '{ items { id name } }';
    this.getQuery = config?.getQuery ?? '{ item(id: $id) { id name } }';
    this.searchQuery = config?.searchQuery ?? '{ search(query: $q) { id name } }';

    this.credentials = credentials;
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    this.endpoint = '';
    this.isConnected = false;
  }

  async testConnection(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      await this.query('{ __typename }');
      return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message, checkedAt: new Date() };
    }
  }

  async listAssets(_path?: string, options: ListOptions = {}): Promise<NormalizedAsset[]> {
    const response = await this.withRetry(() => this.query<{ items?: Record<string, unknown>[] }>(this.listQuery));
    const items = Object.values(response).flat() as Record<string, unknown>[];
    return items.slice(0, options.limit ?? 100).map((item) => this.normalizeItem(item));
  }

  async getAsset(assetId: string): Promise<NormalizedAsset> {
    const response = await this.query<{ item?: Record<string, unknown> }>(
      this.getQuery.replace('$id', JSON.stringify(assetId))
    );
    const item = Object.values(response)[0] as Record<string, unknown>;
    return this.normalizeItem(item);
  }

  async searchAssets(q: string): Promise<NormalizedAsset[]> {
    const response = await this.withRetry(() =>
      this.query<{ search?: Record<string, unknown>[] }>(this.searchQuery.replace('$q', JSON.stringify(q)))
    );
    const items = (Object.values(response)[0] ?? []) as Record<string, unknown>[];
    return items.map((item) => this.normalizeItem(item));
  }

  async fetchContent(assetId: string): Promise<Buffer> {
    const asset = await this.getAsset(assetId);
    return Buffer.from(JSON.stringify(asset.metadata, null, 2));
  }

  async pushContent(_assetId: string, _content: Buffer): Promise<void> {
    throw new Error('GraphQL mutations not configured — add mutationQuery to config');
  }

  async deleteAsset(_assetId: string): Promise<void> {
    throw new Error('GraphQL delete mutations not configured');
  }

  async getChanges(_since: Date): Promise<AssetChange[]> {
    return [];
  }

  private async query<T>(queryStr: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await axios.post<{ data: T; errors?: Array<{ message: string }> }>(
      this.endpoint,
      { query: queryStr, variables },
      { headers: { 'Content-Type': 'application/json', ...this.headers }, timeout: 20000 }
    );
    if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
    return response.data.data;
  }

  private normalizeItem(item: Record<string, unknown>): NormalizedAsset {
    const id = String(item.id ?? item._id ?? Math.random());
    const name = String(item.name ?? item.title ?? item.label ?? id);
    return this.buildNormalizedAsset({
      id, name, type: 'record', path: `/${id}`, metadata: item,
    });
  }
}
