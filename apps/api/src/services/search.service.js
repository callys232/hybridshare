"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchService = exports.SearchService = void 0;
const meilisearch_1 = require("../config/meilisearch");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
class SearchService {
    async search(query, options = {}) {
        const filters = [];
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
            (0, meilisearch_1.searchIndex)(meilisearch_1.SEARCH_INDEXES.FILES, query, {
                filter: filterStr,
                limit: options.limit ?? 20,
                offset: options.offset ?? 0,
                sort: ['updatedAt:desc'],
            }),
            query.length >= 2
                ? (0, meilisearch_1.searchIndex)(meilisearch_1.SEARCH_INDEXES.WORKSPACES, query, { limit: 5 })
                : Promise.resolve({ hits: [] }),
        ]);
        return {
            files: filesResult.status === 'fulfilled' ? filesResult.value.hits : [],
            workspaces: workspacesResult.status === 'fulfilled' ? workspacesResult.value.hits : [],
            totalFiles: filesResult.status === 'fulfilled' ? (filesResult.value.estimatedTotalHits ?? 0) : 0,
        };
    }
    async indexFile(file) {
        await (0, meilisearch_1.indexDocument)(meilisearch_1.SEARCH_INDEXES.FILES, {
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
        }).catch((err) => logger_1.logger.warn('Failed to index file', { fileId: file.id, err }));
    }
    async updateFile(file) {
        await (0, meilisearch_1.updateDocument)(meilisearch_1.SEARCH_INDEXES.FILES, {
            id: file.id,
            name: file.name,
            description: file.description,
            tags: file.tags?.map((t) => t.name) ?? [],
            updatedAt: file.updatedAt.toISOString(),
        }).catch((err) => logger_1.logger.warn('Failed to update file index', { fileId: file.id, err }));
    }
    async removeFile(fileId) {
        await (0, meilisearch_1.deleteDocument)(meilisearch_1.SEARCH_INDEXES.FILES, fileId).catch((err) => logger_1.logger.warn('Failed to remove file from index', { fileId, err }));
    }
    async reindex() {
        let indexed = 0;
        const batchSize = 100;
        let cursor = 0;
        while (true) {
            const files = await database_1.prisma.file.findMany({
                where: { status: 'ACTIVE' },
                skip: cursor,
                take: batchSize,
                include: { tags: true },
            });
            if (files.length === 0)
                break;
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
            await (0, meilisearch_1.getMeilisearch)().index(meilisearch_1.SEARCH_INDEXES.FILES).addDocuments(documents);
            indexed += files.length;
            cursor += batchSize;
        }
        logger_1.logger.info('Search reindex complete', { indexed });
        return { indexed };
    }
}
exports.SearchService = SearchService;
exports.searchService = new SearchService();
//# sourceMappingURL=search.service.js.map