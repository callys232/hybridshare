"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Connector = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const base_connector_1 = require("../base.connector");
const connector_1 = require("@hybridshare/shared/types/connector");
class S3Connector extends base_connector_1.BaseConnector {
    id = 's3';
    name = 'Amazon S3 / MinIO';
    type = connector_1.ConnectorType.S3;
    category = connector_1.ConnectorCategory.CLOUD;
    client = null;
    bucket = '';
    async connect(credentials) {
        const { accessKeyId, secretAccessKey, region, bucket, endpoint } = credentials;
        this.client = new client_s3_1.S3Client({
            region,
            credentials: { accessKeyId, secretAccessKey },
            ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
        });
        this.bucket = bucket;
        this.credentials = credentials;
        this.isConnected = true;
    }
    async disconnect() {
        this.client?.destroy();
        this.client = null;
        this.isConnected = false;
    }
    async testConnection() {
        const start = Date.now();
        try {
            if (!this.client)
                throw new Error('Not connected');
            await this.client.send(new client_s3_1.ListObjectsV2Command({ Bucket: this.bucket, MaxKeys: 1 }));
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
        if (!this.client)
            throw new Error('Not connected');
        const prefix = path ? (path.endsWith('/') ? path : `${path}/`) : '';
        const assets = [];
        let continuationToken;
        do {
            const response = await this.withRetry(() => this.client.send(new client_s3_1.ListObjectsV2Command({
                Bucket: this.bucket,
                Prefix: prefix,
                Delimiter: options.recursive ? undefined : '/',
                MaxKeys: options.limit ?? 100,
                ContinuationToken: continuationToken,
            })));
            for (const prefix of response.CommonPrefixes ?? []) {
                if (prefix.Prefix) {
                    assets.push(this.buildNormalizedAsset({
                        id: prefix.Prefix,
                        name: prefix.Prefix.split('/').filter(Boolean).pop() ?? prefix.Prefix,
                        type: 'folder',
                        path: prefix.Prefix,
                    }));
                }
            }
            for (const obj of response.Contents ?? []) {
                if (!obj.Key)
                    continue;
                const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: obj.Key }), { expiresIn: 3600 });
                assets.push(this.buildNormalizedAsset({
                    id: obj.Key,
                    name: obj.Key.split('/').pop() ?? obj.Key,
                    type: 'file',
                    size: obj.Size ?? null,
                    path: obj.Key,
                    url,
                    updatedAt: obj.LastModified ?? null,
                    metadata: { etag: obj.ETag, storageClass: obj.StorageClass },
                }));
            }
            continuationToken = response.NextContinuationToken;
        } while (continuationToken && assets.length < (options.limit ?? 100));
        return assets;
    }
    async getAsset(assetId) {
        if (!this.client)
            throw new Error('Not connected');
        const head = await this.client.send(new client_s3_1.HeadObjectCommand({ Bucket: this.bucket, Key: assetId }));
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: assetId }), { expiresIn: 3600 });
        return this.buildNormalizedAsset({
            id: assetId,
            name: assetId.split('/').pop() ?? assetId,
            type: 'file',
            mimeType: head.ContentType ?? null,
            size: head.ContentLength ?? null,
            path: assetId,
            url,
            updatedAt: head.LastModified ?? null,
            metadata: { etag: head.ETag },
        });
    }
    async searchAssets(query) {
        const all = await this.listAssets('', { recursive: true, limit: 1000 });
        return all.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
    }
    async fetchContent(assetId) {
        if (!this.client)
            throw new Error('Not connected');
        const response = await this.client.send(new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: assetId }));
        const stream = response.Body;
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    }
    async pushContent(assetId, content, metadata) {
        if (!this.client)
            throw new Error('Not connected');
        await this.client.send(new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: assetId,
            Body: content,
            ContentType: metadata?.mimeType ?? 'application/octet-stream',
        }));
    }
    async deleteAsset(assetId) {
        if (!this.client)
            throw new Error('Not connected');
        await this.client.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: assetId }));
    }
    async getChanges(since) {
        const all = await this.listAssets('', { recursive: true, limit: 500 });
        return all
            .filter((a) => a.updatedAt && a.updatedAt > since)
            .map((a) => ({ externalId: a.id, changeType: 'updated', asset: a, changedAt: a.updatedAt }));
    }
}
exports.S3Connector = S3Connector;
//# sourceMappingURL=s3.connector.js.map