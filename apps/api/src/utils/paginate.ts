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

export function parsePagination(query: PaginationQuery): {
  skip: number;
  take: number;
  page: number;
  limit: number;
} {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
}

export function buildMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function buildOrderBy(
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc' | undefined,
  allowedFields: string[],
  defaultField = 'createdAt'
): Record<string, 'asc' | 'desc'> {
  const field = sortBy && allowedFields.includes(sortBy) ? sortBy : defaultField;
  const order = sortOrder === 'asc' ? 'asc' : 'desc';
  return { [field]: order };
}

export function apiResponse<T>(
  data: T,
  meta?: PaginationMeta
): { success: true; data: T; error: null; meta?: PaginationMeta } {
  return { success: true, data, error: null, ...(meta ? { meta } : {}) };
}

export function apiError(
  error: string,
  statusCode = 500
): { success: false; data: null; error: string; statusCode: number } {
  return { success: false, data: null, error, statusCode };
}
