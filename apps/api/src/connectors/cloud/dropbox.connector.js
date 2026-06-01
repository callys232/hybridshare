"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropboxConnector = void 0;
const axios_1 = __importDefault(require("axios"));
const base_connector_1 = require("../base.connector");
const connector_1 = require("@hybridshare/shared/types/connector");
class DropboxConnector extends base_connector_1.BaseConnector {
    id = 'dropbox';
    name = 'Dropbox';
    type = connector_1.ConnectorType.DROPBOX;
    category = connector_1.ConnectorCategory.CLOUD;
    accessToken = '';
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
            await this.api('users/get_current_account', {});
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
    async listAssets(path = '', options = {}) {
        const body = path
            ? { path, recursive: options.recursive ?? false, limit: options.limit ?? 100 }
            : { path: '', recursive: options.recursive ?? false, limit: options.limit ?? 100 };
        const response = await this.withRetry(() => this.api('files/list_folder', body));
        return response.entries.map((entry) => this.normalizeEntry(entry));
    }
    async getAsset(assetId) {
        const response = await this.api('files/get_metadata', { path: assetId });
        return this.normalizeEntry(response);
    }
    async searchAssets(query) {
        const response = await this.withRetry(() => this.api('files/search_v2', { query, options: { max_results: 50 } }));
        return response.matches.map((m) => this.normalizeEntry(m.metadata));
    }
    async fetchContent(assetId) {
        const response = await axios_1.default.post('https://content.dropboxapi.com/2/files/download', null, {
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Dropbox-API-Arg': JSON.stringify({ path: assetId }),
            },
            responseType: 'arraybuffer',
        });
        return Buffer.from(response.data);
    }
    async pushContent(assetId, content, metadata) {
        await axios_1.default.post('https://content.dropboxapi.com/2/files/upload', content, {
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': 'application/octet-stream',
                'Dropbox-API-Arg': JSON.stringify({
                    path: assetId,
                    mode: 'overwrite',
                    autorename: true,
                }),
            },
        });
    }
    async deleteAsset(assetId) {
        await this.api('files/delete_v2', { path: assetId });
    }
    async getChanges(since) {
        const response = await this.withRetry(() => this.api('files/list_folder', { path: '', recursive: true, limit: 200 }));
        return response.entries
            .filter((e) => {
            const modified = e.server_modified;
            return modified && new Date(modified) > since;
        })
            .map((e) => ({
            externalId: e.id,
            changeType: 'updated',
            asset: this.normalizeEntry(e),
            changedAt: new Date(e.server_modified),
        }));
    }
    async api(endpoint, body) {
        const response = await axios_1.default.post(`https://api.dropboxapi.com/2/${endpoint}`, body, { headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' } });
        return response.data;
    }
    normalizeEntry(entry) {
        const isFolder = entry['.tag'] === 'folder';
        return this.buildNormalizedAsset({
            id: entry.id || entry.path_lower,
            name: entry.name,
            type: isFolder ? 'folder' : 'file',
            size: entry.size,
            path: entry.path_lower,
            updatedAt: this.normalizeDate(entry.server_modified),
            createdAt: this.normalizeDate(entry.client_modified),
            metadata: { rev: entry.rev, content_hash: entry.content_hash },
        });
    }
}
exports.DropboxConnector = DropboxConnector;
//# sourceMappingURL=dropbox.connector.js.map