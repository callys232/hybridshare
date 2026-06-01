import { MeiliSearch } from 'meilisearch';
export declare function getMeilisearch(): MeiliSearch;
export declare const SEARCH_INDEXES: {
    readonly FILES: "files";
    readonly USERS: "users";
    readonly WORKSPACES: "workspaces";
    readonly ASSETS: "udc_assets";
};
export declare function initializeMeilisearch(): Promise<void>;
export declare function checkMeilisearchHealth(): Promise<boolean>;
export declare function indexDocument(indexName: string, document: Record<string, unknown>): Promise<void>;
export declare function updateDocument(indexName: string, document: Record<string, unknown>): Promise<void>;
export declare function deleteDocument(indexName: string, id: string): Promise<void>;
export declare function searchIndex(indexName: string, query: string, options?: {
    filter?: string;
    sort?: string[];
    limit?: number;
    offset?: number;
}): Promise<import("meilisearch").SearchResponse<Record<string, any>, {
    filter: string | undefined;
    sort: string[] | undefined;
    limit: number;
    offset: number;
}>>;
//# sourceMappingURL=meilisearch.d.ts.map