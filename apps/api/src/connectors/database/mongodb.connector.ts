import { MongoClient, type Db } from 'mongodb';
import { BaseConnector } from '../base.connector';
import {
  ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions,
} from '@hybridshare/shared/types/connector';

export class MongoDBConnector extends BaseConnector {
  readonly id = 'mongodb';
  readonly name = 'MongoDB';
  readonly type = ConnectorType.MONGODB;
  readonly category = ConnectorCategory.DATABASE;

  private client: MongoClient | null = null;
  private db: Db | null = null;
  private dbName = '';

  async connect(credentials: Record<string, unknown>): Promise<void> {
    const { connectionString, database } = credentials as { connectionString: string; database: string };
    this.client = new MongoClient(connectionString, { serverSelectionTimeoutMS: 10000 });
    await this.client.connect();
    this.db = this.client.db(database);
    this.dbName = database;
    this.credentials = credentials;
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    await this.client?.close();
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async testConnection(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      if (!this.db) throw new Error('Not connected');
      await this.db.admin().ping();
      return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message, checkedAt: new Date() };
    }
  }

  async listAssets(_path?: string, _options: ListOptions = {}): Promise<NormalizedAsset[]> {
    if (!this.db) throw new Error('Not connected');
    const collections = await this.db.listCollections().toArray();
    return collections.map((c) =>
      this.buildNormalizedAsset({
        id: `${this.dbName}.${c.name}`,
        name: c.name,
        type: 'record',
        path: `/${c.name}`,
        metadata: { type: c.type, options: c.options },
      })
    );
  }

  async getAsset(assetId: string): Promise<NormalizedAsset> {
    if (!this.db) throw new Error('Not connected');
    const collectionName = assetId.split('.').pop() ?? assetId;
    const count = await this.db.collection(collectionName).estimatedDocumentCount();
    const sample = await this.db.collection(collectionName).findOne({});
    return this.buildNormalizedAsset({
      id: assetId,
      name: collectionName,
      type: 'record',
      path: `/${collectionName}`,
      metadata: { documentCount: count, sampleFields: sample ? Object.keys(sample) : [] },
    });
  }

  async searchAssets(query: string): Promise<NormalizedAsset[]> {
    const all = await this.listAssets();
    return all.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
  }

  async fetchContent(assetId: string): Promise<Buffer> {
    if (!this.db) throw new Error('Not connected');
    const collectionName = assetId.split('.').pop() ?? assetId;
    const docs = await this.db.collection(collectionName).find({}).limit(1000).toArray();
    return Buffer.from(JSON.stringify(docs, null, 2));
  }

  async pushContent(assetId: string, content: Buffer): Promise<void> {
    if (!this.db) throw new Error('Not connected');
    const collectionName = assetId.split('.').pop() ?? assetId;
    const docs = JSON.parse(content.toString()) as Record<string, unknown>[];
    if (Array.isArray(docs) && docs.length > 0) {
      await this.db.collection(collectionName).insertMany(docs, { ordered: false });
    }
  }

  async deleteAsset(assetId: string): Promise<void> {
    if (!this.db) throw new Error('Not connected');
    const collectionName = assetId.split('.').pop() ?? assetId;
    await this.db.collection(collectionName).drop();
  }

  async getChanges(_since: Date): Promise<AssetChange[]> {
    return [];
  }
}
