"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirtableConnector = void 0;
const axios_1 = __importDefault(require("axios"));
const base_connector_1 = require("../base.connector");
const connector_1 = require("@hybridshare/shared/types/connector");
class AirtableConnector extends base_connector_1.BaseConnector {
    id = 'airtable';
    name = 'Airtable';
    type = connector_1.ConnectorType.AIRTABLE;
    category = connector_1.ConnectorCategory.CRM;
    apiKey = '';
    baseId = '';
    BASE_URL = 'https://api.airtable.com/v0';
    async connect(credentials) {
        this.apiKey = credentials.apiKey;
        this.baseId = credentials.baseId;
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
            await this.request('GET', `meta/bases/${this.baseId}/tables`);
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
    }
    async listAssets(tableName, options = {}) {
        if (!tableName) {
            const response = await this.request('GET', `meta/bases/${this.baseId}/tables`);
            return response.tables.map((t) => this.buildNormalizedAsset({
                id: t.id,
                name: t.name,
                type: 'other',
                path: `${this.baseId}/${t.name}`,
                metadata: { baseId: this.baseId, tableId: t.id },
            }));
        }
        const records = await this.fetchAllRecords(tableName, options.limit);
        return records.map((r) => this.normalizeRecord(r, tableName));
    }
    async getAsset(assetId) {
        const [tableId, recordId] = assetId.split('/');
        const record = await this.request('GET', `${this.baseId}/${tableId}/${recordId}`);
        return this.normalizeRecord(record, tableId);
    }
    async searchAssets(query) {
        const tablesResponse = await this.request('GET', `meta/bases/${this.baseId}/tables`);
        const results = [];
        for (const table of tablesResponse.tables.slice(0, 3)) {
            const records = await this.request('GET', `${this.baseId}/${table.name}?filterByFormula=SEARCH("${query}", ARRAYJOIN(ARRAYUNIQUE(VALUES(RECORD_ID()))))&maxRecords=10`);
            results.push(...records.records.map((r) => this.normalizeRecord(r, table.name)));
        }
        return results;
    }
    async fetchContent(assetId) {
        const [tableId] = assetId.split('/');
        const records = await this.fetchAllRecords(tableId);
        return Buffer.from(JSON.stringify(records, null, 2));
    }
    async pushContent(assetId, content) {
        const [tableId] = assetId.split('/');
        const records = JSON.parse(content.toString());
        for (let i = 0; i < records.length; i += 10) {
            const batch = records.slice(i, i + 10).map((r) => ({ fields: r.fields || r }));
            await this.request('POST', `${this.baseId}/${tableId}`, { records: batch });
        }
    }
    async deleteAsset(assetId) {
        const [tableId, recordId] = assetId.split('/');
        await this.request('DELETE', `${this.baseId}/${tableId}/${recordId}`);
    }
    async getChanges(_since) {
        return [];
    }
    async fetchAllRecords(tableId, limit = 100) {
        const response = await this.withRetry(() => this.request('GET', `${this.baseId}/${tableId}?maxRecords=${limit}`));
        return response.records;
    }
    async request(method, endpoint, body) {
        const response = await axios_1.default.request({
            method,
            url: `${this.BASE_URL}/${endpoint}`,
            headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
            data: body,
            timeout: 15000,
        });
        return response.data;
    }
    normalizeRecord(record, tableName) {
        const name = Object.values(record.fields)[0]?.toString() ?? record.id;
        return this.buildNormalizedAsset({
            id: `${tableName}/${record.id}`,
            name: String(name),
            type: 'record',
            path: `${this.baseId}/${tableName}/${record.id}`,
            createdAt: this.normalizeDate(record.createdTime),
            metadata: record.fields,
        });
    }
}
exports.AirtableConnector = AirtableConnector;
//# sourceMappingURL=airtable.connector.js.map