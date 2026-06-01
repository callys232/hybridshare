import sql from 'mssql';
import { BaseConnector } from '../base.connector';
import {
  ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions,
} from '@hybridshare/shared/types/connector';

export class MSSQLConnector extends BaseConnector {
  readonly id = 'mssql';
  readonly name = 'SQL Server';
  readonly type = ConnectorType.MSSQL;
  readonly category = ConnectorCategory.DATABASE;

  private pool: sql.ConnectionPool | null = null;
  private database = '';

  async connect(credentials: Record<string, unknown>): Promise<void> {
    const { host, port, database, username, password } = credentials as {
      host: string; port?: number; database: string; username: string; password: string;
    };
    this.pool = new sql.ConnectionPool({
      server: host, port: port ?? 1433, database, user: username, password,
      options: { encrypt: true, trustServerCertificate: true },
      connectionTimeout: 10000,
    });
    await this.pool.connect();
    this.database = database;
    this.credentials = credentials;
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    await this.pool?.close();
    this.pool = null;
    this.isConnected = false;
  }

  async testConnection(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      await this.pool!.request().query('SELECT 1');
      return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message, checkedAt: new Date() };
    }
  }

  async listAssets(_path?: string, options: ListOptions = {}): Promise<NormalizedAsset[]> {
    if (!this.pool) throw new Error('Not connected');
    const result = await this.pool.request().query(
      `SELECT TOP ${options.limit ?? 100} t.name AS TABLE_NAME, t.type_desc AS TABLE_TYPE,
       p.rows AS ROW_COUNT
       FROM sys.tables t INNER JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1)
       ORDER BY t.name`
    );
    return result.recordset.map((r: Record<string, unknown>) =>
      this.buildNormalizedAsset({
        id: `${this.database}.${r.TABLE_NAME as string}`,
        name: r.TABLE_NAME as string,
        type: 'record',
        path: `/${r.TABLE_NAME as string}`,
        metadata: { tableType: r.TABLE_TYPE, rowCount: r.ROW_COUNT },
      })
    );
  }

  async getAsset(assetId: string): Promise<NormalizedAsset> {
    if (!this.pool) throw new Error('Not connected');
    const tableName = assetId.split('.').pop() ?? assetId;
    const cols = await this.pool.request().query(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableName}' ORDER BY ORDINAL_POSITION`
    );
    return this.buildNormalizedAsset({
      id: assetId, name: tableName, type: 'record', path: `/${tableName}`,
      metadata: { columns: cols.recordset },
    });
  }

  async searchAssets(query: string): Promise<NormalizedAsset[]> {
    const all = await this.listAssets();
    return all.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
  }

  async fetchContent(assetId: string): Promise<Buffer> {
    if (!this.pool) throw new Error('Not connected');
    const tableName = assetId.split('.').pop() ?? assetId;
    const result = await this.pool.request().query(`SELECT TOP 1000 * FROM [${tableName}]`);
    return Buffer.from(JSON.stringify(result.recordset, null, 2));
  }

  async pushContent(assetId: string, content: Buffer): Promise<void> {
    if (!this.pool) throw new Error('Not connected');
    const tableName = assetId.split('.').pop() ?? assetId;
    const records = JSON.parse(content.toString()) as Record<string, unknown>[];
    if (!records.length) return;
    const keys = Object.keys(records[0]);
    const cols = keys.map((k) => `[${k}]`).join(', ');
    for (const row of records) {
      const req = this.pool.request();
      const vals = keys.map((k, i) => { req.input(`p${i}`, row[k]); return `@p${i}`; }).join(', ');
      await req.query(`INSERT INTO [${tableName}] (${cols}) VALUES (${vals})`);
    }
  }

  async deleteAsset(assetId: string): Promise<void> {
    if (!this.pool) throw new Error('Not connected');
    const tableName = assetId.split('.').pop() ?? assetId;
    await this.pool.request().query(`DROP TABLE IF EXISTS [${tableName}]`);
  }

  async getChanges(_since: Date): Promise<AssetChange[]> {
    return [];
  }
}
