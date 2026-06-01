import type {
  ConnectorType,
  ConnectorCategory,
  HealthStatus,
  NormalizedAsset,
  AssetChange,
  ListOptions,
  EncryptedCredentials,
  ChangeHandler,
} from '@hybridshare/shared/types/connector';
import { logger } from '../utils/logger';

export abstract class BaseConnector {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly type: ConnectorType;
  abstract readonly category: ConnectorCategory;

  protected credentials: Record<string, unknown> = {};
  protected isConnected = false;
  private changeHandlers: ChangeHandler[] = [];

  abstract connect(credentials: Record<string, unknown>): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract testConnection(): Promise<HealthStatus>;

  abstract listAssets(path?: string, options?: ListOptions): Promise<NormalizedAsset[]>;
  abstract getAsset(assetId: string): Promise<NormalizedAsset>;
  abstract searchAssets(query: string): Promise<NormalizedAsset[]>;

  abstract fetchContent(assetId: string): Promise<Buffer>;
  abstract pushContent(assetId: string, content: Buffer, metadata?: Record<string, unknown>): Promise<void>;
  abstract deleteAsset(assetId: string): Promise<void>;

  abstract getChanges(since: Date): Promise<AssetChange[]>;

  async subscribeToChanges(handler: ChangeHandler): Promise<void> {
    this.changeHandlers.push(handler);
    logger.debug('Change handler registered', { connectorId: this.id });
  }

  protected async emitChange(change: AssetChange): Promise<void> {
    for (const handler of this.changeHandlers) {
      try {
        await handler(change);
      } catch (err) {
        logger.error('Change handler error', { connectorId: this.id, err });
      }
    }
  }

  protected normalizeDate(dateValue: unknown): Date | null {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const d = new Date(dateValue);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  protected buildNormalizedAsset(partial: Partial<NormalizedAsset> & { id: string; name: string; path: string }): NormalizedAsset {
    return {
      connectorId: this.id,
      externalId: partial.id,
      type: partial.type ?? 'file',
      mimeType: partial.mimeType ?? null,
      size: partial.size ?? null,
      url: partial.url ?? null,
      thumbnailUrl: partial.thumbnailUrl ?? null,
      metadata: partial.metadata ?? {},
      tags: partial.tags ?? [],
      createdAt: partial.createdAt ?? null,
      updatedAt: partial.updatedAt ?? null,
      fetchedAt: new Date(),
      ...partial,
    };
  }

  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delayMs = 1000
  ): Promise<T> {
    let lastError: Error = new Error('Operation failed');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        logger.warn(`Connector operation attempt ${attempt} failed`, {
          connectorId: this.id,
          error: lastError.message,
        });

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
        }
      }
    }

    throw lastError;
  }
}
