"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OneDriveConnector = void 0;
const axios_1 = __importDefault(require("axios"));
const base_connector_1 = require("../base.connector");
const connector_1 = require("@hybridshare/shared/types/connector");
class OneDriveConnector extends base_connector_1.BaseConnector {
    id = 'onedrive';
    name = 'OneDrive';
    type = connector_1.ConnectorType.ONEDRIVE;
    category = connector_1.ConnectorCategory.CLOUD;
    accessToken = '';
    BASE = 'https://graph.microsoft.com/v1.0';
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
            await this.get('/me/drive');
            return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
        }
        catch (err) {
            return { healthy: false, latencyMs: Date.now() - start, message: err.message, checkedAt: new Date() };
        }
    }
    async listAssets(path = 'root', options = {}) {
        const endpoint = path === 'root'
            ? '/me/drive/root/children'
            : `/me/drive/items/${path}/children`;
        const response = await this.withRetry(() => this.get(`${endpoint}?$top=${options.limit ?? 100}`));
        return response.value.map((item) => this.normalizeItem(item));
    }
    async getAsset(assetId) {
        const item = await this.get(`/me/drive/items/${assetId}`);
        return this.normalizeItem(item);
    }
    async searchAssets(query) {
        const response = await this.withRetry(() => this.get(`/me/drive/root/search(q='${encodeURIComponent(query)}')`));
        return response.value.map((item) => this.normalizeItem(item));
    }
    async fetchContent(assetId) {
        const response = await axios_1.default.get(`${this.BASE}/me/drive/items/${assetId}/content`, { headers: { Authorization: `Bearer ${this.accessToken}` }, responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    }
    async pushContent(assetId, content, metadata) {
        await axios_1.default.put(`${this.BASE}/me/drive/items/${assetId}/content`, content, {
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': metadata?.mimeType ?? 'application/octet-stream',
            },
        });
    }
    async deleteAsset(assetId) {
        await axios_1.default.delete(`${this.BASE}/me/drive/items/${assetId}`, {
            headers: { Authorization: `Bearer ${this.accessToken}` },
        });
    }
    async getChanges(since) {
        const response = await this.withRetry(() => this.get(`/me/drive/root/delta?$filter=lastModifiedDateTime gt '${since.toISOString()}'`));
        return response.value.map((item) => ({
            externalId: item.id,
            changeType: 'updated',
            asset: this.normalizeItem(item),
            changedAt: new Date(item.lastModifiedDateTime ?? Date.now()),
        }));
    }
    async get(endpoint) {
        const response = await axios_1.default.get(`${this.BASE}${endpoint}`, {
            headers: { Authorization: `Bearer ${this.accessToken}` },
            timeout: 15000,
        });
        return response.data;
    }
    normalizeItem(item) {
        return this.buildNormalizedAsset({
            id: item.id,
            name: item.name,
            type: item.folder ? 'folder' : 'file',
            mimeType: item.file?.mimeType ?? null,
            size: item.size ?? null,
            path: item.id,
            url: item.webUrl ?? null,
            thumbnailUrl: item.thumbnails?.[0]?.medium?.url ?? null,
            createdAt: this.normalizeDate(item.createdDateTime),
            updatedAt: this.normalizeDate(item.lastModifiedDateTime),
        });
    }
}
exports.OneDriveConnector = OneDriveConnector;
//# sourceMappingURL=onedrive.connector.js.map