export declare function formatBytes(bytes: number, decimals?: number): string;
export declare function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string;
export declare function formatDateTime(date: Date | string): string;
export declare function formatRelativeTime(date: Date | string): string;
export declare function truncate(str: string, length: number): string;
export declare function slugify(str: string): string;
export declare function getFileExtension(filename: string): string;
export declare function getMimeTypeIcon(mimeType: string): string;
export declare function generateToken(length?: number): string;
export declare function buildApiResponse<T>(data: T | null, error?: string | null, meta?: Record<string, unknown>): {
    meta?: Record<string, unknown> | undefined;
    success: boolean;
    data: T | null;
    error: string | null;
};
export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export declare function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta;
//# sourceMappingURL=format.d.ts.map