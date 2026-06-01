"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEARCH_INDEXES = void 0;
exports.getMeilisearch = getMeilisearch;
exports.initializeMeilisearch = initializeMeilisearch;
exports.checkMeilisearchHealth = checkMeilisearchHealth;
exports.indexDocument = indexDocument;
exports.updateDocument = updateDocument;
exports.deleteDocument = deleteDocument;
exports.searchIndex = searchIndex;
const meilisearch_1 = require("meilisearch");
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
let searchClient = null;
function getMeilisearch() {
    if (!searchClient) {
        searchClient = new meilisearch_1.MeiliSearch({
            host: env_1.env.MEILISEARCH_HOST,
            apiKey: env_1.env.MEILISEARCH_API_KEY,
        });
    }
    return searchClient;
}
exports.SEARCH_INDEXES = {
    FILES: 'files',
    USERS: 'users',
    WORKSPACES: 'workspaces',
    ASSETS: 'udc_assets',
};
async function initializeMeilisearch() {
    const client = getMeilisearch();
    try {
        await client.index(exports.SEARCH_INDEXES.FILES).updateSettings({
            searchableAttributes: ['name', 'originalName', 'description', 'tags', 'mimeType'],
            filterableAttributes: ['workspaceId', 'folderId', 'uploadedById', 'mimeType', 'status', 'isStarred'],
            sortableAttributes: ['createdAt', 'updatedAt', 'size', 'name'],
            rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
        });
        await client.index(exports.SEARCH_INDEXES.WORKSPACES).updateSettings({
            searchableAttributes: ['name', 'description'],
            filterableAttributes: ['ownerId', 'type', 'isPublic'],
            sortableAttributes: ['createdAt', 'name'],
        });
        await client.index(exports.SEARCH_INDEXES.USERS).updateSettings({
            searchableAttributes: ['name', 'email'],
            filterableAttributes: ['role', 'isActive'],
            sortableAttributes: ['name', 'createdAt'],
        });
        await client.index(exports.SEARCH_INDEXES.ASSETS).updateSettings({
            searchableAttributes: ['name', 'path', 'tags'],
            filterableAttributes: ['connectorId', 'type', 'mimeType'],
            sortableAttributes: ['name', 'createdAt', 'updatedAt'],
        });
        logger_1.logger.info('Meilisearch indexes initialized');
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize Meilisearch indexes', { error });
        throw error;
    }
}
async function checkMeilisearchHealth() {
    try {
        const health = await getMeilisearch().health();
        return health.status === 'available';
    }
    catch {
        return false;
    }
}
async function indexDocument(indexName, document) {
    await getMeilisearch().index(indexName).addDocuments([document]);
}
async function updateDocument(indexName, document) {
    await getMeilisearch().index(indexName).updateDocuments([document]);
}
async function deleteDocument(indexName, id) {
    await getMeilisearch().index(indexName).deleteDocument(id);
}
async function searchIndex(indexName, query, options = {}) {
    return getMeilisearch().index(indexName).search(query, {
        filter: options.filter,
        sort: options.sort,
        limit: options.limit ?? 20,
        offset: options.offset ?? 0,
    });
}
//# sourceMappingURL=meilisearch.js.map