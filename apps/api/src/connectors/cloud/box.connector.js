"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoxConnector = void 0;
const axios_1 = __importDefault(require("axios"));
const base_connector_1 = require("../base.connector");
const connector_1 = require("@hybridshare/shared/types/connector");
class BoxConnector extends base_connector_1.BaseConnector {
    id = 'box';
    name = 'Box';
    type = connector_1.ConnectorType.BOX;
    category = connector_1.ConnectorCategory.CLOUD;
    accessToken = '';
    BASE = 'https://api.box.com/2.0';
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
            await this.get('/users/me');
            return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
        }
        catch (err) {
            return { healthy: false, latencyMs: Date.now() - start, message: err.message, checkedAt: new Date() };
        }
    }
    async listAssets(folderId = '0', options = {}) {
        const response = await this.withRetry(() => this.get(`/folders/${folderId}/items?limit=${options.limit ?? 100}`));
        return response.entries.map((e) => this.normalizeEntry(e));
    }
    async getAsset(assetId) {
        const item = await this.get(`/files/${assetId}`);
        return this.normalizeEntry(item);
    }
    async searchAssets(query) {
        const response = await this.withRetry(() => this.get(`/search?query=${encodeURIComponent(query)}&limit=50`));
        return response.entries.map((e) => this.normalizeEntry(e));
    }
    async fetchContent(assetId) {
        const response = await axios_1.default.get(`${this.BASE}/files/${assetId}/content`, {
            headers: { Authorization: `Bearer ${this.accessToken}` },
            responseType: 'arraybuffer',
        });
        return Buffer.from(response.data);
    }
    async pushContent(assetId, content) {
        const FormData = (await Promise.resolve().then(() => __importStar(require('form-data')))).default;
        const form = new FormData();
        form.append('file', content, { filename: assetId });
        await axios_1.default.post(`https://upload.box.com/api/2.0/files/${assetId}/content`, form, {
            headers: { Authorization: `Bearer ${this.accessToken}`, ...form.getHeaders() },
        });
    }
    async deleteAsset(assetId) {
        await axios_1.default.delete(`${this.BASE}/files/${assetId}`, {
            headers: { Authorization: `Bearer ${this.accessToken}` },
        });
    }
    async getChanges(_since) {
        return [];
    }
    async get(path) {
        const response = await axios_1.default.get(`${this.BASE}${path}`, {
            headers: { Authorization: `Bearer ${this.accessToken}` },
            timeout: 15000,
        });
        return response.data;
    }
    normalizeEntry(e) {
        return this.buildNormalizedAsset({
            id: e.id,
            name: e.name,
            type: e.type === 'folder' ? 'folder' : 'file',
            size: e.size,
            path: `/${e.name}`,
            updatedAt: this.normalizeDate(e.modified_at),
            createdAt: this.normalizeDate(e.created_at),
            metadata: { etag: e.etag, sha1: e.sha1 },
        });
    }
}
exports.BoxConnector = BoxConnector;
//# sourceMappingURL=box.connector.js.map