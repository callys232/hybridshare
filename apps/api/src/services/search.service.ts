import {
  getMeilisearch,
  SEARCH_INDEXES,
  indexDocument,
  updateDocument,
  deleteDocument,
  searchIndex,
} from '../config/meilisearch';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import type { File, Workspace, User } from '@prisma/client';

export class SearchService {
  async search(
    query: string,
    options: {
      workspaceId?: string;
      type?: string;
      dateFrom?: string;
      dateTo?: string;
      userId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const filters: string[] = [];

    if (options.workspaceId) {
      filters.push(`workspaceId = "${options.workspaceId}"`);
    }

    if (options.type) {
      filters.push(`mimeType CONTAINS "${options.type}"`);
    }

    if (options.dateFrom || options.dateTo) {
      const from = options.dateFrom ? new Date(options.dateFrom).getTime() : 0;
      const to = options.dateTo ? new Date(options.dateTo).getTime() : Date.now();
      filters.push(`createdAtTimestamp ${from} TO ${to}`);
    }

    filters.push('status = "ACTIVE"');

    const filterStr = filters.join(' AND ');

    const [filesResult, workspacesResult] = await Promise.allSettled([
      searchIndex(SEARCH_INDEXES.FILES, query, {
        filter: filterStr,
        limit: options.limit ?? 20,
        offset: options.offset ?? 0,
        sort: ['updatedAt:desc'],
      }),
      query.length >= 2
        ? searchIndex(SEARCH_INDEXES.WORKSPACES, query, { limit: 5 })
        : Promise.resolve({ hits: [] }),
    ]);

    return {
      files: filesResult.status === 'fulfilled' ? filesResult.value.hits : [],
      workspaces: workspacesResult.status === 'fulfilled' ? workspacesResult.value.hits : [],
      totalFiles: filesResult.status === 'fulfilled' ? (filesResult.value.estimatedTotalHits ?? 0) : 0,
    };
  }

  async indexFile(file: File & { tags?: Array<{ name: string }> }): Promise<void> {
    await indexDocument(SEARCH_INDEXES.FILES, {
      id: file.id,
      name: file.name,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: Number(file.size),
      extension: file.extension,
      description: file.description,
      workspaceId: file.workspaceId,
      folderId: file.folderId,
      uploadedById: file.uploadedById,
      status: file.status,
      isStarred: file.isStarred,
      tags: file.tags?.map((t) => t.name) ?? [],
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      createdAtTimestamp: file.createdAt.getTime(),
    }).catch((err) => logger.warn('Failed to index file', { fileId: file.id, err }));
  }

  async updateFile(file: File & { tags?: Array<{ name: string }> }): Promise<void> {
    await updateDocument(SEARCH_INDEXES.FILES, {
      id: file.id,
      name: file.name,
      description: file.description,
      tags: file.tags?.map((t) => t.name) ?? [],
      updatedAt: file.updatedAt.toISOString(),
    }).catch((err) => logger.warn('Failed to update file index', { fileId: file.id, err }));
  }

  async removeFile(fileId: string): Promise<void> {
    await deleteDocument(SEARCH_INDEXES.FILES, fileId).catch((err) =>
      logger.warn('Failed to remove file from index', { fileId, err })
    );
  }

  async reindex(): Promise<{ indexed: number }> {
    let indexed = 0;
    const batchSize = 100;
    let cursor = 0;

    while (true) {
      const files = await prisma.file.findMany({
        where: { status: 'ACTIVE' },
        skip: cursor,
        take: batchSize,
        include: { tags: true },
      });

      if (files.length === 0) break;

      const documents = files.map((file) => ({
        id: file.id,
        name: file.name,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: Number(file.size),
        extension: file.extension,
        description: file.description,
        workspaceId: file.workspaceId,
        folderId: file.folderId,
        uploadedById: file.uploadedById,
        status: file.status,
        isStarred: file.isStarred,
        tags: file.tags.map((t) => t.name),
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
        createdAtTimestamp: file.createdAt.getTime(),
      }));

      await getMeilisearch().index(SEARCH_INDEXES.FILES).addDocuments(documents);
      indexed += files.length;
      cursor += batchSize;
    }

    logger.info('Search reindex complete', { indexed });
    return { indexed };
  }
}

export const searchService = new SearchService();
