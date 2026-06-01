"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotionConnector = void 0;
const axios_1 = __importDefault(require("axios"));
const base_connector_1 = require("../base.connector");
const connector_1 = require("@hybridshare/shared/types/connector");
class NotionConnector extends base_connector_1.BaseConnector {
    id = 'notion';
    name = 'Notion';
    type = connector_1.ConnectorType.NOTION;
    category = connector_1.ConnectorCategory.CRM;
    apiKey = '';
    BASE = 'https://api.notion.com/v1';
    VERSION = '2022-06-28';
    async connect(credentials) {
        this.apiKey = credentials.apiKey;
        this.credentials = credentials;
        this.isConnected = true;
    }
    async disconnect() {
        this.apiKey = '';
        this.isConnected = false;
    }
    async testConnection() {
        const start = Date.now();
        try {
            await this.get('/users/me');
            return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
        }
        catch (err) {
            return { healthy: false, latencyMs: Date.now() - start, message: err.message, checkedAt: new Date() };
        }
    }
    async listAssets(_path, options = {}) {
        const response = await this.withRetry(() => this.post('/search', {
            filter: { value: 'database', property: 'object' },
            page_size: options.limit ?? 50,
        }));
        return response.results.map((db) => this.normalizeDatabase(db));
    }
    async getAsset(assetId) {
        const db = await this.get(`/databases/${assetId}`);
        return this.normalizeDatabase(db);
    }
    async searchAssets(query) {
        const response = await this.withRetry(() => this.post('/search', { query, page_size: 50 }));
        return response.results.map((item) => this.normalizeDatabase(item));
    }
    async fetchContent(assetId) {
        const response = await this.withRetry(() => this.post(`/databases/${assetId}/query`, { page_size: 100 }));
        return Buffer.from(JSON.stringify(response.results, null, 2));
    }
    async pushContent(assetId, content) {
        const records = JSON.parse(content.toString());
        for (const record of records) {
            await this.post('/pages', { parent: { database_id: assetId }, properties: record.properties || record });
        }
    }
    async deleteAsset(assetId) {
        await this.patch(`/pages/${assetId}`, { archived: true });
    }
    async getChanges(since) {
        const response = await this.post('/search', {
            filter: { timestamp: 'last_edited_time', last_edited_time: { on_or_after: since.toISOString() } },
            page_size: 100,
        });
        return response.results.map((item) => ({
            externalId: item.id,
            changeType: 'updated',
            asset: this.normalizeDatabase(item),
            changedAt: new Date(item.last_edited_time),
        }));
    }
    async get(path) {
        const r = await axios_1.default.get(`${this.BASE}${path}`, {
            headers: { Authorization: `Bearer ${this.apiKey}`, 'Notion-Version': this.VERSION },
            timeout: 15000,
        });
        return r.data;
    }
    async post(path, body) {
        const r = await axios_1.default.post(`${this.BASE}${path}`, body, {
            headers: { Authorization: `Bearer ${this.apiKey}`, 'Notion-Version': this.VERSION, 'Content-Type': 'application/json' },
            timeout: 15000,
        });
        return r.data;
    }
    async patch(path, body) {
        const r = await axios_1.default.patch(`${this.BASE}${path}`, body, {
            headers: { Authorization: `Bearer ${this.apiKey}`, 'Notion-Version': this.VERSION, 'Content-Type': 'application/json' },
            timeout: 15000,
        });
        return r.data;
    }
    normalizeDatabase(db) {
        const title = db.title?.[0]?.plain_text
            ?? db.properties?.Name?.title?.[0]?.plain_text
            ?? db.id;
        return this.buildNormalizedAsset({
            id: db.id,
            name: String(title),
            type: db.object === 'database' ? 'other' : 'record',
            path: `/${db.id}`,
            url: db.url,
            createdAt: this.normalizeDate(db.created_time),
            updatedAt: this.normalizeDate(db.last_edited_time),
            metadata: { object: db.object },
        });
    }
}
exports.NotionConnector = NotionConnector;
//# sourceMappingURL=notion.connector.js.map