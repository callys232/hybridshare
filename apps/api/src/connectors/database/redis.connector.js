"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisConnector = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const base_connector_1 = require("../base.connector");
const connector_1 = require("@hybridshare/shared/types/connector");
class RedisConnector extends base_connector_1.BaseConnector {
    id = 'redis-db';
    name = 'Redis';
    type = connector_1.ConnectorType.REDIS_DB;
    category = connector_1.ConnectorCategory.DATABASE;
    client = null;
    async connect(credentials) {
        const { host, port, password } = credentials;
        this.client = new ioredis_1.default({ host, port: port ?? 6379, password, lazyConnect: true, connectTimeout: 8000 });
        await this.client.connect();
        this.credentials = credentials;
        this.isConnected = true;
    }
    async disconnect() {
        await this.client?.quit();
        this.client = null;
        this.isConnected = false;
    }
    async testConnection() {
        const start = Date.now();
        try {
            const pong = await this.client.ping();
            return { healthy: pong === 'PONG', latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
        }
        catch (err) {
            return { healthy: false, latencyMs: Date.now() - start, message: err.message, checkedAt: new Date() };
        }
    }
    async listAssets(_path, options = {}) {
        if (!this.client)
            throw new Error('Not connected');
        const pattern = options.filter?.pattern ?? '*';
        const keys = await this.client.keys(pattern);
        const limited = keys.slice(0, options.limit ?? 200);
        const pipeline = this.client.pipeline();
        limited.forEach((k) => pipeline.type(k));
        const types = await pipeline.exec();
        return limited.map((key, i) => {
            const type = types?.[i]?.[1] ?? 'unknown';
            return this.buildNormalizedAsset({
                id: key, name: key, type: 'other', path: `/${key}`,
                metadata: { redisType: type },
            });
        });
    }
    async getAsset(assetId) {
        if (!this.client)
            throw new Error('Not connected');
        const [type, ttl] = await Promise.all([this.client.type(assetId), this.client.ttl(assetId)]);
        return this.buildNormalizedAsset({
            id: assetId, name: assetId, type: 'other', path: `/${assetId}`,
            metadata: { redisType: type, ttl },
        });
    }
    async searchAssets(query) {
        return this.listAssets(undefined, { filter: { pattern: `*${query}*` } });
    }
    async fetchContent(assetId) {
        if (!this.client)
            throw new Error('Not connected');
        const type = await this.client.type(assetId);
        let value;
        switch (type) {
            case 'string':
                value = await this.client.get(assetId);
                break;
            case 'hash':
                value = await this.client.hgetall(assetId);
                break;
            case 'list':
                value = await this.client.lrange(assetId, 0, -1);
                break;
            case 'set':
                value = await this.client.smembers(assetId);
                break;
            case 'zset':
                value = await this.client.zrange(assetId, 0, -1, 'WITHSCORES');
                break;
            default: value = null;
        }
        return Buffer.from(JSON.stringify({ key: assetId, type, value }, null, 2));
    }
    async pushContent(assetId, content) {
        if (!this.client)
            throw new Error('Not connected');
        const { value } = JSON.parse(content.toString());
        await this.client.set(assetId, value);
    }
    async deleteAsset(assetId) {
        if (!this.client)
            throw new Error('Not connected');
        await this.client.del(assetId);
    }
    async getChanges(_since) {
        return [];
    }
}
exports.RedisConnector = RedisConnector;
//# sourceMappingURL=redis.connector.js.map