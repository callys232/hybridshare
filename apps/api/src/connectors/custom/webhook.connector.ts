import express from 'express';
import { BaseConnector } from '../base.connector';
import {
  ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions,
} from '@hybridshare/shared/types/connector';
import { logger } from '../../utils/logger';

export class WebhookConnector extends BaseConnector {
  readonly id = 'webhook';
  readonly name = 'Webhook';
  readonly type = ConnectorType.WEBHOOK;
  readonly category = ConnectorCategory.CUSTOM;

  private receivedAssets: NormalizedAsset[] = [];
  private secretToken = '';

  async connect(credentials: Record<string, unknown>): Promise<void> {
    this.secretToken = (credentials.secretToken as string) ?? '';
    this.credentials = credentials;
    this.isConnected = true;
    logger.info('Webhook connector ready', { connectorId: this.id });
  }

  async disconnect(): Promise<void> {
    this.receivedAssets = [];
    this.isConnected = false;
  }

  async testConnection(): Promise<HealthStatus> {
    return { healthy: true, latencyMs: 0, message: 'Webhook connector is always available', checkedAt: new Date() };
  }

  async listAssets(_path?: string, options: ListOptions = {}): Promise<NormalizedAsset[]> {
    return this.receivedAssets.slice(0, options.limit ?? 100);
  }

  async getAsset(assetId: string): Promise<NormalizedAsset> {
    const asset = this.receivedAssets.find((a) => a.id === assetId);
    if (!asset) throw Object.assign(new Error('Asset not found'), { statusCode: 404 });
    return asset;
  }

  async searchAssets(query: string): Promise<NormalizedAsset[]> {
    return this.receivedAssets.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
  }

  async fetchContent(assetId: string): Promise<Buffer> {
    const asset = await this.getAsset(assetId);
    return Buffer.from(JSON.stringify(asset.metadata, null, 2));
  }

  async pushContent(_assetId: string, _content: Buffer): Promise<void> {
    throw new Error('Webhook connector does not support push operations');
  }

  async deleteAsset(assetId: string): Promise<void> {
    this.receivedAssets = this.receivedAssets.filter((a) => a.id !== assetId);
  }

  async getChanges(since: Date): Promise<AssetChange[]> {
    return this.receivedAssets
      .filter((a) => a.fetchedAt > since)
      .map((a) => ({ externalId: a.id, changeType: 'created' as const, asset: a, changedAt: a.fetchedAt }));
  }

  receiveWebhookPayload(payload: Record<string, unknown>, connectorId: string): NormalizedAsset {
    const id = String(payload.id ?? `wh-${Date.now()}`);
    const name = String(payload.name ?? payload.title ?? payload.event ?? id);
    const asset = this.buildNormalizedAsset({
      id, name, type: 'record', path: `/${id}`,
      metadata: payload,
      createdAt: new Date(),
    });
    this.receivedAssets.unshift(asset);
    if (this.receivedAssets.length > 1000) this.receivedAssets = this.receivedAssets.slice(0, 1000);
    return asset;
  }

  validateSignature(signature: string, body: string): boolean {
    if (!this.secretToken) return true;
    const crypto = require('crypto');
    const expected = crypto.createHmac('sha256', this.secretToken).update(body).digest('hex');
    return signature === `sha256=${expected}`;
  }
}
