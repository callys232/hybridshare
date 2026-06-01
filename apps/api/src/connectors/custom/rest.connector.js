"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestApiConnector = void 0;
const axios_1 = __importDefault(require("axios"));
const base_connector_1 = require("../base.connector");
const connector_1 = require("@hybridshare/shared/types/connector");
class RestApiConnector extends base_connector_1.BaseConnector {
    id = 'rest-api';
    name = 'REST API';
    type = connector_1.ConnectorType.REST_API;
    category = connector_1.ConnectorCategory.CUSTOM;
    baseUrl = '';
    headers = {};
    listEndpoint = '';
    getEndpoint = '';
    searchEndpoint = '';
    async connect(credentials) {
        const { baseUrl, authType, token, username, password, apiKeyHeader, apiKeyValue } = credentials;
        this.baseUrl = baseUrl;
        if (authType === 'bearer' && token) {
            this.headers.Authorization = `Bearer ${token}`;
        }
        else if (authType === 'basic' && username && password) {
            this.headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
        }
        else if (authType === 'apikey' && apiKeyHeader && apiKeyValue) {
            this.headers[apiKeyHeader] = apiKeyValue;
        }
        const config = credentials.config;
        this.listEndpoint = config?.listEndpoint ?? '/';
        this.getEndpoint = config?.getEndpoint ?? '/{id}';
        this.searchEndpoint = config?.searchEndpoint ?? '/?q={query}';
        this.credentials = credentials;
        this.isConnected = true;
    }
    async disconnect() {
        this.headers = {};
        this.isConnected = false;
    }
    async testConnection() {
        const start = Date.now();
        try {
            await this.request('GET', this.listEndpoint);
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
    async listAssets(_path, options = {}) {
        const endpoint = this.listEndpoint + (options.cursor ? `?cursor=${options.cursor}` : '');
        const response = await this.withRetry(() => this.request('GET', endpoint));
        const items = Array.isArray(response) ? response : response.data ?? response;
        return (Array.isArray(items) ? items : []).map((item) => this.normalizeItem(item));
    }
    async getAsset(assetId) {
        const endpoint = this.getEndpoint.replace('{id}', encodeURIComponent(assetId));
        const response = await this.request('GET', endpoint);
        return this.normalizeItem(response);
    }
    async searchAssets(query) {
        const endpoint = this.searchEndpoint.replace('{query}', encodeURIComponent(query));
        const response = await this.request('GET', endpoint);
        const items = Array.isArray(response) ? response : response.data ?? response;
        return (Array.isArray(items) ? items : []).map((item) => this.normalizeItem(item));
    }
    async fetchContent(assetId) {
        const endpoint = this.getEndpoint.replace('{id}', encodeURIComponent(assetId));
        const response = await this.request('GET', endpoint);
        return Buffer.from(JSON.stringify(response, null, 2));
    }
    async pushContent(assetId, content) {
        const parsed = JSON.parse(content.toString());
        const endpoint = assetId === 'new'
            ? this.listEndpoint
            : this.getEndpoint.replace('{id}', encodeURIComponent(assetId));
        const method = assetId === 'new' ? 'POST' : 'PUT';
        await this.request(method, endpoint, parsed);
    }
    async deleteAsset(assetId) {
        const endpoint = this.getEndpoint.replace('{id}', encodeURIComponent(assetId));
        await this.request('DELETE', endpoint);
    }
    async getChanges(_since) {
        return [];
    }
    async request(method, endpoint, body) {
        const config = {
            method,
            url: `${this.baseUrl}${endpoint}`,
            headers: { 'Content-Type': 'application/json', ...this.headers },
            data: body,
            timeout: 30000,
        };
        const response = await axios_1.default.request(config);
        return response.data;
    }
    normalizeItem(item) {
        const id = String(item.id ?? item._id ?? item.uuid ?? Math.random());
        const name = String(item.name ?? item.title ?? item.label ?? id);
        return this.buildNormalizedAsset({
            id,
            name,
            type: 'record',
            path: `/${id}`,
            updatedAt: this.normalizeDate(item.updatedAt ?? item.updated_at ?? item.modified),
            createdAt: this.normalizeDate(item.createdAt ?? item.created_at ?? item.created),
            metadata: item,
        });
    }
}
exports.RestApiConnector = RestApiConnector;
//# sourceMappingURL=rest.connector.js.map