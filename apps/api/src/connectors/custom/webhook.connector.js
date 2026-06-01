"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookConnector = void 0;
const base_connector_1 = require("../base.connector");
const connector_1 = require("@hybridshare/shared/types/connector");
const logger_1 = require("../../utils/logger");
class WebhookConnector extends base_connector_1.BaseConnector {
    id = 'webhook';
    name = 'Webhook';
    type = connector_1.ConnectorType.WEBHOOK;
    category = connector_1.ConnectorCategory.CUSTOM;
    receivedAssets = [];
    secretToken = '';
    async connect(credentials) {
        this.secretToken = credentials.secretToken ?? '';
        this.credentials = credentials;
        this.isConnected = true;
        logger_1.logger.info('Webhook connector ready', { connectorId: this.id });
    }
    async disconnect() {
        this.receivedAssets = [];
        this.isConnected = false;
    }
    async testConnection() {
        return { healthy: true, latencyMs: 0, message: 'Webhook connector is always available', checkedAt: new Date() };
    }
    async listAssets(_path, options = {}) {
        return this.receivedAssets.slice(0, options.limit ?? 100);
    }
    async getAsset(assetId) {
        const asset = this.receivedAssets.find((a) => a.id === assetId);
        if (!asset)
            throw Object.assign(new Error('Asset not found'), { statusCode: 404 });
        return asset;
    }
    async searchAssets(query) {
        return this.receivedAssets.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
    }
    async fetchContent(assetId) {
        const asset = await this.getAsset(assetId);
        return Buffer.from(JSON.stringify(asset.metadata, null, 2));
    }
    async pushContent(_assetId, _content) {
        throw new Error('Webhook connector does not support push operations');
    }
    async deleteAsset(assetId) {
        this.receivedAssets = this.receivedAssets.filter((a) => a.id !== assetId);
    }
    async getChanges(since) {
        return this.receivedAssets
            .filter((a) => a.fetchedAt > since)
            .map((a) => ({ externalId: a.id, changeType: 'created', asset: a, changedAt: a.fetchedAt }));
    }
    receiveWebhookPayload(payload, connectorId) {
        const id = String(payload.id ?? `wh-${Date.now()}`);
        const name = String(payload.name ?? payload.title ?? payload.event ?? id);
        const asset = this.buildNormalizedAsset({
            id, name, type: 'record', path: `/${id}`,
            metadata: payload,
            createdAt: new Date(),
        });
        this.receivedAssets.unshift(asset);
        if (this.receivedAssets.length > 1000)
            this.receivedAssets = this.receivedAssets.slice(0, 1000);
        return asset;
    }
    validateSignature(signature, body) {
        if (!this.secretToken)
            return true;
        const crypto = require('crypto');
        const expected = crypto.createHmac('sha256', this.secretToken).update(body).digest('hex');
        return signature === `sha256=${expected}`;
    }
}
exports.WebhookConnector = WebhookConnector;
//# sourceMappingURL=webhook.connector.js.map