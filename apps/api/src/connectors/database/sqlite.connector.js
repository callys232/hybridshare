"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLiteConnector = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const base_connector_1 = require("../base.connector");
const connector_1 = require("@hybridshare/shared/types/connector");
class SQLiteConnector extends base_connector_1.BaseConnector {
    id = 'sqlite';
    name = 'SQLite';
    type = connector_1.ConnectorType.SQLITE;
    category = connector_1.ConnectorCategory.DATABASE;
    db = null;
    filePath = '';
    async connect(credentials) {
        this.filePath = credentials.filePath;
        this.db = new better_sqlite3_1.default(this.filePath, { readonly: false, fileMustExist: true });
        this.credentials = credentials;
        this.isConnected = true;
    }
    async disconnect() {
        this.db?.close();
        this.db = null;
        this.isConnected = false;
    }
    async testConnection() {
        const start = Date.now();
        try {
            this.db.prepare('SELECT 1').get();
            return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
        }
        catch (err) {
            return { healthy: false, latencyMs: Date.now() - start, message: err.message, checkedAt: new Date() };
        }
    }
    async listAssets(_path, _options = {}) {
        if (!this.db)
            throw new Error('Not connected');
        const tables = this.db.prepare("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') ORDER BY name").all();
        return tables.map((t) => this.buildNormalizedAsset({
            id: t.name, name: t.name, type: 'record', path: `/${t.name}`,
            metadata: { sqliteType: t.type },
        }));
    }
    async getAsset(assetId) {
        if (!this.db)
            throw new Error('Not connected');
        const cols = this.db.prepare(`PRAGMA table_info(${assetId})`).all();
        const count = this.db.prepare(`SELECT COUNT(*) AS cnt FROM "${assetId}"`).get().cnt;
        return this.buildNormalizedAsset({
            id: assetId, name: assetId, type: 'record', path: `/${assetId}`,
            metadata: { columns: cols, rowCount: count },
        });
    }
    async searchAssets(query) {
        const all = await this.listAssets();
        return all.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
    }
    async fetchContent(assetId) {
        if (!this.db)
            throw new Error('Not connected');
        const rows = this.db.prepare(`SELECT * FROM "${assetId}" LIMIT 1000`).all();
        return Buffer.from(JSON.stringify(rows, null, 2));
    }
    async pushContent(assetId, content) {
        if (!this.db)
            throw new Error('Not connected');
        const records = JSON.parse(content.toString());
        if (!records.length)
            return;
        const keys = Object.keys(records[0]);
        const cols = keys.map((k) => `"${k}"`).join(', ');
        const placeholders = keys.map((k) => `@${k}`).join(', ');
        const stmt = this.db.prepare(`INSERT OR IGNORE INTO "${assetId}" (${cols}) VALUES (${placeholders})`);
        const insertMany = this.db.transaction((rows) => rows.forEach((r) => stmt.run(r)));
        insertMany(records);
    }
    async deleteAsset(assetId) {
        if (!this.db)
            throw new Error('Not connected');
        this.db.prepare(`DROP TABLE IF EXISTS "${assetId}"`).run();
    }
    async getChanges(_since) {
        return [];
    }
}
exports.SQLiteConnector = SQLiteConnector;
//# sourceMappingURL=sqlite.connector.js.map