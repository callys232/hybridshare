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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleDriveConnector = void 0;
const googleapis_1 = require("googleapis");
const base_connector_1 = require("../base.connector");
const connector_1 = require("@hybridshare/shared/types/connector");
const logger_1 = require("../../utils/logger");
class GoogleDriveConnector extends base_connector_1.BaseConnector {
    id = 'google-drive';
    name = 'Google Drive';
    type = connector_1.ConnectorType.GOOGLE_DRIVE;
    category = connector_1.ConnectorCategory.CLOUD;
    drive = null;
    async connect(credentials) {
        const { accessToken, refreshToken, clientId, clientSecret } = credentials;
        const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
        this.drive = googleapis_1.google.drive({ version: 'v3', auth: oauth2Client });
        this.credentials = credentials;
        this.isConnected = true;
        logger_1.logger.info('Google Drive connector connected', { connectorId: this.id });
    }
    async disconnect() {
        this.drive = null;
        this.isConnected = false;
    }
    async testConnection() {
        const start = Date.now();
        try {
            if (!this.drive)
                throw new Error('Not connected');
            await this.drive.about.get({ fields: 'user,storageQuota' });
            return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
        }
        catch (err) {
            return {
                healthy: false,
                latencyMs: Date.now() - start,
                message: err instanceof Error ? err.message : 'Connection failed',
                checkedAt: new Date(),
            };
        }
    }
    async listAssets(path = 'root', options = {}) {
        if (!this.drive)
            throw new Error('Not connected');
        const folderId = path === 'root' ? 'root' : path;
        const query = `'${folderId}' in parents and trashed = false`;
        const response = await this.withRetry(() => this.drive.files.list({
            q: query,
            pageSize: options.limit ?? 100,
            fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,thumbnailLink,webViewLink,parents)',
            pageToken: options.cursor,
        }));
        return (response.data.files ?? []).map((f) => this.normalizeFile(f));
    }
    async getAsset(assetId) {
        if (!this.drive)
            throw new Error('Not connected');
        const response = await this.drive.files.get({
            fileId: assetId,
            fields: 'id,name,mimeType,size,createdTime,modifiedTime,thumbnailLink,webViewLink,parents,description',
        });
        return this.normalizeFile(response.data);
    }
    async searchAssets(query) {
        if (!this.drive)
            throw new Error('Not connected');
        const response = await this.withRetry(() => this.drive.files.list({
            q: `name contains '${query.replace(/'/g, "\\'")}' and trashed = false`,
            pageSize: 50,
            fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,thumbnailLink,webViewLink)',
        }));
        return (response.data.files ?? []).map((f) => this.normalizeFile(f));
    }
    async fetchContent(assetId) {
        if (!this.drive)
            throw new Error('Not connected');
        const response = await this.drive.files.get({ fileId: assetId, alt: 'media' }, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    }
    async pushContent(assetId, content, metadata) {
        if (!this.drive)
            throw new Error('Not connected');
        const { Readable } = await Promise.resolve().then(() => __importStar(require('stream')));
        const stream = Readable.from(content);
        if (assetId.startsWith('new:')) {
            const parentId = assetId.replace('new:', '');
            await this.drive.files.create({
                requestBody: {
                    name: metadata?.name ?? 'Untitled',
                    parents: [parentId],
                },
                media: { mimeType: metadata?.mimeType ?? 'application/octet-stream', body: stream },
            });
        }
        else {
            await this.drive.files.update({
                fileId: assetId,
                media: { body: stream },
            });
        }
    }
    async deleteAsset(assetId) {
        if (!this.drive)
            throw new Error('Not connected');
        await this.drive.files.delete({ fileId: assetId });
    }
    async getChanges(since) {
        if (!this.drive)
            throw new Error('Not connected');
        const response = await this.drive.files.list({
            q: `modifiedTime > '${since.toISOString()}' and trashed = false`,
            fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,thumbnailLink)',
            pageSize: 200,
        });
        return (response.data.files ?? []).map((f) => ({
            externalId: f.id,
            changeType: 'updated',
            asset: this.normalizeFile(f),
            changedAt: new Date(f.modifiedTime ?? Date.now()),
        }));
    }
    normalizeFile(file) {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        return this.buildNormalizedAsset({
            id: file.id,
            name: file.name ?? 'Untitled',
            type: isFolder ? 'folder' : 'file',
            mimeType: file.mimeType ?? null,
            size: file.size ? parseInt(file.size) : null,
            path: file.id ?? '/',
            url: file.webViewLink ?? null,
            thumbnailUrl: file.thumbnailLink ?? null,
            createdAt: this.normalizeDate(file.createdTime),
            updatedAt: this.normalizeDate(file.modifiedTime),
        });
    }
}
exports.GoogleDriveConnector = GoogleDriveConnector;
//# sourceMappingURL=googledrive.connector.js.map