import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { BaseConnector } from '../base.connector';
import {
  ConnectorType,
  ConnectorCategory,
  HealthStatus,
  NormalizedAsset,
  AssetChange,
  ListOptions,
} from '@hybridshare/shared/types/connector';

export class S3Connector extends BaseConnector {
  readonly id = 's3';
  readonly name = 'Amazon S3 / MinIO';
  readonly type = ConnectorType.S3;
  readonly category = ConnectorCategory.CLOUD;

  private client: S3Client | null = null;
  private bucket = '';

  async connect(credentials: Record<string, unknown>): Promise<void> {
    const { accessKeyId, secretAccessKey, region, bucket, endpoint } = credentials as {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
      bucket: string;
      endpoint?: string;
    };

    this.client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });

    this.bucket = bucket;
    this.credentials = credentials;
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    this.client?.destroy();
    this.client = null;
    this.isConnected = false;
  }

  async testConnection(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      if (!this.client) throw new Error('Not connected');
      await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, MaxKeys: 1 }));
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

  async listAssets(path = '', options: ListOptions = {}): Promise<NormalizedAsset[]> {
    if (!this.client) throw new Error('Not connected');

    const prefix = path ? (path.endsWith('/') ? path : `${path}/`) : '';
    const assets: NormalizedAsset[] = [];

    let continuationToken: string | undefined;

    do {
      const response: ListObjectsV2CommandOutput = await this.withRetry(() =>
        this.client!.send(
          new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: prefix,
            Delimiter: options.recursive ? undefined : '/',
            MaxKeys: options.limit ?? 100,
            ContinuationToken: continuationToken,
          })
        )
      );

      for (const prefix of response.CommonPrefixes ?? []) {
        if (prefix.Prefix) {
          assets.push(
            this.buildNormalizedAsset({
              id: prefix.Prefix,
              name: prefix.Prefix.split('/').filter(Boolean).pop() ?? prefix.Prefix,
              type: 'folder',
              path: prefix.Prefix,
            })
          );
        }
      }

      for (const obj of response.Contents ?? []) {
        if (!obj.Key) continue;
        const url = await getSignedUrl(
          this.client!,
          new GetObjectCommand({ Bucket: this.bucket, Key: obj.Key }),
          { expiresIn: 3600 }
        );

        assets.push(
          this.buildNormalizedAsset({
            id: obj.Key,
            name: obj.Key.split('/').pop() ?? obj.Key,
            type: 'file',
            size: obj.Size ?? null,
            path: obj.Key,
            url,
            updatedAt: obj.LastModified ?? null,
            metadata: { etag: obj.ETag, storageClass: obj.StorageClass },
          })
        );
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken && assets.length < (options.limit ?? 100));

    return assets;
  }

  async getAsset(assetId: string): Promise<NormalizedAsset> {
    if (!this.client) throw new Error('Not connected');

    const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: assetId }));
    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: assetId }),
      { expiresIn: 3600 }
    );

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

  async searchAssets(query: string): Promise<NormalizedAsset[]> {
    const all = await this.listAssets('', { recursive: true, limit: 1000 });
    return all.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
  }

  async fetchContent(assetId: string): Promise<Buffer> {
    if (!this.client) throw new Error('Not connected');

    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: assetId })
    );

    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  async pushContent(assetId: string, content: Buffer, metadata?: Record<string, unknown>): Promise<void> {
    if (!this.client) throw new Error('Not connected');

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: assetId,
        Body: content,
        ContentType: (metadata?.mimeType as string) ?? 'application/octet-stream',
      })
    );
  }

  async deleteAsset(assetId: string): Promise<void> {
    if (!this.client) throw new Error('Not connected');
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: assetId }));
  }

  async getChanges(since: Date): Promise<AssetChange[]> {
    const all = await this.listAssets('', { recursive: true, limit: 500 });
    return all
      .filter((a) => a.updatedAt && a.updatedAt > since)
      .map((a) => ({ externalId: a.id, changeType: 'updated' as const, asset: a, changedAt: a.updatedAt! }));
  }
}
