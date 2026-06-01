import SftpClient from 'ssh2-sftp-client';
import path from 'path';
import { BaseConnector } from '../base.connector';
import {
  ConnectorType,
  ConnectorCategory,
  HealthStatus,
  NormalizedAsset,
  AssetChange,
  ListOptions,
} from '@hybridshare/shared/types/connector';

export class SftpConnector extends BaseConnector {
  readonly id = 'sftp';
  readonly name = 'SFTP';
  readonly type = ConnectorType.SFTP;
  readonly category = ConnectorCategory.CLOUD;

  private client: SftpClient | null = null;
  private remotePath = '/';

  async connect(credentials: Record<string, unknown>): Promise<void> {
    const { host, port, username, password, privateKey, remotePath } = credentials as {
      host: string;
      port: number;
      username: string;
      password?: string;
      privateKey?: string;
      remotePath?: string;
    };

    this.client = new SftpClient();
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

  async disconnect(): Promise<void> {
    await this.client?.end();
    this.client = null;
    this.isConnected = false;
  }

  async testConnection(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      if (!this.client) throw new Error('Not connected');
      await this.client.list(this.remotePath);
      return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : 'Failed',
        checkedAt: new Date(),
      };
    }
  }

  async listAssets(listPath?: string, options: ListOptions = {}): Promise<NormalizedAsset[]> {
    if (!this.client) throw new Error('Not connected');
    const targetPath = listPath ?? this.remotePath;
    const items = await this.withRetry(() => this.client!.list(targetPath));

    return items.map((item) =>
      this.buildNormalizedAsset({
        id: path.join(targetPath, item.name),
        name: item.name,
        type: item.type === 'd' ? 'folder' : 'file',
        size: item.size,
        path: path.join(targetPath, item.name),
        updatedAt: new Date(item.modifyTime),
      })
    );
  }

  async getAsset(assetId: string): Promise<NormalizedAsset> {
    if (!this.client) throw new Error('Not connected');
    const stat = await this.client.stat(assetId);

    return this.buildNormalizedAsset({
      id: assetId,
      name: path.basename(assetId),
      type: stat.isDirectory ? 'folder' : 'file',
      size: stat.size,
      path: assetId,
      updatedAt: new Date(stat.modifyTime),
    });
  }

  async searchAssets(query: string): Promise<NormalizedAsset[]> {
    const all = await this.listAssets(this.remotePath);
    return all.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
  }

  async fetchContent(assetId: string): Promise<Buffer> {
    if (!this.client) throw new Error('Not connected');
    const buffer = await this.client.get(assetId);
    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as unknown as string);
  }

  async pushContent(assetId: string, content: Buffer): Promise<void> {
    if (!this.client) throw new Error('Not connected');
    const { Readable } = await import('stream');
    await this.client.put(Readable.from(content), assetId);
  }

  async deleteAsset(assetId: string): Promise<void> {
    if (!this.client) throw new Error('Not connected');
    await this.client.delete(assetId);
  }

  async getChanges(since: Date): Promise<AssetChange[]> {
    const all = await this.listAssets();
    return all
      .filter((a) => a.updatedAt && a.updatedAt > since)
      .map((a) => ({ externalId: a.id, changeType: 'updated' as const, asset: a, changedAt: a.updatedAt! }));
  }
}
