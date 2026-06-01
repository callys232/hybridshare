import mysql, { type Pool, type PoolConnection } from 'mysql2/promise';
import { BaseConnector } from '../base.connector';
import {
  ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions,
} from '@hybridshare/shared/types/connector';

export class MySQLConnector extends BaseConnector {
  readonly id = 'mysql';
  readonly name = 'MySQL';
  readonly type = ConnectorType.MYSQL;
  readonly category = ConnectorCategory.DATABASE;

  private pool: Pool | null = null;
  private database = '';

  async connect(credentials: Record<string, unknown>): Promise<void> {
    const { host, port, database, username, password, ssl } = credentials as {
      host: string; port: number; database: string; username: string; password: string; ssl?: boolean;
    };
    this.pool = mysql.createPool({
      host, port: port ?? 3306, database, user: username, password,
      ssl: ssl ? {} : undefined, connectionLimit: 5, connectTimeout: 10000,
    });
    this.database = database;
    this.credentials = credentials;
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    await this.pool?.end();
    this.pool = null;
    this.isConnected = false;
  }

  async testConnection(): Promise<HealthStatus> {
    const start = Date.now();
    let conn: PoolConnection | undefined;
    try {
      if (!this.pool) throw new Error('Not connected');
      conn = await this.pool.getConnection();
      await conn.query('SELECT 1');
      return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message, checkedAt: new Date() };
    } finally {
      conn?.release();
    }
  }

  async listAssets(_path?: string, options: ListOptions = {}): Promise<NormalizedAsset[]> {
    if (!this.pool) throw new Error('Not connected');
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      'SELECT TABLE_NAME, TABLE_ROWS, TABLE_TYPE FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? LIMIT ?',
      [this.database, options.limit ?? 100]
    );
    return rows.map((r) =>
      this.buildNormalizedAsset({
        id: `${this.database}.${r.TABLE_NAME as string}`,
        name: r.TABLE_NAME as string,
        type: 'record',
        path: `/${r.TABLE_NAME as string}`,
        metadata: { tableType: r.TABLE_TYPE, rowCount: r.TABLE_ROWS },
      })
    );
  }

  async getAsset(assetId: string): Promise<NormalizedAsset> {
    if (!this.pool) throw new Error('Not connected');
    const [, tableName] = assetId.split('.');
    const [cols] = await this.pool.query<mysql.RowDataPacket[]>(
      'SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION',
      [this.database, tableName]
    );
    const [[countRow]] = await this.pool.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS cnt FROM \`${tableName}\``);
    return this.buildNormalizedAsset({
      id: assetId, name: tableName, type: 'record', path: `/${tableName}`,
      metadata: { columns: cols, rowCount: (countRow as mysql.RowDataPacket).cnt },
    });
  }

  async searchAssets(query: string): Promise<NormalizedAsset[]> {
    const all = await this.listAssets();
    return all.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
  }

  async fetchContent(assetId: string): Promise<Buffer> {
    if (!this.pool) throw new Error('Not connected');
    const [, tableName] = assetId.split('.');
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(`SELECT * FROM \`${tableName}\` LIMIT 1000`);
    return Buffer.from(JSON.stringify(rows, null, 2));
  }

  async pushContent(assetId: string, content: Buffer): Promise<void> {
    if (!this.pool) throw new Error('Not connected');
    const [, tableName] = assetId.split('.');
    const records = JSON.parse(content.toString()) as Record<string, unknown>[];
    if (!records.length) return;
    const keys = Object.keys(records[0]);
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const row of records) {
        const vals = keys.map((k) => row[k]);
        const placeholders = keys.map(() => '?').join(', ');
        const cols = keys.map((k) => `\`${k}\``).join(', ');
        await conn.query(`INSERT IGNORE INTO \`${tableName}\` (${cols}) VALUES (${placeholders})`, vals);
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async deleteAsset(assetId: string): Promise<void> {
    if (!this.pool) throw new Error('Not connected');
    const [, tableName] = assetId.split('.');
    await this.pool.query(`DROP TABLE IF EXISTS \`${tableName}\``);
  }

  async getChanges(_since: Date): Promise<AssetChange[]> {
    return [];
  }
}
