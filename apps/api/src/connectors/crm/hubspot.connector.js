"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HubSpotConnector = void 0;
const axios_1 = __importDefault(require("axios"));
const base_connector_1 = require("../base.connector");
const connector_1 = require("@hybridshare/shared/types/connector");
class HubSpotConnector extends base_connector_1.BaseConnector {
    id = 'hubspot';
    name = 'HubSpot';
    type = connector_1.ConnectorType.HUBSPOT;
    category = connector_1.ConnectorCategory.CRM;
    accessToken = '';
    BASE = 'https://api.hubapi.com';
    async connect(credentials) {
        this.accessToken = credentials.accessToken;
        this.credentials = credentials;
        this.isConnected = true;
    }
    async disconnect() {
        this.accessToken = '';
        this.isConnected = false;
    }
    async testConnection() {
        const start = Date.now();
        try {
            await this.get('/crm/v3/objects/contacts?limit=1');
            return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
        }
        catch (err) {
            return { healthy: false, latencyMs: Date.now() - start, message: err.message, checkedAt: new Date() };
        }
    }
    async listAssets(objectType = 'contacts', options = {}) {
        const types = objectType === 'root'
            ? ['contacts', 'companies', 'deals', 'tickets']
            : [objectType];
        const assets = [];
        if (objectType === 'root') {
            return types.map((t) => this.buildNormalizedAsset({ id: t, name: t.charAt(0).toUpperCase() + t.slice(1), type: 'other', path: `/${t}` }));
        }
        const response = await this.withRetry(() => this.get(`/crm/v3/objects/${objectType}?limit=${options.limit ?? 100}&properties=hs_object_id,name,email,firstname,lastname`));
        return response.results.map((r) => this.normalizeRecord(r, objectType));
    }
    async getAsset(assetId) {
        const [objectType, id] = assetId.split('/');
        const record = await this.get(`/crm/v3/objects/${objectType}/${id}`);
        return this.normalizeRecord(record, objectType);
    }
    async searchAssets(query) {
        const response = await this.withRetry(() => this.post('/crm/v3/objects/contacts/search', {
            query, limit: 50, properties: ['firstname', 'lastname', 'email'],
        }));
        return response.results.map((r) => this.normalizeRecord(r, 'contacts'));
    }
    async fetchContent(assetId) {
        const asset = await this.getAsset(assetId);
        return Buffer.from(JSON.stringify(asset.metadata, null, 2));
    }
    async pushContent(assetId, content) {
        const [objectType, id] = assetId.split('/');
        const properties = JSON.parse(content.toString());
        await this.patch(`/crm/v3/objects/${objectType}/${id}`, { properties });
    }
    async deleteAsset(assetId) {
        const [objectType, id] = assetId.split('/');
        await axios_1.default.delete(`${this.BASE}/crm/v3/objects/${objectType}/${id}`, {
            headers: { Authorization: `Bearer ${this.accessToken}` },
        });
    }
    async getChanges(since) {
        const response = await this.withRetry(() => this.post('/crm/v3/objects/contacts/search', {
            filterGroups: [{
                    filters: [{ propertyName: 'lastmodifieddate', operator: 'GTE', value: since.getTime().toString() }],
                }],
            limit: 100,
        }));
        return response.results.map((r) => ({
            externalId: `contacts/${r.id}`,
            changeType: 'updated',
            asset: this.normalizeRecord(r, 'contacts'),
            changedAt: this.normalizeDate(r.properties?.lastmodifieddate) ?? new Date(),
        }));
    }
    async get(path) {
        const r = await axios_1.default.get(`${this.BASE}${path}`, {
            headers: { Authorization: `Bearer ${this.accessToken}` },
            timeout: 15000,
        });
        return r.data;
    }
    async post(path, body) {
        const r = await axios_1.default.post(`${this.BASE}${path}`, body, {
            headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
            timeout: 15000,
        });
        return r.data;
    }
    async patch(path, body) {
        const r = await axios_1.default.patch(`${this.BASE}${path}`, body, {
            headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
            timeout: 15000,
        });
        return r.data;
    }
    normalizeRecord(record, objectType) {
        const props = (record.properties ?? record);
        const name = (props.firstname && props.lastname)
            ? `${props.firstname} ${props.lastname}`
            : props.name ?? props.email ?? record.id;
        return this.buildNormalizedAsset({
            id: `${objectType}/${record.id}`,
            name: String(name),
            type: 'record',
            path: `/${objectType}/${record.id}`,
            metadata: props,
            updatedAt: this.normalizeDate(props.lastmodifieddate),
            createdAt: this.normalizeDate(props.createdate),
        });
    }
}
exports.HubSpotConnector = HubSpotConnector;
//# sourceMappingURL=hubspot.connector.js.map