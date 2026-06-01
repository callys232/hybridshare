"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLConnector = void 0;
const axios_1 = __importDefault(require("axios"));
const base_connector_1 = require("../base.connector");
const connector_1 = require("@hybridshare/shared/types/connector");
class GraphQLConnector extends base_connector_1.BaseConnector {
    id = 'graphql';
    name = 'GraphQL';
    type = connector_1.ConnectorType.GRAPHQL;
    category = connector_1.ConnectorCategory.CUSTOM;
    endpoint = '';
    headers = {};
    listQuery = '';
    getQuery = '';
    searchQuery = '';
    async connect(credentials) {
        const { endpoint, authType, token, headers } = credentials;
        this.endpoint = endpoint;
        if (authType === 'bearer' && token)
            this.headers.Authorization = `Bearer ${token}`;
        if (authType === 'apikey' && token)
            this.headers['X-API-Key'] = token;
        if (headers)
            Object.assign(this.headers, headers);
        const config = credentials.config;
        this.listQuery = config?.listQuery ?? '{ items { id name } }';
        this.getQuery = config?.getQuery ?? '{ item(id: $id) { id name } }';
        this.searchQuery = config?.searchQuery ?? '{ search(query: $q) { id name } }';
        this.credentials = credentials;
        this.isConnected = true;
    }
    async disconnect() {
        this.endpoint = '';
        this.isConnected = false;
    }
    async testConnection() {
        const start = Date.now();
        try {
            await this.query('{ __typename }');
            return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
        }
        catch (err) {
            return { healthy: false, latencyMs: Date.now() - start, message: err.message, checkedAt: new Date() };
        }
    }
    async listAssets(_path, options = {}) {
        const response = await this.withRetry(() => this.query(this.listQuery));
        const items = Object.values(response).flat();
        return items.slice(0, options.limit ?? 100).map((item) => this.normalizeItem(item));
    }
    async getAsset(assetId) {
        const response = await this.query(this.getQuery.replace('$id', JSON.stringify(assetId)));
        const item = Object.values(response)[0];
        return this.normalizeItem(item);
    }
    async searchAssets(q) {
        const response = await this.withRetry(() => this.query(this.searchQuery.replace('$q', JSON.stringify(q))));
        const items = (Object.values(response)[0] ?? []);
        return items.map((item) => this.normalizeItem(item));
    }
    async fetchContent(assetId) {
        const asset = await this.getAsset(assetId);
        return Buffer.from(JSON.stringify(asset.metadata, null, 2));
    }
    async pushContent(_assetId, _content) {
        throw new Error('GraphQL mutations not configured — add mutationQuery to config');
    }
    async deleteAsset(_assetId) {
        throw new Error('GraphQL delete mutations not configured');
    }
    async getChanges(_since) {
        return [];
    }
    async query(queryStr, variables) {
        const response = await axios_1.default.post(this.endpoint, { query: queryStr, variables }, { headers: { 'Content-Type': 'application/json', ...this.headers }, timeout: 20000 });
        if (response.data.errors?.length)
            throw new Error(response.data.errors[0].message);
        return response.data.data;
    }
    normalizeItem(item) {
        const id = String(item.id ?? item._id ?? Math.random());
        const name = String(item.name ?? item.title ?? item.label ?? id);
        return this.buildNormalizedAsset({
            id, name, type: 'record', path: `/${id}`, metadata: item,
        });
    }
}
exports.GraphQLConnector = GraphQLConnector;
//# sourceMappingURL=graphql.connector.js.map