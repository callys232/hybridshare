"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBConnector = void 0;
const mongodb_1 = require("mongodb");
const base_connector_1 = require("../base.connector");
const connector_1 = require("@hybridshare/shared/types/connector");
class MongoDBConnector extends base_connector_1.BaseConnector {
    id = 'mongodb';
    name = 'MongoDB';
    type = connector_1.ConnectorType.MONGODB;
    category = connector_1.ConnectorCategory.DATABASE;
    client = null;
    db = null;
    dbName = '';
    async connect(credentials) {
        const { connectionString, database } = credentials;
        this.client = new mongodb_1.MongoClient(connectionString, { serverSelectionTimeoutMS: 10000 });
        await this.client.connect();
        this.db = this.client.db(database);
        this.dbName = database;
        this.credentials = credentials;
        this.isConnected = true;
    }
    async disconnect() {
        await this.client?.close();
        this.client = null;
        this.db = null;
        this.isConnected = false;
    }
    async testConnection() {
        const start = Date.now();
        try {
            if (!this.db)
                throw new Error('Not connected');
            await this.db.admin().ping();
            return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
        }
        catch (err) {
            return { healthy: false, latencyMs: Date.now() - start, message: err.message, checkedAt: new Date() };
        }
    }
    async listAssets(_path, _options = {}) {
        if (!this.db)
            throw new Error('Not connected');
        const collections = await this.db.listCollections().toArray();
        return collections.map((c) => this.buildNormalizedAsset({
            id: `${this.dbName}.${c.name}`,
            name: c.name,
            type: 'record',
            path: `/${c.name}`,
            metadata: { type: c.type, options: c.options },
        }));
    }
    async getAsset(assetId) {
        if (!this.db)
            throw new Error('Not connected');
        const collectionName = assetId.split('.').pop() ?? assetId;
        const count = await this.db.collection(collectionName).estimatedDocumentCount();
        const sample = await this.db.collection(collectionName).findOne({});
        return this.buildNormalizedAsset({
            id: assetId,
            name: collectionName,
            type: 'record',
            path: `/${collectionName}`,
            metadata: { documentCount: count, sampleFields: sample ? Object.keys(sample) : [] },
        });
    }
    async searchAssets(query) {
        const all = await this.listAssets();
        return all.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
    }
    async fetchContent(assetId) {
        if (!this.db)
            throw new Error('Not connected');
        const collectionName = assetId.split('.').pop() ?? assetId;
        const docs = await this.db.collection(collectionName).find({}).limit(1000).toArray();
        return Buffer.from(JSON.stringify(docs, null, 2));
    }
    async pushContent(assetId, content) {
        if (!this.db)
            throw new Error('Not connected');
        const collectionName = assetId.split('.').pop() ?? assetId;
        const docs = JSON.parse(content.toString());
        if (Array.isArray(docs) && docs.length > 0) {
            await this.db.collection(collectionName).insertMany(docs, { ordered: false });
        }
    }
    async deleteAsset(assetId) {
        if (!this.db)
            throw new Error('Not connected');
        const collectionName = assetId.split('.').pop() ?? assetId;
        await this.db.collection(collectionName).drop();
    }
    async getChanges(_since) {
        return [];
    }
}
exports.MongoDBConnector = MongoDBConnector;
//# sourceMappingURL=mongodb.connector.js.map