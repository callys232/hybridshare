import type { PaginationMeta } from '@hybridshare/shared/utils/format';
export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginationResult<T> {
    items: T[];
    meta: PaginationMeta;
}
export declare function parsePagination(query: PaginationQuery): {
    skip: number;
    take: number;
    page: number;
    limit: number;
};
export declare function buildMeta(total: number, page: number, limit: number): PaginationMeta;
export declare function buildOrderBy(sortBy: string | undefined, sortOrder: 'asc' | 'desc' | undefined, allowedFields: string[], defaultField?: string): Record<string, 'asc' | 'desc'>;
export declare function apiResponse<T>(data: T, meta?: PaginationMeta): {
    success: true;
    data: T;
    error: null;
    meta?: PaginationMeta;
};
export declare function apiError(error: string, statusCode?: number): {
    success: false;
    data: null;
    error: string;
    statusCode: number;
};
//# sourceMappingURL=paginate.d.ts.map