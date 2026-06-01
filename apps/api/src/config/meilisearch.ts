import { MeiliSearch } from 'meilisearch';
import { env } from './env';
import { logger } from '../utils/logger';

let searchClient: MeiliSearch | null = null;

export function getMeilisearch(): MeiliSearch {
  if (!searchClient) {
    searchClient = new MeiliSearch({
      host: env.MEILISEARCH_HOST,
      apiKey: env.MEILISEARCH_API_KEY,
    });
  }
  return searchClient;
}

export const SEARCH_INDEXES = {
  FILES: 'files',
  USERS: 'users',
  WORKSPACES: 'workspaces',
  ASSETS: 'udc_assets',
} as const;

export async function initializeMeilisearch(): Promise<void> {
  const client = getMeilisearch();

  try {
    await client.index(SEARCH_INDEXES.FILES).updateSettings({
      searchableAttributes: ['name', 'originalName', 'description', 'tags', 'mimeType'],
      filterableAttributes: ['workspaceId', 'folderId', 'uploadedById', 'mimeType', 'status', 'isStarred'],
      sortableAttributes: ['createdAt', 'updatedAt', 'size', 'name'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    });

    await client.index(SEARCH_INDEXES.WORKSPACES).updateSettings({
      searchableAttributes: ['name', 'description'],
      filterableAttributes: ['ownerId', 'type', 'isPublic'],
      sortableAttributes: ['createdAt', 'name'],
    });

    await client.index(SEARCH_INDEXES.USERS).updateSettings({
      searchableAttributes: ['name', 'email'],
      filterableAttributes: ['role', 'isActive'],
      sortableAttributes: ['name', 'createdAt'],
    });

    await client.index(SEARCH_INDEXES.ASSETS).updateSettings({
      searchableAttributes: ['name', 'path', 'tags'],
      filterableAttributes: ['connectorId', 'type', 'mimeType'],
      sortableAttributes: ['name', 'createdAt', 'updatedAt'],
    });

    logger.info('Meilisearch indexes initialized');
  } catch (error) {
    logger.error('Failed to initialize Meilisearch indexes', { error });
    throw error;
  }
}

export async function checkMeilisearchHealth(): Promise<boolean> {
  try {
    const health = await getMeilisearch().health();
    return health.status === 'available';
  } catch {
    return false;
  }
}

export async function indexDocument(
  indexName: string,
  document: Record<string, unknown>
): Promise<void> {
  await getMeilisearch().index(indexName).addDocuments([document]);
}

export async function updateDocument(
  indexName: string,
  document: Record<string, unknown>
): Promise<void> {
  await getMeilisearch().index(indexName).updateDocuments([document]);
}

export async function deleteDocument(indexName: string, id: string): Promise<void> {
  await getMeilisearch().index(indexName).deleteDocument(id);
}

export async function searchIndex(
  indexName: string,
  query: string,
  options: {
    filter?: string;
    sort?: string[];
    limit?: number;
    offset?: number;
  } = {}
) {
  return getMeilisearch().index(indexName).search(query, {
    filter: options.filter,
    sort: options.sort,
    limit: options.limit ?? 20,
    offset: options.offset ?? 0,
  });
}
