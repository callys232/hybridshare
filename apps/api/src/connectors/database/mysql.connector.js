"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLConnector = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const base_connector_1 = require("../base.connector");
const connector_1 = require("@hybridshare/shared/types/connector");
class MySQLConnector extends base_connector_1.BaseConnector {
    id = 'mysql';
    name = 'MySQL';
    type = connector_1.ConnectorType.MYSQL;
    category = connector_1.ConnectorCategory.DATABASE;
    pool = null;
    database = '';
    async connect(credentials) {
        const { host, port, database, username, password, ssl } = credentials;
        this.pool = promise_1.default.createPool({
            host, port: port ?? 3306, database, user: username, password,
            ssl: ssl ? {} : undefined, connectionLimit: 5, connectTimeout: 10000,
        });
        this.database = database;
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
        let conn;
        try {
            if (!this.pool)
                throw new Error('Not connected');
            conn = await this.pool.getConnection();
            await conn.query('SELECT 1');
            return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
        }
        catch (err) {
            return { healthy: false, latencyMs: Date.now() - start, message: err.message, checkedAt: new Date() };
        }
        finally {
            conn?.release();
        }
    }
    async listAssets(_path, options = {}) {
        if (!this.pool)
            throw new Error('Not connected');
        const [rows] = await this.pool.query('SELECT TABLE_NAME, TABLE_ROWS, TABLE_TYPE FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? LIMIT ?', [this.database, options.limit ?? 100]);
        return rows.map((r) => this.buildNormalizedAsset({
            id: `${this.database}.${r.TABLE_NAME}`,
            name: r.TABLE_NAME,
            type: 'record',
            path: `/${r.TABLE_NAME}`,
            metadata: { tableType: r.TABLE_TYPE, rowCount: r.TABLE_ROWS },
        }));
    }
    async getAsset(assetId) {
        if (!this.pool)
            throw new Error('Not connected');
        const [, tableName] = assetId.split('.');
        const [cols] = await this.pool.query('SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION', [this.database, tableName]);
        const [[countRow]] = await this.pool.query(`SELECT COUNT(*) AS cnt FROM \`${tableName}\``);
        return this.buildNormalizedAsset({
            id: assetId, name: tableName, type: 'record', path: `/${tableName}`,
            metadata: { columns: cols, rowCount: countRow.cnt },
        });
    }
    async searchAssets(query) {
        const all = await this.listAssets();
        return all.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
    }
    async fetchContent(assetId) {
        if (!this.pool)
            throw new Error('Not connected');
        const [, tableName] = assetId.split('.');
        const [rows] = await this.pool.query(`SELECT * FROM \`${tableName}\` LIMIT 1000`);
        return Buffer.from(JSON.stringify(rows, null, 2));
    }
    async pushContent(assetId, content) {
        if (!this.pool)
            throw new Error('Not connected');
        const [, tableName] = assetId.split('.');
        const records = JSON.parse(content.toString());
        if (!records.length)
            return;
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
        }
        catch (err) {
            await conn.rollback();
            throw err;
        }
        finally {
            conn.release();
        }
    }
    async deleteAsset(assetId) {
        if (!this.pool)
            throw new Error('Not connected');
        const [, tableName] = assetId.split('.');
        await this.pool.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    }
    async getChanges(_since) {
        return [];
    }
}
exports.MySQLConnector = MySQLConnector;
//# sourceMappingURL=mysql.connector.js.map