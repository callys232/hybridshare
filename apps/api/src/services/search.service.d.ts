import type { File } from '@prisma/client';
export declare class SearchService {
    search(query: string, options?: {
        workspaceId?: string;
        type?: string;
        dateFrom?: string;
        dateTo?: string;
        userId?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        files: import("meilisearch").Hits<Record<string, any>>;
        workspaces: import("meilisearch").Hits<Record<string, any>>;
        totalFiles: number;
    }>;
    indexFile(file: File & {
        tags?: Array<{
            name: string;
        }>;
    }): Promise<void>;
    updateFile(file: File & {
        tags?: Array<{
            name: string;
        }>;
    }): Promise<void>;
    removeFile(fileId: string): Promise<void>;
    reindex(): Promise<{
        indexed: number;
    }>;
}
export declare const searchService: SearchService;
//# sourceMappingURL=search.service.d.ts.map