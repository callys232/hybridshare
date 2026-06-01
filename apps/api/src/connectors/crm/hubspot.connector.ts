import axios from 'axios';
import { BaseConnector } from '../base.connector';
import {
  ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions,
} from '@hybridshare/shared/types/connector';

export class HubSpotConnector extends BaseConnector {
  readonly id = 'hubspot';
  readonly name = 'HubSpot';
  readonly type = ConnectorType.HUBSPOT;
  readonly category = ConnectorCategory.CRM;

  private accessToken = '';
  private readonly BASE = 'https://api.hubapi.com';

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
      await this.get('/crm/v3/objects/contacts?limit=1');
      return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message, checkedAt: new Date() };
    }
  }

  async listAssets(objectType = 'contacts', options: ListOptions = {}): Promise<NormalizedAsset[]> {
    const types = objectType === 'root'
      ? ['contacts', 'companies', 'deals', 'tickets']
      : [objectType];

    const assets: NormalizedAsset[] = [];

    if (objectType === 'root') {
      return types.map((t) =>
        this.buildNormalizedAsset({ id: t, name: t.charAt(0).toUpperCase() + t.slice(1), type: 'other', path: `/${t}` })
      );
    }

    const response = await this.withRetry(() =>
      this.get<{ results: Record<string, unknown>[] }>(
        `/crm/v3/objects/${objectType}?limit=${options.limit ?? 100}&properties=hs_object_id,name,email,firstname,lastname`
      )
    );

    return response.results.map((r) => this.normalizeRecord(r, objectType));
  }

  async getAsset(assetId: string): Promise<NormalizedAsset> {
    const [objectType, id] = assetId.split('/');
    const record = await this.get<Record<string, unknown>>(`/crm/v3/objects/${objectType}/${id}`);
    return this.normalizeRecord(record, objectType);
  }

  async searchAssets(query: string): Promise<NormalizedAsset[]> {
    const response = await this.withRetry(() =>
      this.post<{ results: Record<string, unknown>[] }>('/crm/v3/objects/contacts/search', {
        query, limit: 50, properties: ['firstname', 'lastname', 'email'],
      })
    );
    return response.results.map((r) => this.normalizeRecord(r, 'contacts'));
  }

  async fetchContent(assetId: string): Promise<Buffer> {
    const asset = await this.getAsset(assetId);
    return Buffer.from(JSON.stringify(asset.metadata, null, 2));
  }

  async pushContent(assetId: string, content: Buffer): Promise<void> {
    const [objectType, id] = assetId.split('/');
    const properties = JSON.parse(content.toString()) as Record<string, unknown>;
    await this.patch(`/crm/v3/objects/${objectType}/${id}`, { properties });
  }

  async deleteAsset(assetId: string): Promise<void> {
    const [objectType, id] = assetId.split('/');
    await axios.delete(`${this.BASE}/crm/v3/objects/${objectType}/${id}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
  }

  async getChanges(since: Date): Promise<AssetChange[]> {
    const response = await this.withRetry(() =>
      this.post<{ results: Record<string, unknown>[] }>('/crm/v3/objects/contacts/search', {
        filterGroups: [{
          filters: [{ propertyName: 'lastmodifieddate', operator: 'GTE', value: since.getTime().toString() }],
        }],
        limit: 100,
      })
    );
    return response.results.map((r) => ({
      externalId: `contacts/${r.id as string}`,
      changeType: 'updated' as const,
      asset: this.normalizeRecord(r, 'contacts'),
      changedAt: this.normalizeDate((r.properties as Record<string, unknown>)?.lastmodifieddate) ?? new Date(),
    }));
  }

  private async get<T>(path: string): Promise<T> {
    const r = await axios.get<T>(`${this.BASE}${path}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      timeout: 15000,
    });
    return r.data;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const r = await axios.post<T>(`${this.BASE}${path}`, body, {
      headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    return r.data;
  }

  private async patch<T>(path: string, body: unknown): Promise<T> {
    const r = await axios.patch<T>(`${this.BASE}${path}`, body, {
      headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    return r.data;
  }

  private normalizeRecord(record: Record<string, unknown>, objectType: string): NormalizedAsset {
    const props = (record.properties ?? record) as Record<string, unknown>;
    const name = (props.firstname && props.lastname)
      ? `${props.firstname as string} ${props.lastname as string}`
      : (props.name as string) ?? (props.email as string) ?? (record.id as string);
    return this.buildNormalizedAsset({
      id: `${objectType}/${record.id as string}`,
      name: String(name),
      type: 'record',
      path: `/${objectType}/${record.id as string}`,
      metadata: props,
      updatedAt: this.normalizeDate(props.lastmodifieddate),
      createdAt: this.normalizeDate(props.createdate),
    });
  }
}
