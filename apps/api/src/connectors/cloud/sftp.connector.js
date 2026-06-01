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
exports.SftpConnector = void 0;
const ssh2_sftp_client_1 = __importDefault(require("ssh2-sftp-client"));
const path_1 = __importDefault(require("path"));
const base_connector_1 = require("../base.connector");
const connector_1 = require("@hybridshare/shared/types/connector");
class SftpConnector extends base_connector_1.BaseConnector {
    id = 'sftp';
    name = 'SFTP';
    type = connector_1.ConnectorType.SFTP;
    category = connector_1.ConnectorCategory.CLOUD;
    client = null;
    remotePath = '/';
    async connect(credentials) {
        const { host, port, username, password, privateKey, remotePath } = credentials;
        this.client = new ssh2_sftp_client_1.default();
        this.remotePath = remotePath ?? '/';
        await this.client.connect({
            host,
            port: port ?? 22,
            username,
            ...(privateKey ? { privateKey } : { password }),
            readyTimeout: 10000,
        });
        this.credentials = credentials;
        this.isConnected = true;
    }
    async disconnect() {
        await this.client?.end();
        this.client = null;
        this.isConnected = false;
    }
    async testConnection() {
        const start = Date.now();
        try {
            if (!this.client)
                throw new Error('Not connected');
            await this.client.list(this.remotePath);
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
    async listAssets(listPath, options = {}) {
        if (!this.client)
            throw new Error('Not connected');
        const targetPath = listPath ?? this.remotePath;
        const items = await this.withRetry(() => this.client.list(targetPath));
        return items.map((item) => this.buildNormalizedAsset({
            id: path_1.default.join(targetPath, item.name),
            name: item.name,
            type: item.type === 'd' ? 'folder' : 'file',
            size: item.size,
            path: path_1.default.join(targetPath, item.name),
            updatedAt: new Date(item.modifyTime),
        }));
    }
    async getAsset(assetId) {
        if (!this.client)
            throw new Error('Not connected');
        const stat = await this.client.stat(assetId);
        return this.buildNormalizedAsset({
            id: assetId,
            name: path_1.default.basename(assetId),
            type: stat.isDirectory ? 'folder' : 'file',
            size: stat.size,
            path: assetId,
            updatedAt: new Date(stat.modifyTime),
        });
    }
    async searchAssets(query) {
        const all = await this.listAssets(this.remotePath);
        return all.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
    }
    async fetchContent(assetId) {
        if (!this.client)
            throw new Error('Not connected');
        const buffer = await this.client.get(assetId);
        return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    }
    async pushContent(assetId, content) {
        if (!this.client)
            throw new Error('Not connected');
        const { Readable } = await Promise.resolve().then(() => __importStar(require('stream')));
        await this.client.put(Readable.from(content), assetId);
    }
    async deleteAsset(assetId) {
        if (!this.client)
            throw new Error('Not connected');
        await this.client.delete(assetId);
    }
    async getChanges(since) {
        const all = await this.listAssets();
        return all
            .filter((a) => a.updatedAt && a.updatedAt > since)
            .map((a) => ({ externalId: a.id, changeType: 'updated', asset: a, changedAt: a.updatedAt }));
    }
}
exports.SftpConnector = SftpConnector;
//# sourceMappingURL=sftp.connector.js.map