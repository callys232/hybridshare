import Database from 'better-sqlite3';
import { BaseConnector } from '../base.connector';
import {
  ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions,
} from '@hybridshare/shared/types/connector';

export class SQLiteConnector extends BaseConnector {
  readonly id = 'sqlite';
  readonly name = 'SQLite';
  readonly type = ConnectorType.SQLITE;
  readonly category = ConnectorCategory.DATABASE;

  private db: Database.Database | null = null;
  private filePath = '';

  async connect(credentials: Record<string, unknown>): Promise<void> {
    this.filePath = credentials.filePath as string;
    this.db = new Database(this.filePath, { readonly: false, fileMustExist: true });
    this.credentials = credentials;
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    this.db?.close();
    this.db = null;
    this.isConnected = false;
  }

  async testConnection(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      this.db!.prepare('SELECT 1').get();
      return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message, checkedAt: new Date() };
    }
  }

  async listAssets(_path?: string, _options: ListOptions = {}): Promise<NormalizedAsset[]> {
    if (!this.db) throw new Error('Not connected');
    const tables = this.db.prepare(
      "SELECT name, type FROM sqlite_master WHERE type IN ('table','view') ORDER BY name"
    ).all() as Array<{ name: string; type: string }>;

    return tables.map((t) =>
      this.buildNormalizedAsset({
        id: t.name, name: t.name, type: 'record', path: `/${t.name}`,
        metadata: { sqliteType: t.type },
      })
    );
  }

  async getAsset(assetId: string): Promise<NormalizedAsset> {
    if (!this.db) throw new Error('Not connected');
    const cols = this.db.prepare(`PRAGMA table_info(${assetId})`).all();
    const count = (this.db.prepare(`SELECT COUNT(*) AS cnt FROM "${assetId}"`).get() as { cnt: number }).cnt;
    return this.buildNormalizedAsset({
      id: assetId, name: assetId, type: 'record', path: `/${assetId}`,
      metadata: { columns: cols, rowCount: count },
    });
  }

  async searchAssets(query: string): Promise<NormalizedAsset[]> {
    const all = await this.listAssets();
    return all.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
  }

  async fetchContent(assetId: string): Promise<Buffer> {
    if (!this.db) throw new Error('Not connected');
    const rows = this.db.prepare(`SELECT * FROM "${assetId}" LIMIT 1000`).all();
    return Buffer.from(JSON.stringify(rows, null, 2));
  }

  async pushContent(assetId: string, content: Buffer): Promise<void> {
    if (!this.db) throw new Error('Not connected');
    const records = JSON.parse(content.toString()) as Record<string, unknown>[];
    if (!records.length) return;
    const keys = Object.keys(records[0]);
    const cols = keys.map((k) => `"${k}"`).join(', ');
    const placeholders = keys.map((k) => `@${k}`).join(', ');
    const stmt = this.db.prepare(`INSERT OR IGNORE INTO "${assetId}" (${cols}) VALUES (${placeholders})`);
    const insertMany = this.db.transaction((rows: Record<string, unknown>[]) => rows.forEach((r) => stmt.run(r)));
    insertMany(records);
  }

  async deleteAsset(assetId: string): Promise<void> {
    if (!this.db) throw new Error('Not connected');
    this.db.prepare(`DROP TABLE IF EXISTS "${assetId}"`).run();
  }

  async getChanges(_since: Date): Promise<AssetChange[]> {
    return [];
  }
}
