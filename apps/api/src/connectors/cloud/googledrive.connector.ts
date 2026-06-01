import { google, drive_v3 } from 'googleapis';
import { BaseConnector } from '../base.connector';
import { ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions } from '@hybridshare/shared/types/connector';
import { logger } from '../../utils/logger';

export class GoogleDriveConnector extends BaseConnector {
  readonly id = 'google-drive';
  readonly name = 'Google Drive';
  readonly type = ConnectorType.GOOGLE_DRIVE;
  readonly category = ConnectorCategory.CLOUD;

  private drive: drive_v3.Drive | null = null;

  async connect(credentials: Record<string, unknown>): Promise<void> {
    const { accessToken, refreshToken, clientId, clientSecret } = credentials as {
      accessToken: string;
      refreshToken: string;
      clientId?: string;
      clientSecret?: string;
    };

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

    this.drive = google.drive({ version: 'v3', auth: oauth2Client });
    this.credentials = credentials;
    this.isConnected = true;
    logger.info('Google Drive connector connected', { connectorId: this.id });
  }

  async disconnect(): Promise<void> {
    this.drive = null;
    this.isConnected = false;
  }

  async testConnection(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      if (!this.drive) throw new Error('Not connected');
      await this.drive.about.get({ fields: 'user,storageQuota' });
      return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : 'Connection failed',
        checkedAt: new Date(),
      };
    }
  }

  async listAssets(path = 'root', options: ListOptions = {}): Promise<NormalizedAsset[]> {
    if (!this.drive) throw new Error('Not connected');

    const folderId = path === 'root' ? 'root' : path;
    const query = `'${folderId}' in parents and trashed = false`;

    const response = await this.withRetry(() =>
      this.drive!.files.list({
        q: query,
        pageSize: options.limit ?? 100,
        fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,thumbnailLink,webViewLink,parents)',
        pageToken: options.cursor,
      })
    );

    return (response.data.files ?? []).map((f) => this.normalizeFile(f));
  }

  async getAsset(assetId: string): Promise<NormalizedAsset> {
    if (!this.drive) throw new Error('Not connected');

    const response = await this.drive.files.get({
      fileId: assetId,
      fields: 'id,name,mimeType,size,createdTime,modifiedTime,thumbnailLink,webViewLink,parents,description',
    });

    return this.normalizeFile(response.data);
  }

  async searchAssets(query: string): Promise<NormalizedAsset[]> {
    if (!this.drive) throw new Error('Not connected');

    const response = await this.withRetry(() =>
      this.drive!.files.list({
        q: `name contains '${query.replace(/'/g, "\\'")}' and trashed = false`,
        pageSize: 50,
        fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,thumbnailLink,webViewLink)',
      })
    );

    return (response.data.files ?? []).map((f) => this.normalizeFile(f));
  }

  async fetchContent(assetId: string): Promise<Buffer> {
    if (!this.drive) throw new Error('Not connected');

    const response = await this.drive.files.get(
      { fileId: assetId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    return Buffer.from(response.data as ArrayBuffer);
  }

  async pushContent(assetId: string, content: Buffer, metadata?: Record<string, unknown>): Promise<void> {
    if (!this.drive) throw new Error('Not connected');

    const { Readable } = await import('stream');
    const stream = Readable.from(content);

    if (assetId.startsWith('new:')) {
      const parentId = assetId.replace('new:', '');
      await this.drive.files.create({
        requestBody: {
          name: (metadata?.name as string) ?? 'Untitled',
          parents: [parentId],
        },
        media: { mimeType: (metadata?.mimeType as string) ?? 'application/octet-stream', body: stream },
      });
    } else {
      await this.drive.files.update({
        fileId: assetId,
        media: { body: stream },
      });
    }
  }

  async deleteAsset(assetId: string): Promise<void> {
    if (!this.drive) throw new Error('Not connected');
    await this.drive.files.delete({ fileId: assetId });
  }

  async getChanges(since: Date): Promise<AssetChange[]> {
    if (!this.drive) throw new Error('Not connected');

    const response = await this.drive.files.list({
      q: `modifiedTime > '${since.toISOString()}' and trashed = false`,
      fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,thumbnailLink)',
      pageSize: 200,
    });

    return (response.data.files ?? []).map((f) => ({
      externalId: f.id!,
      changeType: 'updated' as const,
      asset: this.normalizeFile(f),
      changedAt: new Date(f.modifiedTime ?? Date.now()),
    }));
  }

  private normalizeFile(file: drive_v3.Schema$File): NormalizedAsset {
    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';

    return this.buildNormalizedAsset({
      id: file.id!,
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
