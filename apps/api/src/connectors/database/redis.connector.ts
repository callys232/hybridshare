import Redis from 'ioredis';
import { BaseConnector } from '../base.connector';
import {
  ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions,
} from '@hybridshare/shared/types/connector';

export class RedisConnector extends BaseConnector {
  readonly id = 'redis-db';
  readonly name = 'Redis';
  readonly type = ConnectorType.REDIS_DB;
  readonly category = ConnectorCategory.DATABASE;

  private client: Redis | null = null;

  async connect(credentials: Record<string, unknown>): Promise<void> {
    const { host, port, password } = credentials as { host: string; port?: number; password?: string };
    this.client = new Redis({ host, port: port ?? 6379, password, lazyConnect: true, connectTimeout: 8000 });
    await this.client.connect();
    this.credentials = credentials;
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    await this.client?.quit();
    this.client = null;
    this.isConnected = false;
  }

  async testConnection(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      const pong = await this.client!.ping();
      return { healthy: pong === 'PONG', latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message, checkedAt: new Date() };
    }
  }

  async listAssets(_path?: string, options: ListOptions = {}): Promise<NormalizedAsset[]> {
    if (!this.client) throw new Error('Not connected');
    const pattern = (options.filter?.pattern as string) ?? '*';
    const keys = await this.client.keys(pattern);
    const limited = keys.slice(0, options.limit ?? 200);
    const pipeline = this.client.pipeline();
    limited.forEach((k) => pipeline.type(k));
    const types = await pipeline.exec();

    return limited.map((key, i) => {
      const type = (types?.[i]?.[1] as string) ?? 'unknown';
      return this.buildNormalizedAsset({
        id: key, name: key, type: 'other', path: `/${key}`,
        metadata: { redisType: type },
      });
    });
  }

  async getAsset(assetId: string): Promise<NormalizedAsset> {
    if (!this.client) throw new Error('Not connected');
    const [type, ttl] = await Promise.all([this.client.type(assetId), this.client.ttl(assetId)]);
    return this.buildNormalizedAsset({
      id: assetId, name: assetId, type: 'other', path: `/${assetId}`,
      metadata: { redisType: type, ttl },
    });
  }

  async searchAssets(query: string): Promise<NormalizedAsset[]> {
    return this.listAssets(undefined, { filter: { pattern: `*${query}*` } });
  }

  async fetchContent(assetId: string): Promise<Buffer> {
    if (!this.client) throw new Error('Not connected');
    const type = await this.client.type(assetId);
    let value: unknown;
    switch (type) {
      case 'string': value = await this.client.get(assetId); break;
      case 'hash': value = await this.client.hgetall(assetId); break;
      case 'list': value = await this.client.lrange(assetId, 0, -1); break;
      case 'set': value = await this.client.smembers(assetId); break;
      case 'zset': value = await this.client.zrange(assetId, 0, -1, 'WITHSCORES'); break;
      default: value = null;
    }
    return Buffer.from(JSON.stringify({ key: assetId, type, value }, null, 2));
  }

  async pushContent(assetId: string, content: Buffer): Promise<void> {
    if (!this.client) throw new Error('Not connected');
    const { value } = JSON.parse(content.toString()) as { value: string };
    await this.client.set(assetId, value);
  }

  async deleteAsset(assetId: string): Promise<void> {
    if (!this.client) throw new Error('Not connected');
    await this.client.del(assetId);
  }

  async getChanges(_since: Date): Promise<AssetChange[]> {
    return [];
  }
}
