"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresConnector = void 0;
const pg_1 = require("pg");
const base_connector_1 = require("../base.connector");
const connector_1 = require("@hybridshare/shared/types/connector");
class PostgresConnector extends base_connector_1.BaseConnector {
    id = 'postgres';
    name = 'PostgreSQL';
    type = connector_1.ConnectorType.POSTGRES;
    category = connector_1.ConnectorCategory.DATABASE;
    pool = null;
    async connect(credentials) {
        const { host, port, database, username, password, ssl } = credentials;
        this.pool = new pg_1.Pool({
            host,
            port: port ?? 5432,
            database,
            user: username,
            password,
            ssl: ssl ? { rejectUnauthorized: false } : false,
            max: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });
        this.credentials = credentials;
        this.isConnected = true;
    }
    async disconnect() {
        await this.pool?.end();
        this.pool = null;
        this.isConnected = false;
    }
    async testConnection() {
        const start = Date.now();
        let client;
        try {
            if (!this.pool)
                throw new Error('Not connected');
            client = await this.pool.connect();
            await client.query('SELECT 1');
            return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
        }
        catch (err) {
            return {
                healthy: false,
                latencyMs: Date.now() - start,
                message: err instanceof Error ? err.message : 'Failed',
                checkedAt: new Date(),
            };
        }
        finally {
            client?.release();
        }
    }
    async listAssets(schema = 'public', options = {}) {
        if (!this.pool)
            throw new Error('Not connected');
        const result = await this.withRetry(() => this.pool.query(`SELECT t.table_name, t.table_type,
         COALESCE(s.n_live_tup, 0) as row_count
         FROM information_schema.tables t
         LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
         WHERE t.table_schema = $1
         ORDER BY t.table_name
         LIMIT $2`, [schema, options.limit ?? 100]));
        return result.rows.map((row) => this.buildNormalizedAsset({
            id: `${schema}.${row.table_name}`,
            name: row.table_name,
            type: row.table_type === 'VIEW' ? 'other' : 'record',
            path: `${schema}/${row.table_name}`,
            metadata: {
                schema,
                tableType: row.table_type,
                rowCount: Number(row.row_count),
            },
        }));
    }
    async getAsset(assetId) {
        if (!this.pool)
            throw new Error('Not connected');
        const [schema, tableName] = assetId.split('.');
        const [colResult, countResult] = await Promise.all([
            this.pool.query(`SELECT column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_schema = $1 AND table_name = $2
         ORDER BY ordinal_position`, [schema, tableName]),
            this.pool.query(`SELECT COUNT(*) as count FROM "${schema}"."${tableName}"`),
        ]);
        return this.buildNormalizedAsset({
            id: assetId,
            name: tableName,
            type: 'record',
            path: `${schema}/${tableName}`,
            metadata: {
                schema,
                columns: colResult.rows,
                rowCount: parseInt(countResult.rows[0]?.count ?? '0'),
            },
        });
    }
    async searchAssets(query) {
        const all = await this.listAssets();
        return all.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
    }
    async fetchContent(assetId) {
        if (!this.pool)
            throw new Error('Not connected');
        const [schema, tableName] = assetId.split('.');
        const result = await this.pool.query(`SELECT * FROM "${schema}"."${tableName}" LIMIT 1000`);
        return Buffer.from(JSON.stringify(result.rows, null, 2));
    }
    async pushContent(assetId, content, metadata) {
        if (!this.pool)
            throw new Error('Not connected');
        const records = JSON.parse(content.toString());
        const [schema, tableName] = assetId.split('.');
        if (!Array.isArray(records) || records.length === 0)
            return;
        const keys = Object.keys(records[0]);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO "${schema}"."${tableName}" (${keys.map((k) => `"${k}"`).join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            for (const record of records) {
                await client.query(query, keys.map((k) => record[k]));
            }
            await client.query('COMMIT');
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
    async deleteAsset(assetId) {
        if (!this.pool)
            throw new Error('Not connected');
        const [schema, tableName] = assetId.split('.');
        await this.pool.query(`DROP TABLE IF EXISTS "${schema}"."${tableName}"`);
    }
    async getChanges(_since) {
        return [];
    }
}
exports.PostgresConnector = PostgresConnector;
//# sourceMappingURL=postgres.connector.js.map